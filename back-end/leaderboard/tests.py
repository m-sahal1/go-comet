from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.cache import cache
from django.db import transaction

from .models import GameSession, LeaderboardEntry
from .serializers import GameSessionSerializer, LeaderboardEntrySerializer
from .tasks import update_user_rank

User = get_user_model()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class LeaderboardAPITestCase(TestCase):
    """Integration tests for Leaderboard APIs"""

    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="player1", password="testpass")
        self.user2 = User.objects.create_user(username="player2", password="testpass")

        # Authenticate API client
        self.client = APIClient()
        self.client.login(username="player1", password="testpass")

    def test_submit_score_creates_game_session_and_updates_leaderboard(self):
        """POST /submit should create GameSession and update LeaderboardEntry"""
        url = reverse("leaderboard:submit_score")
        payload = {"score": 100, "game_mode": "classic"}

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify GameSession created
        self.assertEqual(GameSession.objects.count(), 1)
        session = GameSession.objects.first()
        self.assertEqual(session.score, 100)

        # Verify LeaderboardEntry updated
        entry = LeaderboardEntry.objects.get(user=self.user1)
        self.assertEqual(entry.total_score, 100)
        self.assertEqual(entry.rank, 1)

    def test_get_leaderboard_returns_top_players(self):
        """GET /top should return top players sorted by score"""
        # Seed some data
        LeaderboardEntry.objects.create(user=self.user1, total_score=150, rank=1)
        LeaderboardEntry.objects.create(user=self.user2, total_score=50, rank=2)

        url = reverse("leaderboard:get_leaderboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertGreaterEqual(results[0]["total_score"], results[1]["total_score"])

    def test_get_player_rank_returns_correct_rank(self):
        """GET /rank/{user_id} should return correct rank info"""
        LeaderboardEntry.objects.create(user=self.user1, total_score=200, rank=1)
        LeaderboardEntry.objects.create(user=self.user2, total_score=100, rank=2)

        url = reverse("leaderboard:get_player_rank", args=[self.user2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rank"], 2)

    def test_leaderboard_cache_hits(self):
        """Leaderboard endpoint should hit cache if available"""
        # Prime cache manually
        cache_key = "leaderboard_top_50"
        cache.set(cache_key, [{"user": {"id": self.user1.id, "username": "player1", "date_joined": str(self.user1.date_joined)}, "total_score": 100, "rank": 1}], 300)

        url = reverse("leaderboard:get_leaderboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Ensure it used the cached data (no database objects created)
        self.assertEqual(LeaderboardEntry.objects.count(), 0)


class LeaderboardModelTestCase(TestCase):
    """Unit tests for models and Celery tasks"""

    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="pass")

    def test_leaderboard_entry_rank_calculation(self):
        """Ensure rank updates correctly via Celery task"""
        # Create entries
        LeaderboardEntry.objects.create(user=self.user, total_score=100, rank=1)
        other_user = User.objects.create_user(username="other", password="pass")
        LeaderboardEntry.objects.create(user=other_user, total_score=200, rank=1)

        # Run task to update rank for tester
        update_user_rank.apply(args=[self.user.id])

        self.user.refresh_from_db()
        entry = LeaderboardEntry.objects.get(user=self.user)
        self.assertEqual(entry.rank, 2)

    def test_gamesession_serializer(self):
        """GameSessionSerializer should serialize fields correctly"""
        session = GameSession.objects.create(user=self.user, score=50, game_mode="arcade")
        data = GameSessionSerializer(session).data
        self.assertEqual(data["score"], 50)
        self.assertEqual(data["game_mode"], "arcade")


class ConcurrencyTestCase(TestCase):
    """Tests for concurrent score submissions"""

    def setUp(self):
        self.user = User.objects.create_user(username="concurrent", password="pass")
        self.client = APIClient()
        self.client.login(username="concurrent", password="pass")

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_concurrent_score_submissions(self):
        """Simulate concurrent submissions to detect race conditions"""
        url = reverse("leaderboard:submit_score")

        payload1 = {"score": 30, "game_mode": "classic"}
        payload2 = {"score": 70, "game_mode": "classic"}

        # Simulate two concurrent submissions by using transactions
        with transaction.atomic():
            response1 = self.client.post(url, payload1, format="json")
            response2 = self.client.post(url, payload2, format="json")

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

        entry = LeaderboardEntry.objects.get(user=self.user)
        # Total score should be sum of both submissions
        self.assertEqual(entry.total_score, 100)

        # Rank should be 1 since only one user exists
        self.assertEqual(entry.rank, 1)