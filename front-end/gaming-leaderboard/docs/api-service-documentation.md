# API Service Layer Documentation

## Overview

The Gaming Leaderboard API service layer provides a robust, feature-rich interface for communicating with the backend API. It includes error handling, retry logic, caching, and comprehensive logging.

## Features

### ✨ Core Features
- **Axios-based HTTP client** with interceptors
- **Automatic retry logic** with exponential backoff
- **Request/response caching** for improved performance
- **Comprehensive error handling** with user-friendly messages
- **Request timeout handling** (10 seconds default)
- **Authentication token management**
- **Environment-based configuration**

### 🔧 Configuration
- Centralized configuration via `src/config/apiConfig.js`
- Environment variable support (prefix: `VITE_`)
- Validation and debugging utilities
- Development vs production settings

## API Endpoints

### Leaderboard Service (`leaderboardService`)

#### `getTopPlayers()`
Retrieves the top 10 players from the leaderboard.

```javascript
import { leaderboardService } from '../services/api';

try {
  const topPlayers = await leaderboardService.getTopPlayers();
  console.log('Top players:', topPlayers);
} catch (error) {
  console.error('Failed to fetch leaderboard:', error.message);
}
```

#### `getPlayerRank(userId)`
Gets rank information for a specific player.

```javascript
try {
  const playerData = await leaderboardService.getPlayerRank('ShadowHunter');
  console.log('Player rank:', playerData);
} catch (error) {
  console.error('Player not found:', error.message);
}
```

#### `submitScore(scoreData)`
Submits a new score for a player.

```javascript
const scoreData = {
  userId: 'PlayerName',
  score: 9500,
  gameMode: 'standard', // optional
  timestamp: new Date().toISOString(), // optional
};

try {
  const result = await leaderboardService.submitScore(scoreData);
  console.log('Score submitted:', result);
} catch (error) {
  console.error('Score submission failed:', error.message);
}
```

#### `getLeaderboardByPeriod(period, limit)`
Gets leaderboard for specific time periods.

```javascript
// Get daily top 5
const dailyTop5 = await leaderboardService.getLeaderboardByPeriod('daily', 5);

// Get all-time top 10 (default)
const allTime = await leaderboardService.getLeaderboardByPeriod();
```

#### `getPlayerStats(userId)`
Retrieves comprehensive statistics for a player.

```javascript
const stats = await leaderboardService.getPlayerStats('PlayerName');
// Returns: rank, score, totalGames, avgScore, bestScore, etc.
```

### Health Service (`healthService`)

#### `checkHealth()`
Checks API server health status.

```javascript
import { healthService } from '../services/api';

const isHealthy = await healthService.checkHealth();
```

## Error Handling

### Automatic Retry Logic
- **Max retries**: 3 attempts (configurable)
- **Exponential backoff**: 1s, 2s, 4s delays
- **Retryable conditions**: Network errors, 5xx errors, timeouts, 429 (rate limit)

### Error Types
```javascript
try {
  await leaderboardService.getTopPlayers();
} catch (error) {
  // error.message contains user-friendly text:
  // - "Network error. Please check your connection."
  // - "Server error. Please try again later."
  // - "Player not found in leaderboard."
  // - "Too many requests. Please wait and try again."
}
```

## Caching

### Built-in Caching
- **In-memory cache** with configurable TTL
- **Automatic cache invalidation** based on age
- **Cache keys** for different endpoints

### Cache Configuration
```javascript
import { apiCache, CACHE_TTL } from '../utils/apiHelpers';

// Manual cache operations
const cached = apiCache.get('leaderboard_top', CACHE_TTL.LEADERBOARD);
apiCache.set('leaderboard_top', data);
apiCache.clear(); // Clear all cache
```

### Cache TTL Defaults
- **Leaderboard**: 30 seconds
- **Player rank**: 1 minute
- **Player stats**: 5 minutes
- **Health check**: 10 seconds

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Request Settings
VITE_API_TIMEOUT=10000
VITE_API_RETRIES=3

# Cache Settings
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL_LEADERBOARD=30000
VITE_CACHE_TTL_PLAYER=60000

# Development
VITE_DEV_MODE=true
VITE_MOCK_API=false
VITE_LOG_API_CALLS=true
```

### Runtime Configuration
```javascript
import { apiConfig, getConfigSummary, validateConfig } from '../config/apiConfig';

// Get current configuration
console.log(getConfigSummary());

// Validate configuration
const validation = validateConfig();
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
}
```

## Utility Functions

### Data Transformation
```javascript
import { 
  transformLeaderboardData, 
  transformPlayerData,
  sanitizeUsername 
} from '../utils/apiHelpers';

// Transform raw API response
const cleanedData = transformLeaderboardData(rawApiResponse);
```

### Validation
```javascript
import { validateScoreData } from '../utils/apiHelpers';

const validation = validateScoreData({ userId: 'test', score: 1000 });
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### API Availability Check
```javascript
import { checkApiAvailability, getMockLeaderboardData } from '../utils/apiHelpers';

const isAvailable = await checkApiAvailability();
if (!isAvailable) {
  // Use mock data as fallback
  const mockData = getMockLeaderboardData();
}
```

## Logging

### Request/Response Logging
All API calls are automatically logged with:
- Request method and URL
- Response status and duration
- Error details

### Example Log Output
```
🌐 API Request: GET /api/leaderboard/top
✅ API Response: 200 (145ms)

❌ API Error: 404 (89ms)
🚨 API Error Details: { message: "Player not found", status: 404, ... }

🔄 Retrying request... (1/3)
```

## Authentication

### Token Management
```javascript
// Tokens are automatically added to requests
localStorage.setItem('authToken', 'your-jwt-token');

// Token is automatically cleared on 401 responses
// Console warning: "🔒 Session expired, please log in again"
```

## Best Practices

### 1. Error Handling
```javascript
// ✅ Good: Handle specific error cases
try {
  const data = await leaderboardService.getPlayerRank(userId);
  setPlayerData(data);
} catch (error) {
  if (error.message.includes('not found')) {
    setError('Player not found. Please check the username.');
  } else {
    setError(error.message);
  }
}
```

### 2. Loading States
```javascript
// ✅ Good: Show loading states
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await leaderboardService.getTopPlayers();
    setLeaderboardData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Cache Utilization
```javascript
// ✅ Good: Check cache before API call
const fetchWithCache = async () => {
  const cached = apiCache.get(CACHE_KEYS.LEADERBOARD_TOP, CACHE_TTL.LEADERBOARD);
  if (cached) {
    return cached;
  }
  
  const fresh = await leaderboardService.getTopPlayers();
  apiCache.set(CACHE_KEYS.LEADERBOARD_TOP, fresh);
  return fresh;
};
```

## Integration Examples

### React Hook Integration
```javascript
import { useState, useEffect } from 'react';
import { leaderboardService } from '../services/api';
import { formatApiError } from '../utils/apiHelpers';

export const useLeaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const leaderboard = await leaderboardService.getTopPlayers();
      setData(leaderboard);
    } catch (err) {
      const errorInfo = formatApiError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return { data, loading, error, refetch: fetchLeaderboard };
};
```

## Troubleshooting

### Common Issues

1. **Network Errors**
   - Check API server is running
   - Verify `VITE_API_BASE_URL` is correct
   - Check browser network tab for CORS issues

2. **Timeout Errors**
   - Increase `VITE_API_TIMEOUT` value
   - Check API server response time

3. **Authentication Errors**
   - Check if auth token is valid
   - Verify token is stored in localStorage

4. **Cache Issues**
   - Clear cache: `apiCache.clear()`
   - Disable cache: `VITE_CACHE_ENABLED=false`

### Debug Mode
```javascript
// Enable detailed logging
localStorage.setItem('debug', 'api:*');

// View current configuration
import { getConfigSummary } from '../config/apiConfig';
console.log(getConfigSummary());
```

---

This API service layer provides a solid foundation for reliable communication with the gaming leaderboard backend, with comprehensive error handling, caching, and monitoring capabilities. 