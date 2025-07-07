from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db import connection
from django.db.models import F, Count, Q, Prefetch
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
import logging
import newrelic.agent

from .models import GameSession, LeaderboardEntry
from .serializers import GameSessionSerializer, LeaderboardEntrySerializer
from .tasks import update_user_rank, cache_top_leaderboard

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@newrelic.agent.function_trace()
def submit_score(request):
    """
    Submit a new score for the authenticated user.
    POST /api/leaderboard/submit
    Body: {"score": int, "game_mode": str}
    """
    try:
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('user_id', request.user.id)
        newrelic.agent.add_custom_attribute('endpoint', 'submit_score')
        
        score = request.data.get('score')
        game_mode = request.data.get('game_mode', 'default')
        
        # Track score submission metrics
        newrelic.agent.add_custom_attribute('submitted_score', score)
        newrelic.agent.add_custom_attribute('game_mode', game_mode)
        
        # Validate input
        if not isinstance(score, int) or score < 0:
            newrelic.agent.record_custom_event('ScoreSubmissionError', {
                'error_type': 'invalid_score',
                'user_id': request.user.id,
                'submitted_value': score
            })
            return Response(
                {'error': 'Score must be a non-negative integer'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not game_mode or len(game_mode) > 50:
            newrelic.agent.record_custom_event('ScoreSubmissionError', {
                'error_type': 'invalid_game_mode',
                'user_id': request.user.id,
                'game_mode': game_mode
            })
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
                # Update existing entry using F() to avoid race conditions
                leaderboard_entry.total_score = F('total_score') + score
                leaderboard_entry.save(update_fields=['total_score'])
                leaderboard_entry.refresh_from_db()
            
            # Recalculate rank (simple approach for now)
            better_players = LeaderboardEntry.objects.filter(
                total_score__gt=leaderboard_entry.total_score
            ).count()
            leaderboard_entry.rank = better_players + 1
            leaderboard_entry.save(update_fields=['rank'])
            
            # Trigger background task to update user rank and cache
            update_user_rank.delay(request.user.id)
        
        # Record successful score submission
        newrelic.agent.record_custom_event('ScoreSubmitted', {
            'user_id': request.user.id,
            'score': score,
            'game_mode': game_mode,
            'new_total_score': leaderboard_entry.total_score,
            'new_rank': leaderboard_entry.rank,
            'is_new_player': created
        })
        
        # Track custom metrics
        newrelic.agent.record_custom_metric('Custom/Leaderboard/ScoreSubmissions', 1)
        newrelic.agent.record_custom_metric(f'Custom/Leaderboard/GameMode/{game_mode}/Submissions', 1)
        
        # Serialize and return the created game session with optimized query
        game_session = GameSession.objects.select_related('user').get(id=game_session.id)
        serializer = GameSessionSerializer(game_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Record error in New Relic
        newrelic.agent.record_exception()
        logger.error(f"Error in submit_score: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@newrelic.agent.function_trace()
def get_leaderboard(request):
    """
    Get top players from leaderboard.
    GET /api/leaderboard/top
    Query params: limit, offset for pagination
    """
    try:
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('endpoint', 'get_leaderboard')
        
        # Try to get cached leaderboard first
        cached_data = cache.get('leaderboard_top_50')
        if cached_data:
            # Track cache hit
            newrelic.agent.record_custom_metric('Custom/Leaderboard/CacheHits', 1)
            newrelic.agent.add_custom_attribute('cache_hit', True)
            
            # Apply pagination to cached data
            paginator = LimitOffsetPagination()
            paginator.default_limit = 10
            
            # Simulate pagination on cached data
            limit = int(request.GET.get('limit', 10))
            offset = int(request.GET.get('offset', 0))
            
            paginated_data = cached_data[offset:offset + limit]
            
            # Return cached data with pagination info
            return Response({
                'count': len(cached_data),
                'next': None,
                'previous': None,
                'results': paginated_data
            })
        
        # Track cache miss
        newrelic.agent.record_custom_metric('Custom/Leaderboard/CacheMisses', 1)
        newrelic.agent.add_custom_attribute('cache_hit', False)
        
        # Optimized query with select_related to avoid N+1 queries
        queryset = LeaderboardEntry.objects.select_related('user').filter(
            total_score__gt=0
        ).order_by('-total_score')
        
        # Apply pagination
        paginator = LimitOffsetPagination()
        paginator.default_limit = 10  # Default to top 10
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        # Track query performance
        newrelic.agent.add_custom_attribute('query_count', len(paginated_queryset))
        
        # Update ranks for consistency (optimized to avoid individual saves)
        for idx, entry in enumerate(paginated_queryset):
            entry.rank = idx + 1 + paginator.offset
        
        serializer = LeaderboardEntrySerializer(paginated_queryset, many=True)
        response = paginator.get_paginated_response(serializer.data)
        
        # Trigger cache update in background if not cached
        cache_top_leaderboard.delay()
        
        # Record custom metrics
        newrelic.agent.record_custom_metric('Custom/Leaderboard/Requests', 1)
        
        return response
        
    except Exception as e:
        # Record error in New Relic
        newrelic.agent.record_exception()
        logger.error(f"Error in get_leaderboard: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@newrelic.agent.function_trace()
def get_player_rank(request, user_id):
    """
    Get specific player's rank and details.
    GET /api/leaderboard/rank/{user_id}
    """
    try:
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('endpoint', 'get_player_rank')
        newrelic.agent.add_custom_attribute('requested_user_id', user_id)
        
        # Optimized user lookup with only() to fetch minimal data
        try:
            user = User.objects.only('id', 'username', 'date_joined').get(username=user_id)
        except User.DoesNotExist:
            newrelic.agent.record_custom_event('PlayerRankError', {
                'error_type': 'user_not_found',
                'requested_user_id': user_id
            })
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get leaderboard entry with optimized query
        try:
            leaderboard_entry = LeaderboardEntry.objects.select_related('user').get(user=user)
        except LeaderboardEntry.DoesNotExist:
            newrelic.agent.record_custom_event('PlayerRankLookup', {
                'user_id': user_id,
                'has_played': False,
                'rank': None
            })
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
        
        # Calculate current rank efficiently using database aggregation
        better_players_count = LeaderboardEntry.objects.filter(
            total_score__gt=leaderboard_entry.total_score
        ).count()
        current_rank = better_players_count + 1
        
        # Update rank if it's different (optimized with update_fields)
        if leaderboard_entry.rank != current_rank:
            leaderboard_entry.rank = current_rank
            leaderboard_entry.save(update_fields=['rank'])
        
        # Record player rank lookup
        newrelic.agent.record_custom_event('PlayerRankLookup', {
            'user_id': user_id,
            'has_played': True,
            'rank': current_rank,
            'total_score': leaderboard_entry.total_score
        })
        
        # Track custom metrics
        newrelic.agent.record_custom_metric('Custom/Leaderboard/RankLookups', 1)
        serializer = LeaderboardEntrySerializer(leaderboard_entry)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Record error in New Relic
        newrelic.agent.record_exception()
        logger.error(f"Error in get_player_rank: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# # Additional optimized views for common queries
# @api_view(['GET'])
# def get_user_game_history(request, user_id):
#     """
#     Get user's game history with optimized queries.
#     GET /api/leaderboard/user/{user_id}/history
#     """
#     try:
#         # Optimized query with select_related and pagination
#         queryset = GameSession.objects.select_related('user').filter(
#             user_id=user_id
#         ).order_by('-timestamp')
        
#         paginator = LimitOffsetPagination()
#         paginator.default_limit = 20
#         paginated_queryset = paginator.paginate_queryset(queryset, request)
        
#         serializer = GameSessionSerializer(paginated_queryset, many=True)
#         return paginator.get_paginated_response(serializer.data)
        
#     except Exception as e:
#         logger.error(f"Error in get_user_game_history: {str(e)}")
#         return Response(
#             {'error': 'Internal server error'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['GET'])
# def get_game_mode_stats(request):
#     """
#     Get game mode statistics with optimized aggregation.
#     GET /api/leaderboard/stats/modes
#     """
#     try:
#         # Optimized aggregation query
#         stats = GameSession.objects.values('game_mode').annotate(
#             total_sessions=Count('id'),
#             avg_score=F('score__avg'),
#             max_score=F('score__max'),
#             min_score=F('score__min')
#         ).order_by('-total_sessions')
        
#         return Response(list(stats), status=status.HTTP_200_OK)
        
#     except Exception as e:
#         logger.error(f"Error in get_game_mode_stats: {str(e)}")
#         return Response(
#             {'error': 'Internal server error'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# # Query debugging utility (development only)
# def debug_queries(view_func):
#     """Decorator to log query count and execution time for debugging"""
#     def wrapper(*args, **kwargs):
#         from django.conf import settings
#         if settings.DEBUG:
#             initial_queries = len(connection.queries)
#             import time
#             start_time = time.time()
            
#             response = view_func(*args, **kwargs)
            
#             end_time = time.time()
#             query_count = len(connection.queries) - initial_queries
#             execution_time = (end_time - start_time) * 1000
            
#             logger.debug(f"{view_func.__name__}: {query_count} queries in {execution_time:.2f}ms")
            
#             return response
#         return view_func(*args, **kwargs)
#     return wrapper


@api_view(['GET'])
def get_cached_game_mode_stats(request):
    """
    Get cached game mode statistics.
    GET /api/leaderboard/stats/modes
    """
    try:
        # Try to get cached stats first
        cached_stats = cache.get('game_mode_stats')
        if cached_stats:
            return Response(cached_stats, status=status.HTTP_200_OK)
        
        # If not cached, trigger background calculation and return basic stats
        from .tasks import calculate_game_mode_stats
        calculate_game_mode_stats.delay()
        
        # Return a simple response indicating calculation is in progress
        return Response(
            {'message': 'Statistics are being calculated. Please try again in a few moments.'},
            status=status.HTTP_202_ACCEPTED
        )
        
    except Exception as e:
        logger.error(f"Error in get_cached_game_mode_stats: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def trigger_rank_update(request):
    """
    Manually trigger a full rank update (admin only).
    POST /api/leaderboard/admin/update-ranks
    """
    try:
        # Check if user is admin (you might want to add proper permission checking)
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Trigger background rank update
        from .tasks import update_all_ranks
        task = update_all_ranks.delay()
        
        return Response(
            {
                'message': 'Rank update task triggered',
                'task_id': task.id
            }, 
            status=status.HTTP_202_ACCEPTED
        )
        
    except Exception as e:
        logger.error(f"Error in trigger_rank_update: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
