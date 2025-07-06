from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

# Reference the Django User model (id, username unique, date_joined already provided)
User = get_user_model()

class GameSession(models.Model):
    """Represents a single play‐through for a user with a score and mode."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="game_sessions",
        help_text="Player who played this session.",
    )
    score = models.PositiveIntegerField(help_text="Score achieved in this session.")
    game_mode = models.CharField(max_length=50, help_text="Game mode or level identifier.")
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["-score"], name="gamesession_score_idx"),
            models.Index(fields=["user"], name="gamesession_user_idx"),
            models.Index(fields=["game_mode"], name="gamesession_mode_idx"),
            # # Composite indexes for specific query patterns
            # models.Index(fields=["user", "-timestamp"], name="gamesession_user_time_idx"),  # User's recent games
            # models.Index(fields=["game_mode", "-score"], name="gamesession_mode_score_idx"),  # Top scores per mode
        ]
        ordering = ["-timestamp"]
        verbose_name = "Game Session"
        verbose_name_plural = "Game Sessions"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username} | {self.game_mode} | {self.score}"

class LeaderboardEntry(models.Model):
    """Aggregated score per user with rank. Updated atomically on score submissions."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="leaderboard_entry",
        primary_key=True,
        help_text="Player represented on the leaderboard.",
    )
    total_score = models.PositiveBigIntegerField(default=0, db_index=True)
    rank = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["rank"]
        verbose_name = "Leaderboard Entry"
        verbose_name_plural = "Leaderboard Entries"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username} | Score: {self.total_score} | Rank: {self.rank}"
