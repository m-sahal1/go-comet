from django.urls import path
from . import views

app_name = 'leaderboard'

urlpatterns = [
    path('submit/', views.submit_score, name='submit_score'),
    path('top/', views.get_leaderboard, name='get_leaderboard'),
    path('rank/<int:user_id>/', views.get_player_rank, name='get_player_rank'),
] 