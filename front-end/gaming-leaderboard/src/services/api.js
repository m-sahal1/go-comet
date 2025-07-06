import axios from 'axios';

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor for adding auth tokens and logging
 */
api.interceptors.request.use(
  (config) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling errors and logging
 */
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.status} (${duration}ms)`);
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    console.error(`❌ API Error: ${error.response?.status || 'Network Error'} (${duration}ms)`);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth token on unauthorized
      localStorage.removeItem('authToken');
      console.warn('🔒 Session expired, please log in again');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic retry mechanism for failed requests
 */
const retryRequest = async (fn, retries = MAX_RETRIES, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      console.warn(`🔄 Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

/**
 * Determine if request should be retried
 */
const shouldRetry = (error) => {
  return (
    !error.response || // Network error
    error.response.status >= 500 || // Server error
    error.response.status === 429 || // Too many requests
    error.code === 'ECONNABORTED' // Timeout
  );
};

/**
 * Handle API errors and return user-friendly messages
 */
const handleApiError = (error, context = '') => {
  const errorInfo = {
    message: 'An unexpected error occurred',
    status: null,
    code: null,
    context,
  };

  if (error.response) {
    // Server responded with error status
    errorInfo.status = error.response.status;
    errorInfo.code = error.response.data?.code;
    
    switch (error.response.status) {
      case 400:
        errorInfo.message = error.response.data?.message || 'Invalid request parameters';
        break;
      case 401:
        errorInfo.message = 'Authentication required';
        break;
      case 403:
        errorInfo.message = 'Access forbidden';
        break;
      case 404:
        errorInfo.message = context ? `${context} not found` : 'Resource not found';
        break;
      case 429:
        errorInfo.message = 'Too many requests. Please wait and try again.';
        break;
      case 500:
        errorInfo.message = 'Server error. Please try again later.';
        break;
      case 503:
        errorInfo.message = 'Service temporarily unavailable';
        break;
      default:
        errorInfo.message = error.response.data?.message || `Server error (${error.response.status})`;
    }
  } else if (error.request) {
    // Network error
    errorInfo.message = 'Network error. Please check your connection.';
    errorInfo.code = 'NETWORK_ERROR';
  } else if (error.code === 'ECONNABORTED') {
    // Timeout error
    errorInfo.message = 'Request timeout. Please try again.';
    errorInfo.code = 'TIMEOUT';
  } else {
    // Other error
    errorInfo.message = error.message || 'An unexpected error occurred';
  }

  console.error('🚨 API Error Details:', errorInfo);
  return errorInfo;
};

/**
 * Leaderboard API Service
 */
export const leaderboardService = {
  /**
   * Get top 10 players from the leaderboard
   * @returns {Promise<Array>} Array of top players
   */
  getTopPlayers: async () => {
    try {
      return await retryRequest(async () => {
        const response = await api.get('/api/leaderboard/top');
        return response.data;
      });
    } catch (error) {
      const errorInfo = handleApiError(error, 'Leaderboard data');
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get player rank by user ID
   * @param {string} userId - The user ID to lookup
   * @returns {Promise<Object>} Player rank information
   */
  getPlayerRank: async (userId) => {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    try {
      return await retryRequest(async () => {
        const response = await api.get(`/api/leaderboard/rank/${encodeURIComponent(userId)}`);
        return response.data;
      });
    } catch (error) {
      const errorInfo = handleApiError(error, 'Player');
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Submit a new score for a player
   * @param {Object} scoreData - Score submission data
   * @param {string} scoreData.userId - User ID
   * @param {number} scoreData.score - Score value
   * @param {string} [scoreData.gameMode] - Game mode
   * @param {string} [scoreData.timestamp] - Score timestamp
   * @returns {Promise<Object>} Submission result
   */
  submitScore: async (scoreData) => {
    if (!scoreData || !scoreData.userId || typeof scoreData.score !== 'number') {
      throw new Error('Valid score data with userId and score is required');
    }

    if (scoreData.score < 0) {
      throw new Error('Score must be a positive number');
    }

    try {
      return await retryRequest(async () => {
        const response = await api.post('/api/leaderboard/submit', {
          userId: scoreData.userId,
          score: scoreData.score,
          gameMode: scoreData.gameMode || 'standard',
          timestamp: scoreData.timestamp || new Date().toISOString(),
        });
        return response.data;
      });
    } catch (error) {
      const errorInfo = handleApiError(error, 'Score submission');
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get leaderboard for a specific time period
   * @param {string} period - Time period ('daily', 'weekly', 'monthly', 'all-time')
   * @param {number} [limit=10] - Number of players to return
   * @returns {Promise<Array>} Leaderboard data
   */
  getLeaderboardByPeriod: async (period = 'all-time', limit = 10) => {
    try {
      return await retryRequest(async () => {
        const response = await api.get('/api/leaderboard', {
          params: { period, limit }
        });
        return response.data;
      });
    } catch (error) {
      const errorInfo = handleApiError(error, 'Leaderboard data');
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get player statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Player statistics
   */
  getPlayerStats: async (userId) => {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    try {
      return await retryRequest(async () => {
        const response = await api.get(`/api/leaderboard/stats/${encodeURIComponent(userId)}`);
        return response.data;
      });
    } catch (error) {
      const errorInfo = handleApiError(error, 'Player statistics');
      throw new Error(errorInfo.message);
    }
  },
};

/**
 * Health check API
 */
export const healthService = {
  /**
   * Check API health status
   * @returns {Promise<Object>} Health status
   */
  checkHealth: async () => {
    try {
      const response = await api.get('/api/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      const errorInfo = handleApiError(error, 'Health check');
      throw new Error(errorInfo.message);
    }
  },
};

/**
 * Export the configured axios instance for advanced usage
 */
export default api; 