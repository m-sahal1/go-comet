/**
 * API Configuration
 * Centralizes all API-related configuration with environment variable support
 */

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:8000/',
  SOCKET_URL: 'http://127.0.0.1:8000/',
  API_TIMEOUT: 10000,
  API_RETRIES: 3,
  CACHE_ENABLED: true,
  CACHE_TTL_LEADERBOARD: 30000,
  CACHE_TTL_PLAYER: 60000,
  DEV_MODE: true,
  MOCK_API: false,
  LOG_LEVEL: 'info',
  LOG_API_CALLS: true,
};

/**
 * Get configuration value from environment or use default
 * @param {string} key - Configuration key
 * @param {any} defaultValue - Default value if env var not found
 * @returns {any} Configuration value
 */
const getConfig = (key, defaultValue) => {
  const envKey = `VITE_${key}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue === undefined) {
    return defaultValue;
  }
  
  // Handle boolean values
  if (typeof defaultValue === 'boolean') {
    return envValue === 'true';
  }
  
  // Handle number values
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(envValue, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  // Handle string values
  return envValue;
};

/**
 * API Configuration Object
 */
export const apiConfig = {
  // Base URLs
  API_BASE_URL: getConfig('API_BASE_URL', DEFAULT_CONFIG.API_BASE_URL),
  SOCKET_URL: getConfig('SOCKET_URL', DEFAULT_CONFIG.SOCKET_URL),
  
  // Request configuration
  API_TIMEOUT: getConfig('API_TIMEOUT', DEFAULT_CONFIG.API_TIMEOUT),
  API_RETRIES: getConfig('API_RETRIES', DEFAULT_CONFIG.API_RETRIES),
  
  // Cache configuration
  CACHE_ENABLED: getConfig('CACHE_ENABLED', DEFAULT_CONFIG.CACHE_ENABLED),
  CACHE_TTL_LEADERBOARD: getConfig('CACHE_TTL_LEADERBOARD', DEFAULT_CONFIG.CACHE_TTL_LEADERBOARD),
  CACHE_TTL_PLAYER: getConfig('CACHE_TTL_PLAYER', DEFAULT_CONFIG.CACHE_TTL_PLAYER),
  
  // Development configuration
  DEV_MODE: getConfig('DEV_MODE', DEFAULT_CONFIG.DEV_MODE),
  MOCK_API: getConfig('MOCK_API', DEFAULT_CONFIG.MOCK_API),
  
  // Logging configuration
  LOG_LEVEL: getConfig('LOG_LEVEL', DEFAULT_CONFIG.LOG_LEVEL),
  LOG_API_CALLS: getConfig('LOG_API_CALLS', DEFAULT_CONFIG.LOG_API_CALLS),
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Leaderboard endpoints
  LEADERBOARD_TOP: '/api/leaderboard/top',
  LEADERBOARD_PERIOD: '/api/leaderboard',
  LEADERBOARD_RANK: '/api/leaderboard/rank',
  LEADERBOARD_STATS: '/api/leaderboard/stats',
  
  // Score endpoints
  SCORE_SUBMIT: '/api/leaderboard/submit',
  
  // Health check
  HEALTH: '/api/health',
  
  // Authentication (if needed in future)
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * API Error Codes
 */
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
};

/**
 * Request Headers
 */
export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  ENABLED: apiConfig.CACHE_ENABLED,
  TTL: {
    LEADERBOARD: apiConfig.CACHE_TTL_LEADERBOARD,
    PLAYER: apiConfig.CACHE_TTL_PLAYER,
    HEALTH: 10000, // 10 seconds
    STATS: 300000, // 5 minutes
  },
  MAX_SIZE: 100, // Maximum number of cached items
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: apiConfig.API_RETRIES,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_FACTOR: 2, // Exponential backoff
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503, 504],
};

/**
 * Development configuration
 */
export const DEV_CONFIG = {
  ENABLED: apiConfig.DEV_MODE,
  MOCK_API: apiConfig.MOCK_API,
  LOG_LEVEL: apiConfig.LOG_LEVEL,
  LOG_API_CALLS: apiConfig.LOG_API_CALLS,
};

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
export const validateConfig = () => {
  const errors = [];
  
  // Validate required URLs
  if (!apiConfig.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (!apiConfig.SOCKET_URL) {
    errors.push('SOCKET_URL is required');
  }
  
  // Validate timeouts
  if (apiConfig.API_TIMEOUT <= 0) {
    errors.push('API_TIMEOUT must be positive');
  }
  
  // Validate retry count
  if (apiConfig.API_RETRIES < 0) {
    errors.push('API_RETRIES must be non-negative');
  }
  
  // Validate cache TTL
  if (apiConfig.CACHE_TTL_LEADERBOARD <= 0) {
    errors.push('CACHE_TTL_LEADERBOARD must be positive');
  }
  
  if (apiConfig.CACHE_TTL_PLAYER <= 0) {
    errors.push('CACHE_TTL_PLAYER must be positive');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get configuration summary for debugging
 * @returns {Object} Configuration summary
 */
export const getConfigSummary = () => {
  return {
    apiBaseUrl: apiConfig.API_BASE_URL,
    socketUrl: apiConfig.SOCKET_URL,
    timeout: apiConfig.API_TIMEOUT,
    retries: apiConfig.API_RETRIES,
    cacheEnabled: apiConfig.CACHE_ENABLED,
    devMode: apiConfig.DEV_MODE,
    mockApi: apiConfig.MOCK_API,
    logLevel: apiConfig.LOG_LEVEL,
  };
};

// Log configuration on startup in development mode
if (DEV_CONFIG.ENABLED && DEV_CONFIG.LOG_API_CALLS) {
  console.log('🔧 API Configuration:', getConfigSummary());
  
  const validation = validateConfig();
  if (!validation.isValid) {
    console.error('⚠️ Configuration validation failed:', validation.errors);
  }
} 