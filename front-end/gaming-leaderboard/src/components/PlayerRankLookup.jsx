import React, { useState, useCallback } from 'react';
import { leaderboardService } from '../services/api';
import { transformPlayerData, formatApiError, validateScoreData } from '../utils/apiHelpers';
import './PlayerRankLookup.css';

const PlayerRankLookup = () => {
  const [userId, setUserId] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateUserId = (id) => {
    if (!id || id.trim().length === 0) {
      return 'Please enter a user ID';
    }
    if (id.trim().length < 2) {
      return 'User ID must be at least 2 characters long';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id.trim())) {
      return 'User ID can only contain letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  const handleSearch = useCallback(async () => {
    const trimmedUserId = userId.trim();
    
    // Validate input
    const validationError = validateUserId(trimmedUserId);
    if (validationError) {
      setError(validationError);
      setPlayerData(null);
      return;
    }

    setLoading(true);
    setError('');
    setPlayerData(null);

    try {
      console.log('🔍 Searching for player:', trimmedUserId);
      const rawData = await leaderboardService.getPlayerRank(trimmedUserId);
      const transformedData = transformPlayerData(rawData);
      
      if (transformedData) {
        setPlayerData(transformedData);
        console.log('✅ Player found:', transformedData);
      } else {
        setError('Invalid player data received');
      }
      
    } catch (err) {
      console.error('❌ Player search failed:', err);
      const errorInfo = formatApiError(err);
      
      // Provide specific error messages
      if (errorInfo.type === 'not_found') {
        setError('Player not found in leaderboard. Please check the username.');
      } else if (errorInfo.type === 'network') {
        setError('Network error. Please check your connection and try again.');
        
        // Try fallback to mock data
        console.log('🔄 Trying fallback mock data...');
        const { getMockPlayerData } = await import('../utils/apiHelpers');
        const mockPlayer = getMockPlayerData(trimmedUserId);
        
        if (mockPlayer) {
          setPlayerData(transformPlayerData(mockPlayer));
          setError('Using offline data - API unavailable');
        }
      } else {
        setError(errorInfo.message);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const clearResults = () => {
    setPlayerData(null);
    setError('');
    setUserId('');
  };

  const getRankSuffix = (rank) => {
    if (rank === null || rank === undefined) return '';
    
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return rank + 'th';
    }
    
    switch (lastDigit) {
      case 1: return rank + 'st';
      case 2: return rank + 'nd';
      case 3: return rank + 'rd';
      default: return rank + 'th';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="player-rank-lookup">
      <div className="search-section">
        <div className="input-group">
          <input
            type="text"
            className="search-input"
            placeholder="Enter player username..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoComplete="off"
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={loading || !userId.trim()}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
        
        {playerData && (
          <button className="clear-button" onClick={clearResults}>
            Clear Results
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Searching for player...</p>
          <small>This may take a few seconds</small>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <div className="error-actions">
            {error.includes('not found') && (
              <small>Try searching for: ShadowHunter, TestUser, or GamerPro</small>
            )}
            {(error.includes('Network') || error.includes('offline')) && (
              <button className="retry-button-small" onClick={handleSearch}>
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {playerData && !loading && (
        <div className={`player-card rank-${playerData.rank}`}>
          <div className="player-info">
            <div className="rank-badge">
              #{getRankSuffix(playerData.rank)}
            </div>
            <div className="player-details">
              <h3 className="player-name">{playerData.username}</h3>
              
              <div className="player-stats">
                <div className="player-score">
                  <span className="score-label">Score:</span>
                  <span className="score-value">{playerData.score.toLocaleString()}</span>
                </div>
                
                <div className="player-meta">
                  <div className="player-country">
                    <span className="country-flag">{playerData.country}</span>
                  </div>
                  
                  {playerData.gameMode && playerData.gameMode !== 'standard' && (
                    <div className="game-mode">
                      <span className="mode-label">Mode:</span>
                      <span className="mode-value">{playerData.gameMode}</span>
                    </div>
                  )}
                  
                  {playerData.timestamp && (
                    <div className="last-played">
                      <span className="time-label">Last played:</span>
                      <span className="time-value">{formatTimeAgo(playerData.timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional stats if available */}
              {(playerData.totalGames > 0 || playerData.avgScore > 0 || playerData.bestScore > 0) && (
                <div className="additional-stats">
                  <h4>Statistics</h4>
                  <div className="stats-grid">
                    {playerData.totalGames > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Games:</span>
                        <span className="stat-value">{playerData.totalGames}</span>
                      </div>
                    )}
                    {playerData.avgScore > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Avg Score:</span>
                        <span className="stat-value">{Math.round(playerData.avgScore).toLocaleString()}</span>
                      </div>
                    )}
                    {playerData.bestScore > 0 && playerData.bestScore !== playerData.score && (
                      <div className="stat-item">
                        <span className="stat-label">Best Score:</span>
                        <span className="stat-value">{playerData.bestScore.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning if using offline data */}
          {error && error.includes('offline') && (
            <div className="offline-warning">
              <span className="warning-icon">📡</span>
              <span>Data may not be current - using offline cache</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerRankLookup; 