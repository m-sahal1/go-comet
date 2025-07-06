from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import GameSession, LeaderboardEntry

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class GameSessionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GameSession
        fields = [
            'id',
            'user',
            'score',
            'game_mode',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = [
            'user',
            'total_score',
            'rank',
        ] 