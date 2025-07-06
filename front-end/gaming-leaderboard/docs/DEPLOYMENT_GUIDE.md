# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Gaming Leaderboard Frontend to hosting platforms.

## Prerequisites

- Node.js 18+ installed locally
- Gaming Leaderboard project built and tested
- Backend API deployed and accessible (or working with mock data)

## Build the Application

First, build the application for production:

```bash
cd gaming-leaderboard
npm run build
```

This creates a `dist/` folder with the production-ready files.

## Deployment Options

### 1. Vercel (Recommended)

**Easiest option with automatic deployments from GitHub**

#### Steps:
1. **Push your code to GitHub** (if not already done)
2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
3. **Click "New Project"** and select your repository
4. **Configure project**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Set environment variables** (if needed):
   - `VITE_API_BASE_URL=https://your-api-domain.com`
6. **Deploy**: Click "Deploy"

#### For custom domain:
- Go to Project Settings → Domains
- Add your domain and follow DNS instructions

### 2. Netlify

**Great for static sites with easy drag-and-drop deployment**

#### Option A: Drag and Drop
1. **Build the project**: `npm run build`
2. **Go to [netlify.com](https://netlify.com)** and sign in
3. **Drag the `dist/` folder** to the deploy area
4. **Your site is live!**

#### Option B: Git Integration
1. **Connect your repository** to Netlify
2. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** (if needed) in Site settings
4. **Deploy automatically** on every push

### 3. GitHub Pages

**Free hosting for GitHub repositories**

#### Steps:
1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   {
     "homepage": "https://yourusername.github.io/repository-name",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

### 4. Traditional Web Server

**For hosting on your own server**

#### Steps:
1. **Build the project**: `npm run build`
2. **Upload the `dist/` folder** to your web server
3. **Configure server** to serve `index.html` for all routes (SPA routing)

#### Apache (.htaccess):
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Environment Configuration

### Production Environment Variables

Create a `.env` file with production values:

```env
# Production API URL
VITE_API_BASE_URL=https://your-api-domain.com

# Disable development features
VITE_LOG_API_CALLS=false
```

### Platform-Specific Environment Variables

#### Vercel
- Go to Project Settings → Environment Variables
- Add: `VITE_API_BASE_URL` with your API URL

#### Netlify
- Go to Site settings → Environment variables
- Add: `VITE_API_BASE_URL` with your API URL

## Important Notes

### API Configuration
- **Update API URL**: Change from `http://127.0.0.1:8000/` to your production API
- **CORS Setup**: Ensure your backend accepts requests from your domain
- **HTTPS**: Use HTTPS for production APIs

### Single Page Application (SPA)
The app uses client-side routing and needs special server configuration:
- **All routes must serve `index.html`**
- **404 errors should redirect to `index.html`**
- **Most hosting platforms handle this automatically**

### Testing Your Deployment

1. **Visit your deployed site**
2. **Check browser console** for any errors
3. **Test both features**:
   - Leaderboard should load (or show mock data)
   - Player search should work
4. **Verify API connection** (if using real backend)

## Common Issues

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 Errors on Page Refresh
- **Problem**: Routes don't work when directly accessed
- **Solution**: Configure server to serve `index.html` for all routes

### API Connection Issues
- **Problem**: "Network error" in production
- **Solution**: Check API URL and CORS configuration
- **Fallback**: App will use mock data automatically

### Environment Variables Not Working
- **Problem**: Still using development settings
- **Solution**: Verify platform-specific environment variable setup

## Deployment Checklist

Before deploying:
- [ ] Project builds successfully (`npm run build`)
- [ ] All features work locally
- [ ] API URL configured for production (if using real backend)
- [ ] Environment variables set (if needed)
- [ ] CORS configured on backend (if using real API)

After deploying:
- [ ] Site loads correctly
- [ ] Both leaderboard and search features work
- [ ] No console errors
- [ ] API connection verified (or mock data working)

## Rollback

If something goes wrong:

### Vercel/Netlify
- Use the platform dashboard to rollback to previous deployment

### GitHub Pages
```bash
# Revert to previous commit and redeploy
git revert HEAD
git push
npm run deploy
```

### Manual Deployment
- Keep backup of previous `dist/` folder
- Replace current files with backup

---

Most modern hosting platforms make deployment straightforward with automatic builds and good defaults for React applications. 