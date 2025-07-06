import React, { useState } from 'react';
import './PlayerRankLookup.css';

// Mock database for player lookup (until API integration in Step 7)
const mockPlayerDatabase = {
  'ShadowHunter': { rank: 1, username: 'ShadowHunter', score: 9870, country: '🇺🇸' },
  'CyberPhoenix': { rank: 2, username: 'CyberPhoenix', score: 9560, country: '🇬🇧' },
  'NeonBlade': { rank: 3, username: 'NeonBlade', score: 9340, country: '🇨🇦' },
  'QuantumKnight': { rank: 4, username: 'QuantumKnight', score: 9125, country: '🇩🇪' },
  'DigitalStorm': { rank: 5, username: 'DigitalStorm', score: 8990, country: '🇫🇷' },
  'LaserRanger': { rank: 6, username: 'LaserRanger', score: 8840, country: '🇯🇵' },
  'PlasmaReaper': { rank: 7, username: 'PlasmaReaper', score: 8720, country: '🇰🇷' },
  'StormDragon': { rank: 8, username: 'StormDragon', score: 8615, country: '🇦🇺' },
  'OrbitronWarrior': { rank: 9, username: 'OrbitronWarrior', score: 8500, country: '🇮🇳' },
  'PixelFury': { rank: 10, username: 'PixelFury', score: 8420, country: '🇧🇷' },
  'TestUser': { rank: 25, username: 'TestUser', score: 7500, country: '🇺🇸' },
  'GamerPro': { rank: 42, username: 'GamerPro', score: 6800, country: '🇬🇧' },
};

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

  const simulateApiCall = (searchId) => {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        const player = mockPlayerDatabase[searchId];
        if (player) {
          resolve(player);
        } else {
          reject(new Error('Player not found in leaderboard'));
        }
      }, 800); // 800ms delay to simulate real API
    });
  };

  const handleSearch = async () => {
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
      const player = await simulateApiCall(trimmedUserId);
      setPlayerData(player);
    } catch (err) {
      setError(err.message || 'Failed to fetch player data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearResults = () => {
    setPlayerData(null);
    setError('');
    setUserId('');
  };

  const getRankSuffix = (rank) => {
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
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
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
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <small>Try searching for: ShadowHunter, TestUser, or GamerPro</small>
        </div>
      )}

      {/* Success State */}
      {playerData && (
        <div className={`player-card rank-${playerData.rank}`}>
          <div className="player-info">
            <div className="rank-badge">
              #{getRankSuffix(playerData.rank)}
            </div>
            <div className="player-details">
              <h3 className="player-name">{playerData.username}</h3>
              <div className="player-score">
                <span className="score-label">Score:</span>
                <span className="score-value">{playerData.score.toLocaleString()}</span>
              </div>
              <div className="player-country">
                <span className="country-flag">{playerData.country}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankLookup; 