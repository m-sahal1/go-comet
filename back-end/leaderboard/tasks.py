from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, F, Q, Avg
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging
import newrelic.agent

from .models import GameSession, LeaderboardEntry
from .serializers import LeaderboardEntrySerializer

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def update_all_ranks(self):
    """
    Background task to update all leaderboard ranks.
    This is more efficient than updating ranks individually.
    """
    try:
        logger.info("Starting bulk rank update task")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'update_all_ranks')
        
        with transaction.atomic():
            # Get all entries ordered by total_score (descending)
            entries = LeaderboardEntry.objects.select_for_update().order_by('-total_score')
            
            # Track performance metrics
            total_entries = len(entries)
            newrelic.agent.add_custom_attribute('total_entries', total_entries)
            
            # Update ranks in batch
            updates = []
            for rank, entry in enumerate(entries, 1):
                if entry.rank != rank:
                    entry.rank = rank
                    updates.append(entry)
            
            if updates:
                LeaderboardEntry.objects.bulk_update(updates, ['rank'], batch_size=1000)
                logger.info(f"Updated ranks for {len(updates)} entries")
            else:
                logger.info("No rank updates needed")
            
            # Record rank update results
            newrelic.agent.record_custom_event('AllRanksUpdated', {
                'total_entries': total_entries,
                'updated_count': len(updates),
                'unchanged_count': total_entries - len(updates)
            })
            
            # Record success metrics
            newrelic.agent.record_custom_metric('Custom/Tasks/UpdateAllRanks/Success', 1)
            newrelic.agent.record_custom_metric('Custom/Tasks/UpdateAllRanks/EntriesProcessed', total_entries)
            newrelic.agent.record_custom_metric('Custom/Tasks/UpdateAllRanks/EntriesUpdated', len(updates))
        
        return f"Successfully updated {len(updates)} ranks"
        
    except Exception as exc:
        logger.error(f"Error in update_all_ranks: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def cache_top_leaderboard(self):
    """
    Background task to cache the top leaderboard entries.
    """
    try:
        logger.info("Starting leaderboard cache update")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'cache_top_leaderboard')
        
        # Get top 50 entries (cache more than we typically show)
        top_entries = LeaderboardEntry.objects.select_related('user').filter(
            total_score__gt=0
        ).order_by('-total_score')[:50]
        
        # Track cache performance
        newrelic.agent.add_custom_attribute('cached_entries_count', len(top_entries))
        
        # Serialize the data
        serializer = LeaderboardEntrySerializer(top_entries, many=True)
        cached_data = serializer.data
        
        # Cache for 5 minutes
        cache.set('leaderboard_top_50', cached_data, 300)
        
        logger.info(f"Cached {len(cached_data)} leaderboard entries")
        return f"Successfully cached {len(cached_data)} entries"
        
    except Exception as exc:
        logger.error(f"Error in cache_top_leaderboard: {str(exc)}")
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def cleanup_old_game_sessions(self):
    """
    Background task to cleanup old game sessions (older than 1 year).
    """
    try:
        logger.info("Starting game session cleanup")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'cleanup_old_game_sessions')
        
        # Delete sessions older than 1 year
        cutoff_date = timezone.now() - timedelta(days=365)
        
        deleted_count, _ = GameSession.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()
        
        logger.info(f"Deleted {deleted_count} old game sessions")
        return f"Successfully deleted {deleted_count} old sessions"
        
    except Exception as exc:
        logger.error(f"Error in cleanup_old_game_sessions: {str(exc)}")
        raise self.retry(exc=exc, countdown=300)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def update_user_rank(self, user_id):
    """
    Background task to update a specific user's rank.
    Called after score submission for immediate rank update.
    """
    try:
        logger.info(f"Updating rank for user {user_id}")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'update_user_rank')
        newrelic.agent.add_custom_attribute('user_id', user_id)
        
        # Get the user's leaderboard entry
        try:
            entry = LeaderboardEntry.objects.select_for_update().get(user_id=user_id)
        except LeaderboardEntry.DoesNotExist:
            newrelic.agent.record_custom_event('TaskError', {
                'task_name': 'update_user_rank',
                'error_type': 'user_not_found',
                'user_id': user_id
            })
            logger.warning(f"No leaderboard entry found for user {user_id}")
            return f"No leaderboard entry for user {user_id}"
        
        # Calculate new rank
        better_players_count = LeaderboardEntry.objects.filter(
            total_score__gt=entry.total_score
        ).count()
        new_rank = better_players_count + 1
        
        # Update if different
        if entry.rank != new_rank:
            old_rank = entry.rank
            entry.rank = new_rank
            entry.save(update_fields=['rank'])
            
            # Record rank change event
            newrelic.agent.record_custom_event('RankUpdated', {
                'user_id': user_id,
                'old_rank': old_rank,
                'new_rank': new_rank,
                'total_score': entry.total_score
            })
            
            logger.info(f"Updated user {user_id} rank to {new_rank}")
            
            # Invalidate cache if user is in top 50
            if new_rank <= 50:
                cache.delete('leaderboard_top_50')
        
        return f"Updated rank for user {user_id} to {new_rank}"
        
    except Exception as exc:
        logger.error(f"Error in update_user_rank for user {user_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def calculate_game_mode_stats(self):
    """
    Background task to calculate and cache game mode statistics.
    """
    try:
        logger.info("Calculating game mode statistics")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'calculate_game_mode_stats')
        
        # Calculate stats for each game mode
        stats = GameSession.objects.values('game_mode').annotate(
            total_sessions=Count('id'),
            avg_score=F('score__avg'),
            max_score=F('score__max'),
            min_score=F('score__min'),
            unique_players=Count('user', distinct=True)
        ).order_by('-total_sessions')
        
        # Track statistics
        stats_count = len(stats)
        newrelic.agent.add_custom_attribute('game_modes_count', stats_count)
        
        # Cache the results for 15 minutes
        cache.set('game_mode_stats', list(stats), 900)
        
        logger.info(f"Calculated stats for {len(stats)} game modes")
        return f"Successfully calculated stats for {len(stats)} game modes"
        
    except Exception as exc:
        logger.error(f"Error in calculate_game_mode_stats: {str(exc)}")
        raise self.retry(exc=exc, countdown=120)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def send_rank_notification(self, user_id, old_rank, new_rank):
    """
    Background task to send notifications when user rank changes significantly.
    """
    try:
        logger.info(f"Sending rank notification for user {user_id}")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'send_rank_notification')
        newrelic.agent.add_custom_attribute('user_id', user_id)
        newrelic.agent.add_custom_attribute('old_rank', old_rank)
        newrelic.agent.add_custom_attribute('new_rank', new_rank)
        
        # Only send notifications for significant rank changes
        if old_rank is None or new_rank is None:
            return "No notification needed for new players"
        
        rank_change = old_rank - new_rank
        
        # Notify if rank improved by 10 or more positions, or reached top 10
        if rank_change >= 10 or new_rank <= 10:
            # Here you would integrate with your notification system
            # For now, we'll just log it
            logger.info(f"User {user_id} rank changed from {old_rank} to {new_rank}")
            
            # Example: Send email, push notification, etc.
            # send_email_notification(user_id, old_rank, new_rank)
            # send_push_notification(user_id, old_rank, new_rank)
        
        return f"Processed rank notification for user {user_id}"
        
    except Exception as exc:
        logger.error(f"Error in send_rank_notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
@newrelic.agent.background_task()
def generate_leaderboard_report(self):
    """
    Background task to generate daily leaderboard reports.
    """
    try:
        logger.info("Generating leaderboard report")
        
        # Add custom New Relic attributes
        newrelic.agent.add_custom_attribute('task_name', 'generate_leaderboard_report')
        
        # Get current date
        today = timezone.now().date()
        
        # Calculate daily stats
        daily_sessions = GameSession.objects.filter(
            timestamp__date=today
        ).count()
        
        daily_new_players = LeaderboardEntry.objects.filter(
            user__date_joined__date=today
        ).count()
        
        top_scorer_today = GameSession.objects.filter(
            timestamp__date=today
        ).order_by('-score').first()
        
        # Cache the report
        report_data = {
            'date': today.isoformat(),
            'daily_sessions': daily_sessions,
            'daily_new_players': daily_new_players,
            'top_scorer': {
                'user': top_scorer_today.user.username if top_scorer_today else None,
                'score': top_scorer_today.score if top_scorer_today else None,
                'game_mode': top_scorer_today.game_mode if top_scorer_today else None,
            } if top_scorer_today else None
        }
        
        cache.set(f'daily_report_{today.isoformat()}', report_data, 86400)  # 24 hours
        
        logger.info(f"Generated report for {today}")
        return f"Successfully generated report for {today}"
        
    except Exception as exc:
        logger.error(f"Error in generate_leaderboard_report: {str(exc)}")
        raise self.retry(exc=exc, countdown=300) 