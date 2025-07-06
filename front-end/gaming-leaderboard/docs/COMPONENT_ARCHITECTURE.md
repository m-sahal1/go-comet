# Component Architecture Documentation

## Overview

This document details the component architecture of the Gaming Leaderboard Frontend application, including the actual implemented components, their functionality, and data flow patterns.

## Component Hierarchy

```
App
├── Header
└── MainLayout
    ├── LeaderboardTable
    └── PlayerRankLookup
```

## Implemented Components

### App Component (`src/App.jsx`)

**Purpose**: Root component that serves as the main entry point.

**Implementation**:
- Renders Header and MainLayout components
- Imports global CSS styles
- Minimal wrapper with no state or logic

```jsx
import React from 'react';
import Header from './components/Header';
import MainLayout from './components/MainLayout';
import './index.css';

function App() {
  return (
    <>
      <Header />
      <MainLayout />
    </>
  );
}
```

**Props**: None  
**State**: None

---

### Header Component (`src/components/Header.jsx`)

**Purpose**: Simple application header with gaming-themed styling.

**Implementation**:
- Displays "Gaming Leaderboard" title
- Uses CSS for styling with neon effects
- Static component with no interactivity

```jsx
import React from 'react';
import './Header.css';

const Header = () => (
  <header className="app-header">
    <h1 className="app-title">🎮 Gaming Leaderboard</h1>
  </header>
);
```

**Props**: None  
**State**: None  
**Styling**: `Header.css` with gaming theme

---

### MainLayout Component (`src/components/MainLayout.jsx`)

**Purpose**: Main layout container organizing the application into two sections.

**Implementation**:
- Two-section CSS Grid layout
- Responsive design (stacks on mobile)
- Contains section titles and component wrappers

```jsx
import React from 'react';
import LeaderboardTable from './LeaderboardTable';
import PlayerRankLookup from './PlayerRankLookup';
import './MainLayout.css';

const MainLayout = () => (
  <div className="main-layout">
    <section className="leaderboard-pane">
      <h2 className="section-title">Top 10 Players</h2>
      <LeaderboardTable />
    </section>
    <section className="rank-lookup-pane">
      <h2 className="section-title">Find Your Rank</h2>
      <PlayerRankLookup />
    </section>
  </div>
);
```

**Props**: None  
**State**: None  
**Styling**: `MainLayout.css` with responsive grid

---

### LeaderboardTable Component (`src/components/LeaderboardTable.jsx`)

**Purpose**: Displays top 10 players with auto-refresh functionality.

**State Management**:
- `players: Array` - List of player data
- `loading: boolean` - Loading state for API calls
- `error: string` - Error message display
- `lastUpdated: Date` - Last update timestamp

**Key Features**:
- Auto-refresh every 30 seconds using `setInterval`
- Manual refresh button
- Loading spinner during API calls
- Error handling with retry functionality
- Medal icons for top 3 players (🥇🥈🥉)
- Fallback to mock data when API fails
- Last updated timestamp display

**API Integration**:
- Uses `leaderboardService.getTopPlayers()`
- Transforms data with `transformLeaderboardData()`
- Error handling with `formatApiError()`

**Data Structure**:
```javascript
const player = {
  rank: 1,
  username: "ShadowHunter",
  score: 15750,
  userId: "user123"
};
```

**Component Lifecycle**:
1. Mount → Initial API call
2. Set 30-second interval for auto-refresh
3. Handle loading/error states
4. Display transformed data
5. Cleanup interval on unmount

**Error Handling**:
- Network errors → Fallback to mock data
- API errors → Show error message with retry
- Loading states → Show spinner overlay

---

### PlayerRankLookup Component (`src/components/PlayerRankLookup.jsx`)

**Purpose**: Search functionality for individual player ranks.

**State Management**:
- `userId: string` - Current search input
- `playerData: Object` - Player search results
- `loading: boolean` - Search loading state
- `error: string` - Search error messages

**Key Features**:
- Input validation (2+ characters, alphanumeric only)
- Search on button click or Enter key
- Loading states during search
- Error handling with specific messages
- Results display with formatted rank
- Clear results functionality
- Fallback to mock data

**Input Validation**:
```javascript
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
```

**API Integration**:
- Uses `leaderboardService.getPlayerRank(userId)`
- Transforms data with `transformPlayerData()`
- Error handling with `formatApiError()`

**Rank Formatting**:
- Adds ordinal suffixes: 1st, 2nd, 3rd, 4th, etc.
- Handles special cases (11th, 12th, 13th)

## API Service Layer (`src/services/api.js`)

### Configuration
- **Base URL**: `http://127.0.0.1:8000/` (configurable)
- **Timeout**: 10 seconds
- **Max Retries**: 3 attempts
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)

### Implemented Services

#### leaderboardService
- `getTopPlayers()` - Fetch top 10 players
- `getPlayerRank(userId)` - Get specific player rank
- `submitScore(scoreData)` - Submit new score (available but not used in UI)
- `getLeaderboardByPeriod(period, limit)` - Get leaderboard by time period
- `getPlayerStats(userId)` - Get player statistics

#### healthService
- `checkHealth()` - Check API health status

### Error Handling
- **Network errors**: Automatic retry with exponential backoff
- **HTTP errors**: User-friendly error messages
- **Timeout errors**: Graceful handling
- **Validation errors**: Input validation before API calls

### Request/Response Interceptors
- **Request logging**: Console logs for debugging
- **Response timing**: Track request duration
- **Auth token**: Automatic Bearer token handling (if available)
- **Error logging**: Detailed error information

## Data Transformation (`src/utils/apiHelpers.js`)

### Key Functions
- `transformLeaderboardData()` - Clean and format leaderboard data
- `transformPlayerData()` - Format individual player data
- `formatApiError()` - Convert API errors to user-friendly messages
- `getMockLeaderboardData()` - Fallback mock data
- `getMockPlayerData()` - Fallback mock player data

### Data Flow
1. **Raw API Response** → Validation checks
2. **Validation** → Data transformation
3. **Transformation** → Component state update
4. **State Update** → UI re-render

## State Management Pattern

### Consistent API State Pattern
Used across both main components:

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError('');
    const result = await apiService.getData();
    setData(transformData(result));
  } catch (err) {
    setError(formatApiError(err).message);
    // Fallback to mock data if available
  } finally {
    setLoading(false);
  }
}, []);
```

### Local State Only
- Each component manages its own state
- No global state management (Redux/Context)
- Simple enough for local React hooks

## Styling Architecture

### CSS Organization
- **Global styles**: `src/index.css`
- **Component styles**: Individual CSS files per component
- **Theme**: Dark gaming theme with neon accents
- **Responsive**: CSS Grid and Flexbox for layouts

### Style Files
- `Header.css` - Header styling with neon text effects
- `MainLayout.css` - Grid layout and responsive design
- `LeaderboardTable.css` - Table styling with hover effects and medals
- `PlayerRankLookup.css` - Search form and results styling

## Performance Considerations

### Current Optimizations
- **useCallback**: For event handlers to prevent unnecessary re-renders
- **Conditional rendering**: Only render when data is available
- **Auto-refresh**: Intelligent refresh (only when not loading)
- **Caching**: Built-in API response caching

### Loading States
- **Skeleton loading**: Spinner animations
- **Progressive loading**: Show existing data while updating
- **Error boundaries**: Graceful error handling

## Testing Strategy

### Component Testing Approach
Each component should be tested for:
1. **Rendering**: Correct initial render with no data
2. **Loading states**: Proper loading indicators
3. **Error states**: Error message display
4. **Data display**: Correct data rendering
5. **User interactions**: Button clicks, input changes
6. **API integration**: Mock API responses

### Integration Testing
- **End-to-end data flow**: API → Component → UI
- **Error scenarios**: Network failures, invalid data
- **Auto-refresh**: Timer-based functionality

## Future Enhancement Opportunities

### Potential Improvements
1. **Error Boundary**: Catch component crashes
2. **Loading Components**: Reusable loading states
3. **Toast Notifications**: For real-time updates
4. **Pagination**: For larger leaderboards
5. **Virtual Scrolling**: For performance with large datasets

### State Management Upgrades
- **React Context**: If global state becomes necessary
- **React Query**: For advanced API state management
- **Custom hooks**: For shared logic between components

---

This architecture provides a solid foundation for the gaming leaderboard application with clear separation of concerns, robust error handling, and maintainable code structure. 