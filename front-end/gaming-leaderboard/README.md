# Gaming Leaderboard Frontend 🎮

A modern, responsive React frontend for a gaming leaderboard application with real-time updates, player rank lookup, and gaming-themed UI.

## ✨ Features

- **Real-time Leaderboard**: Top 10 players with 30-second auto-refresh
- **Player Rank Lookup**: Search any player's rank and statistics
- **Gaming Theme**: Dark, modern UI with neon accents and animations
- **Responsive Design**: Works on desktop and mobile devices
- **Robust API Integration**: Error handling, retry logic, and request interceptors
- **Offline Fallback**: Mock data when API is unavailable
- **Loading States**: Smooth loading animations and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Navigate to the project**:
   ```bash
   cd gaming-leaderboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## 📁 Project Structure

```
gaming-leaderboard/
├── src/
│   ├── components/           # React components
│   │   ├── Header.jsx       # App header
│   │   ├── MainLayout.jsx   # Two-column layout
│   │   ├── LeaderboardTable.jsx # Top 10 players table
│   │   └── PlayerRankLookup.jsx # Player search
│   ├── services/            # API service layer
│   │   └── api.js          # API functions with error handling
│   ├── config/             # Configuration
│   │   └── apiConfig.js    # API configuration
│   ├── utils/              # Utility functions
│   │   └── apiHelpers.js   # Data transformation helpers
│   ├── App.jsx             # Root component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── docs/                   # Documentation
├── public/                 # Static assets
└── package.json           # Dependencies
```

## 🎯 Components

### **App.jsx**
Root component that renders Header and MainLayout.

### **Header.jsx**
Simple header displaying "Gaming Leaderboard" title with gaming-themed styling.

### **MainLayout.jsx**
Two-section layout:
- **Left/Top**: Leaderboard section with "Top 10 Players" title
- **Right/Bottom**: Player lookup section with "Find Your Rank" title

### **LeaderboardTable.jsx**
Displays top 10 players with:
- Auto-refresh every 30 seconds
- Manual refresh button
- Loading spinner during API calls
- Error handling with retry button
- Medal icons for top 3 players (🥇🥈🥉)
- Fallback to mock data when API fails
- Last updated timestamp

### **PlayerRankLookup.jsx**
Player search functionality with:
- Input validation (2+ characters, alphanumeric only)
- Search button and Enter key support
- Loading states during search
- Error handling with helpful messages
- Results display with rank, username, and score
- Clear results button
- Fallback to mock data

## 🔌 API Integration

### Available API Services

The `api.js` service provides:

#### **leaderboardService**
- `getTopPlayers()` - Get top 10 players
- `getPlayerRank(userId)` - Get specific player's rank
- `submitScore(scoreData)` - Submit new score
- `getLeaderboardByPeriod(period, limit)` - Get leaderboard by time period
- `getPlayerStats(userId)` - Get player statistics

#### **healthService**
- `checkHealth()` - Check API server health

### API Features
- **Axios HTTP Client**: Pre-configured with interceptors
- **Error Handling**: User-friendly error messages
- **Retry Logic**: Automatic retries with exponential backoff (max 3 attempts)
- **Request Logging**: Console logging for debugging
- **Timeout Handling**: 10-second timeout with error handling
- **Token Management**: Automatic Bearer token handling

### Example Usage

```javascript
import { leaderboardService } from '../services/api';

// Get top players
const players = await leaderboardService.getTopPlayers();

// Search for player
const player = await leaderboardService.getPlayerRank('ShadowHunter');
```

## 🎨 Styling

### Current Design System
- **Dark Theme**: Gaming-inspired dark color palette
- **Neon Effects**: Glowing borders and text effects
- **Responsive Grid**: CSS Grid layout for main sections
- **Medal Icons**: Emoji medals for top 3 players
- **Loading Animations**: CSS-based spinners and transitions

### Component Styles
Each component has its own CSS file with gaming-themed styling:
- `Header.css` - Header styling with neon effects
- `MainLayout.css` - Grid layout and section styling
- `LeaderboardTable.css` - Table styling with hover effects
- `PlayerRankLookup.css` - Search form and results styling

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Dependencies

#### Core Dependencies
- `react` (^19.1.0) - React framework
- `react-dom` (^19.1.0) - React DOM
- `axios` (^1.10.0) - HTTP client
- `framer-motion` (^12.23.0) - Animation library
- `react-icons` (^5.5.0) - Icon library
- `socket.io-client` (^4.8.1) - WebSocket client
- `styled-components` (^6.1.19) - CSS-in-JS styling

#### Dev Dependencies
- `vite` (^7.0.0) - Build tool
- `eslint` (^9.29.0) - Code linting

## 🐛 Common Issues & Solutions

### API Connection Issues
**Problem**: "Network error. Please check your connection."
**Solution**: 
- Verify backend server is running
- Check browser console for specific error details
- The app will automatically fall back to mock data

### Player Not Found
**Problem**: "Player not found in leaderboard"
**Solution**:
- Try example usernames: ShadowHunter, TestUser, GamerPro
- Check username spelling and format
- Ensure backend has player data

### Build Issues
**Problem**: Build fails or dependencies error
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Configuration

### API Configuration
The API base URL is configured in `src/config/apiConfig.js`. Default is `http://127.0.0.1:8000/`.

### Environment Variables
While the codebase supports environment variables, the current implementation uses:
- Default API URL: `http://127.0.0.1:8000/`
- 10-second request timeout
- 3 retry attempts
- 30-second auto-refresh interval

## 🚀 Deployment

### Build the Application
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Static Hosting
Deploy the `dist/` folder to any static hosting service:
- **Vercel**: Connect GitHub repo, automatic deployment
- **Netlify**: Drag and drop `dist/` folder or connect repo
- **GitHub Pages**: Upload `dist/` contents
- **Traditional Web Server**: Copy `dist/` contents to web root

### Important Notes
- Configure server to serve `index.html` for all routes (SPA routing)
- Ensure backend API is accessible from your domain
- Configure CORS on backend for your domain

## 📄 Architecture

### Data Flow
1. **Component Mount** → API call via service layer
2. **API Service** → Error handling and retry logic
3. **Response** → Data transformation via helpers
4. **Component State** → UI update
5. **Auto-refresh** → Repeat process every 30 seconds

### State Management
- **Local State**: Each component manages its own state with React hooks
- **No Global State**: Simple enough to avoid Redux/Context
- **API State Pattern**: Consistent loading/error/data state handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review browser console for error details
- Verify backend API is running and accessible

---

Built with React, Vite, and modern web technologies for an optimal gaming experience.
