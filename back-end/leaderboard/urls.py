from django.urls import path
from . import views

app_name = 'leaderboard'

urlpatterns = [
    path('submit/', views.submit_score, name='submit_score'),
    path('top/', views.get_leaderboard, name='get_leaderboard'),
    path('rank/<int:user_id>/', views.get_player_rank, name='get_player_rank'),
    # path('user/<int:user_id>/history/', views.get_user_game_history, name='get_user_game_history'),
    # path('stats/modes/', views.get_game_mode_stats, name='get_game_mode_stats'),
] 