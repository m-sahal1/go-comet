from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination

from .models import GameSession, LeaderboardEntry
from .serializers import GameSessionSerializer, LeaderboardEntrySerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_score(request):
    """
    Submit a new score for the authenticated user.
    POST /api/leaderboard/submit
    Body: {"score": int, "game_mode": str}
    """
    try:
        score = request.data.get('score')
        game_mode = request.data.get('game_mode', 'default')
        
        # Validate input
        if not isinstance(score, int) or score < 0:
            return Response(
                {'error': 'Score must be a non-negative integer'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not game_mode or len(game_mode) > 50:
            return Response(
                {'error': 'Game mode must be provided and less than 50 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use atomic transaction to ensure consistency
        with transaction.atomic():
            # Create game session
            game_session = GameSession.objects.create(
                user=request.user,
                score=score,
                game_mode=game_mode
            )
            
            # Update or create leaderboard entry
            leaderboard_entry, created = LeaderboardEntry.objects.get_or_create(
                user=request.user,
                defaults={'total_score': score}
            )
            
            if not created:
                # Update existing entry
                leaderboard_entry.total_score = F('total_score') + score
                leaderboard_entry.save(update_fields=['total_score'])
                leaderboard_entry.refresh_from_db()
            
            # Recalculate rank (simple approach for now)
            better_players = LeaderboardEntry.objects.filter(
                total_score__gt=leaderboard_entry.total_score
            ).count()
            leaderboard_entry.rank = better_players + 1
            leaderboard_entry.save(update_fields=['rank'])
        
        # Serialize and return the created game session
        serializer = GameSessionSerializer(game_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_leaderboard(request):
    """
    Get top players from leaderboard.
    GET /api/leaderboard/top
    Query params: limit, offset for pagination
    """
    try:
        # Get top players ordered by total_score (descending)
        queryset = LeaderboardEntry.objects.select_related('user').filter(
            total_score__gt=0
        ).order_by('-total_score')
        print(queryset[0].__dict__)
        # Apply pagination
        paginator = LimitOffsetPagination()
        paginator.default_limit = 10  # Default to top 10
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        # Update ranks for consistency (in production, this would be done via background task)
        for idx, entry in enumerate(paginated_queryset):
            entry.rank = idx + 1 + paginator.offset
        
        serializer = LeaderboardEntrySerializer(paginated_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_player_rank(request, user_id):
    """
    Get specific player's rank and details.
    GET /api/leaderboard/rank/{user_id}
    """
    try:
        # Check if user exists
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get leaderboard entry
        try:
            leaderboard_entry = LeaderboardEntry.objects.select_related('user').get(user=user)
        except LeaderboardEntry.DoesNotExist:
            return Response(
                {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'date_joined': user.date_joined
                    },
                    'total_score': 0,
                    'rank': None,
                    'message': 'User has not played any games yet'
                },
                status=status.HTTP_200_OK
            )
        
        # # Calculate current rank efficiently
        # better_players_count = LeaderboardEntry.objects.filter(
        #     total_score__gt=leaderboard_entry.total_score
        # ).count()
        # current_rank = better_players_count + 1
        
        # # Update rank if it's different (optional optimization)
        # if leaderboard_entry.rank != current_rank:
        #     leaderboard_entry.rank = current_rank
        #     leaderboard_entry.save(update_fields=['rank'])
        
        serializer = LeaderboardEntrySerializer(leaderboard_entry)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
