# Troubleshooting Guide

## Common Issues and Solutions

This guide covers troubleshooting for the Gaming Leaderboard Frontend application, focusing on issues you might encounter with the implemented features.

## API Connection Issues

### Problem: "Network error. Please check your connection."
**Symptoms**: Leaderboard shows error message, player search fails
**Causes**: Backend server not running, incorrect API URL, network issues

**Solutions**:
1. **Check backend server status**:
   - Verify the backend server is running
   - Default expected URL: `http://127.0.0.1:8000/`
   - Check server logs for errors

2. **Verify API configuration**:
   - Check `src/config/apiConfig.js` for correct base URL
   - Ensure API endpoints are accessible
   - Test API directly: `curl http://127.0.0.1:8000/api/health`

3. **Browser console debugging**:
   - Open browser DevTools (F12)
   - Check Console tab for specific error messages
   - Check Network tab for failed requests

**Fallback**: The app automatically switches to mock data when API fails

### Problem: CORS errors in browser console
**Symptoms**: Console shows "Access to fetch at ... from origin ... has been blocked by CORS policy"
**Causes**: Backend not configured to accept requests from frontend domain

**Solutions**:
1. **Backend CORS configuration**:
   - Ensure backend allows requests from `http://localhost:5173` (development)
   - Add your domain to CORS allowed origins for production

2. **Development workaround**:
   - The app will fall back to mock data automatically
   - Check console for "Using fallback mock data" message

## Player Search Issues

### Problem: "Player not found in leaderboard"
**Symptoms**: Search returns error message, no results displayed
**Causes**: Player doesn't exist, incorrect username, API issues

**Solutions**:
1. **Try example usernames**:
   - `ShadowHunter`
   - `TestUser`
   - `GamerPro`

2. **Check input format**:
   - Minimum 2 characters required
   - Only letters, numbers, underscores, and hyphens allowed
   - No spaces or special characters

3. **Verify backend data**:
   - Check if the player exists in the backend database
   - Ensure correct username spelling

### Problem: Search input validation errors
**Symptoms**: Error messages appear before search is performed
**Causes**: Invalid input format

**Solutions**:
1. **Username requirements**:
   - Must be at least 2 characters long
   - Can only contain: letters (a-z, A-Z), numbers (0-9), underscores (_), hyphens (-)
   - No spaces or other special characters

2. **Input examples**:
   - ✅ Valid: `Player123`, `test_user`, `gamer-pro`
   - ❌ Invalid: `p`, `player@name`, `user name`

## Loading and Performance Issues

### Problem: Leaderboard takes long time to load
**Symptoms**: Loading spinner appears for extended periods
**Causes**: Slow API response, network issues, server problems

**Solutions**:
1. **Check network speed**:
   - Slow internet connection may cause delays
   - API has 10-second timeout before showing error

2. **Server performance**:
   - Backend may be slow or overloaded
   - Check server logs for performance issues

3. **Browser debugging**:
   - Check Network tab in DevTools
   - Look for slow requests (>10 seconds will timeout)

### Problem: Auto-refresh not working
**Symptoms**: Leaderboard doesn't update every 30 seconds
**Causes**: Component unmounted, API errors, timer cleared

**Solutions**:
1. **Check browser console**:
   - Look for API errors preventing refresh
   - Check for timer-related error messages

2. **Verify refresh indicator**:
   - Watch for refresh button spinning
   - Check "Last updated" timestamp

3. **Manual refresh**:
   - Click the refresh button (↻) to force update
   - This will restart the auto-refresh timer

## Build and Development Issues

### Problem: `npm install` fails
**Symptoms**: Dependency installation errors, missing packages
**Causes**: Node.js version incompatibility, corrupted cache

**Solutions**:
1. **Check Node.js version**:
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

3. **Delete and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Problem: Development server won't start
**Symptoms**: `npm run dev` command fails, port conflicts
**Causes**: Port already in use, permission issues

**Solutions**:
1. **Check port usage**:
   ```bash
   # Kill process using port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Use different port**:
   ```bash
   npm run dev -- --port 3000
   ```

3. **Check for errors**:
   - Look for specific error messages in terminal
   - Check for syntax errors in code

### Problem: Build fails with errors
**Symptoms**: `npm run build` command fails
**Causes**: Syntax errors, missing dependencies, ESLint errors

**Solutions**:
1. **Check for syntax errors**:
   ```bash
   npm run lint
   ```

2. **Fix ESLint issues**:
   - Review and fix any linting errors
   - Check for unused imports or variables

3. **Clean build**:
   ```bash
   rm -rf dist/
   npm run build
   ```

## UI and Display Issues

### Problem: Styles not loading correctly
**Symptoms**: App appears unstyled, missing colors/fonts
**Causes**: CSS import issues, build problems

**Solutions**:
1. **Check CSS imports**:
   - Verify all CSS files are properly imported
   - Check browser Network tab for 404 errors on CSS files

2. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Clear browser cache completely

3. **Check for CSS errors**:
   - Look for CSS syntax errors in browser console
   - Verify all CSS files exist in correct locations

### Problem: Medal icons not displaying
**Symptoms**: Top 3 players show numbers instead of 🥇🥈🥉
**Causes**: Font/emoji support issues, CSS problems

**Solutions**:
1. **Check emoji support**:
   - Verify browser supports emoji rendering
   - Try different browser to isolate issue

2. **CSS inspection**:
   - Check if CSS is overriding emoji display
   - Look for font-family issues

## Environment and Configuration Issues

### Problem: Environment variables not working
**Symptoms**: Default values used instead of custom configuration
**Causes**: Missing `.env` file, incorrect variable names

**Solutions**:
1. **Variable naming**:
   - Ensure all variables start with `VITE_`
   - Example: `VITE_API_BASE_URL=http://localhost:8000`

2. **Restart development server**:
   - Environment variables are loaded at startup
   - Stop and restart `npm run dev` after changing `.env`

3. **Check variable access**:
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_API_BASE_URL);
   ```

## Browser Compatibility Issues

### Problem: App doesn't work in older browsers
**Symptoms**: White screen, JavaScript errors, features not working
**Causes**: Browser doesn't support modern JavaScript features

**Solutions**:
1. **Use modern browser**:
   - Chrome 88+
   - Firefox 85+
   - Safari 14+
   - Edge 88+

2. **Check for JavaScript errors**:
   - Open browser console
   - Look for specific error messages
   - Update browser to latest version

## Getting Additional Help

### Debug Information to Collect
When reporting issues, include:
1. **Browser and version**
2. **Node.js version** (`node --version`)
3. **Console error messages**
4. **Network tab errors** (if API-related)
5. **Steps to reproduce the issue**

### Useful Commands for Debugging
```bash
# Check versions
node --version
npm --version

# Check project dependencies
npm list

# Run with verbose logging
npm run dev --verbose

# Check build output
npm run build
ls -la dist/
```

### Console Debugging
```javascript
// Check API configuration
console.log('API Config:', import.meta.env.VITE_API_BASE_URL);

// Check if components are loaded
console.log('Components loaded successfully');

// Monitor API calls
// (API calls are automatically logged in development)
```

---

Most issues can be resolved by checking the browser console for specific error messages and verifying that the backend API is running and accessible. 