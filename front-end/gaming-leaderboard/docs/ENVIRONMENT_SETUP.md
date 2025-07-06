# Environment Setup Guide

## Current Configuration

The Gaming Leaderboard Frontend uses a configuration file at `src/config/apiConfig.js` for API settings. The app is designed to work with minimal configuration.

## Default Settings

The application currently uses these default settings:

- **API Base URL**: `http://127.0.0.1:8000/`
- **Request Timeout**: 10 seconds
- **Max Retries**: 3 attempts
- **Auto-refresh Interval**: 30 seconds

## Environment Variables (Optional)

While the current implementation works with defaults, you can optionally use environment variables for customization:

### Create .env file

Create a `.env` file in the `gaming-leaderboard/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000

# Optional: Request timeout in milliseconds
VITE_API_TIMEOUT=10000

# Optional: Enable detailed logging
VITE_LOG_API_CALLS=true
```

### Environment Variable Rules

1. **All variables must start with `VITE_`** to be accessible in the frontend
2. **Restart the development server** after changing environment variables
3. **Variables are embedded at build time**, not runtime

## API Configuration

### Development Setup

1. **Default backend URL**: `http://127.0.0.1:8000/`
2. **Expected API endpoints**:
   - `GET /api/leaderboard/top` - Top 10 players
   - `GET /api/leaderboard/rank/{user_id}` - Player rank lookup
   - `GET /api/health` - Health check

### Production Setup

For production deployment, you'll need to:

1. **Update API URL** in `src/config/apiConfig.js` or use environment variables
2. **Ensure CORS is configured** on your backend for the frontend domain
3. **Use HTTPS** for production API endpoints

## Testing Configuration

### Mock Data Fallback

The app automatically falls back to mock data when the API is unavailable. This includes:

- **Mock leaderboard data**: 10 example players with ranks and scores
- **Mock player data**: Example players for search testing
- **Test usernames**: `ShadowHunter`, `TestUser`, `GamerPro`

### Verification

Test your configuration:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Check browser console** for:
   - API connection messages
   - Any configuration errors
   - Fallback to mock data (if API unavailable)

3. **Test API endpoints directly**:
   ```bash
   curl http://127.0.0.1:8000/api/health
   curl http://127.0.0.1:8000/api/leaderboard/top
   ```

## Common Configuration Issues

### Backend Server Not Running
- **Symptom**: "Network error" messages
- **Solution**: Start your backend server on port 8000
- **Fallback**: App will use mock data automatically

### Wrong API URL
- **Symptom**: 404 errors in browser console
- **Solution**: Update `src/config/apiConfig.js` with correct URL
- **Example**: Change `127.0.0.1` to `localhost` if needed

### CORS Issues
- **Symptom**: "CORS policy" errors in console
- **Solution**: Configure backend to allow requests from `http://localhost:5173`
- **Fallback**: App will use mock data automatically

## No Configuration Required

The app is designed to work out of the box with sensible defaults. If you don't have a backend server:

1. **Mock data is used automatically**
2. **All features work** with example data
3. **No setup required** for frontend-only testing

---

The application prioritizes simplicity and works with minimal configuration while providing fallbacks for development and testing. 