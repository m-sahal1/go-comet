/**
 * API Helper Utilities
 * Provides caching, data transformation, and validation utilities for API operations
 */

/**
 * Simple in-memory cache for API responses
 */
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get cached data if still valid
   * @param {string} key - Cache key
   * @param {number} maxAge - Max age in milliseconds
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key, maxAge = 30000) {
    const data = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (!data || !timestamp) {
      return null;
    }
    
    const age = Date.now() - timestamp;
    if (age > maxAge) {
      this.delete(key);
      return null;
    }
    
    return data;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const apiCache = new ApiCache();

/**
 * Cache keys for different API endpoints
 */
export const CACHE_KEYS = {
  LEADERBOARD_TOP: 'leaderboard_top',
  LEADERBOARD_PERIOD: (period, limit) => `leaderboard_${period}_${limit}`,
  PLAYER_RANK: (userId) => `player_rank_${userId}`,
  PLAYER_STATS: (userId) => `player_stats_${userId}`,
  HEALTH_CHECK: 'health_check',
};

/**
 * Cache TTL (Time To Live) in milliseconds
 */
export const CACHE_TTL = {
  LEADERBOARD: 30000,      // 30 seconds
  PLAYER_RANK: 60000,      // 1 minute
  PLAYER_STATS: 300000,    // 5 minutes
  HEALTH_CHECK: 10000,     // 10 seconds
};

/**
 * Transform raw API leaderboard data to standardized format
 * @param {Array} rawData - Raw API response data
 * @returns {Array} Transformed leaderboard data
 */
export const transformLeaderboardData = (rawData) => {
  if (!Array.isArray(rawData)) {
    console.warn('Invalid leaderboard data format:', rawData);
    return [];
  }

  return rawData.map((player, index) => ({
    rank: player.rank || index + 1,
    username: sanitizeUsername(player.username || player.userId || 'Unknown'),
    score: parseInt(player.score) || 0,
    country: player.country || '🌍',
    userId: player.userId || player.username,
    gameMode: player.gameMode || 'standard',
    timestamp: player.timestamp || player.lastPlayed || new Date().toISOString(),
  }));
};

/**
 * Transform raw player data to standardized format
 * @param {Object} rawData - Raw API response data
 * @returns {Object} Transformed player data
 */
export const transformPlayerData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    console.warn('Invalid player data format:', rawData);
    return null;
  }

  return {
    rank: parseInt(rawData.rank) || null,
    username: sanitizeUsername(rawData.username || rawData.userId || 'Unknown'),
    score: parseInt(rawData.score) || 0,
    country: rawData.country || '🌍',
    userId: rawData.userId || rawData.username,
    gameMode: rawData.gameMode || 'standard',
    timestamp: rawData.timestamp || rawData.lastPlayed || new Date().toISOString(),
    // Additional stats if available
    totalGames: parseInt(rawData.totalGames) || 0,
    avgScore: parseFloat(rawData.avgScore) || 0,
    bestScore: parseInt(rawData.bestScore) || rawData.score || 0,
  };
};

/**
 * Sanitize username for display
 * @param {string} username - Raw username
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return 'Unknown Player';
  }
  
  // Remove HTML tags and limit length
  const cleaned = username.replace(/<[^>]*>/g, '').trim();
  const maxLength = 20;
  
  if (cleaned.length === 0) {
    return 'Unknown Player';
  }
  
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
};

/**
 * Validate score submission data
 * @param {Object} scoreData - Score data to validate
 * @returns {Object} Validation result
 */
export const validateScoreData = (scoreData) => {
  const errors = [];
  
  if (!scoreData || typeof scoreData !== 'object') {
    errors.push('Score data is required');
    return { isValid: false, errors };
  }
  
  if (!scoreData.userId || typeof scoreData.userId !== 'string') {
    errors.push('User ID is required');
  } else if (scoreData.userId.length < 2) {
    errors.push('User ID must be at least 2 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(scoreData.userId)) {
    errors.push('User ID can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (typeof scoreData.score !== 'number') {
    errors.push('Score must be a number');
  } else if (scoreData.score < 0) {
    errors.push('Score must be positive');
  } else if (scoreData.score > 1000000) {
    errors.push('Score is too high (max: 1,000,000)');
  }
  
  if (scoreData.gameMode && typeof scoreData.gameMode !== 'string') {
    errors.push('Game mode must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format API error for user display
 * @param {Error} error - API error
 * @returns {Object} Formatted error object
 */
export const formatApiError = (error) => {
  const baseError = {
    message: 'An unexpected error occurred',
    type: 'unknown',
    retryable: false,
  };
  
  if (error.message) {
    baseError.message = error.message;
  }
  
  // Determine error type and if it's retryable
  if (error.message.includes('Network error')) {
    baseError.type = 'network';
    baseError.retryable = true;
  } else if (error.message.includes('timeout')) {
    baseError.type = 'timeout';
    baseError.retryable = true;
  } else if (error.message.includes('Server error')) {
    baseError.type = 'server';
    baseError.retryable = true;
  } else if (error.message.includes('not found')) {
    baseError.type = 'not_found';
    baseError.retryable = false;
  } else if (error.message.includes('required')) {
    baseError.type = 'validation';
    baseError.retryable = false;
  }
  
  return baseError;
};

/**
 * Generate cache key with parameters
 * @param {string} base - Base cache key
 * @param {Object} params - Parameters to include in key
 * @returns {string} Generated cache key
 */
export const generateCacheKey = (base, params = {}) => {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return paramString ? `${base}?${paramString}` : base;
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounceApiCall = (func, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Batch API requests with delay between each request
 * @param {Array} requests - Array of request functions
 * @param {number} delay - Delay between requests in milliseconds
 * @returns {Promise<Array>} Array of results
 */
export const batchRequests = async (requests, delay = 100) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i++) {
    try {
      const result = await requests[i]();
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: formatApiError(error) });
    }
    
    // Add delay between requests (except for the last one)
    if (i < requests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

/**
 * Check if API is available
 * @returns {Promise<boolean>} True if API is available
 */
export const checkApiAvailability = async () => {
  try {
    const { healthService } = await import('../services/api');
    await healthService.checkHealth();
    return true;
  } catch (error) {
    console.warn('API health check failed:', error.message);
    return false;
  }
};

/**
 * Mock data fallback for when API is unavailable
 */
export const getMockLeaderboardData = () => [
  { rank: 1, username: 'ShadowHunter', score: 9870, country: '🇺🇸', userId: 'ShadowHunter' },
  { rank: 2, username: 'CyberPhoenix', score: 9560, country: '🇬🇧', userId: 'CyberPhoenix' },
  { rank: 3, username: 'NeonBlade', score: 9340, country: '🇨🇦', userId: 'NeonBlade' },
  { rank: 4, username: 'QuantumKnight', score: 9125, country: '🇩🇪', userId: 'QuantumKnight' },
  { rank: 5, username: 'DigitalStorm', score: 8990, country: '🇫🇷', userId: 'DigitalStorm' },
  { rank: 6, username: 'LaserRanger', score: 8840, country: '🇯🇵', userId: 'LaserRanger' },
  { rank: 7, username: 'PlasmaReaper', score: 8720, country: '🇰🇷', userId: 'PlasmaReaper' },
  { rank: 8, username: 'StormDragon', score: 8615, country: '🇦🇺', userId: 'StormDragon' },
  { rank: 9, username: 'OrbitronWarrior', score: 8500, country: '🇮🇳', userId: 'OrbitronWarrior' },
  { rank: 10, username: 'PixelFury', score: 8420, country: '🇧🇷', userId: 'PixelFury' },
];

/**
 * Get mock player data
 * @param {string} userId - User ID to get mock data for
 * @returns {Object|null} Mock player data or null if not found
 */
export const getMockPlayerData = (userId) => {
  const mockData = {
    'ShadowHunter': { rank: 1, username: 'ShadowHunter', score: 9870, country: '🇺🇸' },
    'CyberPhoenix': { rank: 2, username: 'CyberPhoenix', score: 9560, country: '🇬🇧' },
    'NeonBlade': { rank: 3, username: 'NeonBlade', score: 9340, country: '🇨🇦' },
    'TestUser': { rank: 25, username: 'TestUser', score: 7500, country: '🇺🇸' },
    'GamerPro': { rank: 42, username: 'GamerPro', score: 6800, country: '🇬🇧' },
  };
  
  return mockData[userId] || null;
}; 