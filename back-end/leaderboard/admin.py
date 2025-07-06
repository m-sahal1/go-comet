from django.contrib import admin

from .models import GameSession, LeaderboardEntry

admin.site.register(GameSession)
admin.site.register(LeaderboardEntry)
