import React, { useState, useEffect, useCallback } from 'react';
import { leaderboardService } from '../services/api';
import { transformLeaderboardData, formatApiError } from '../utils/apiHelpers';
import './LeaderboardTable.css';

const LeaderboardTable = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch leaderboard data from API
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Fetching leaderboard data...');
      const rawData = await leaderboardService.getTopPlayers();
      const transformedData = transformLeaderboardData(rawData?.results);
      setPlayers(transformedData);
      setLastUpdated(new Date());
      console.log('✅ Leaderboard data loaded:', transformedData.length, 'players');
      
    } catch (err) {
      console.error('❌ Failed to fetch leaderboard:', err);
      const errorInfo = formatApiError(err);
      setError(errorInfo.message);
      
      // Fallback to mock data if API fails
      if (errorInfo.type === 'network' || errorInfo.type === 'server') {
        console.log('🔄 Using fallback mock data');
        const { getMockLeaderboardData } = await import('../utils/apiHelpers');
        setPlayers(getMockLeaderboardData());
        setError('Using offline data - API unavailable');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh leaderboard manually
  const handleRefresh = () => {
    fetchLeaderboard();
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchLeaderboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard, loading]);

  // Loading state
  if (loading && players.length === 0) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // Error state (when no fallback data available)
  if (error && players.length === 0) {
    return (
      <div className="table-container">
        <div className="table-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="retry-button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Table Header with refresh button */}
      <div className="table-header">
        <div className="table-info">
          {error && (
            <div className="table-warning">
              <span className="warning-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button 
          className={`refresh-button ${loading ? 'loading' : ''}`}
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh leaderboard"
        >
          {loading ? '🔄' : '↻'}
        </button>
      </div>

      {/* Leaderboard Table */}
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map(({ rank, username, score, userId }) => (
            <tr key={userId || rank} className={`rank-${rank}`}>
              <td>
                {rank <= 3 ? (
                  <span className="rank-medal">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="rank-number">{rank}</span>
                )}
              </td>
              <td className="username-cell">{username}</td>
              <td>{score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Loading overlay for refresh */}
      {loading && players.length > 0 && (
        <div className="table-loading-overlay">
          <div className="loading-indicator">
            <div className="spinner small"></div>
            Updating...
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && players.length === 0 && (
        <div className="table-empty">
          <p>No leaderboard data available</p>
          <button className="retry-button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable; 