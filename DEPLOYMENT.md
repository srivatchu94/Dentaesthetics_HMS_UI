# Dentaesthetics HMS UI - Deployment Guide

## ✅ Configuration Complete

The application has been updated to work with the cloud-deployed API.

### API Configuration

**Cloud API URL:** `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/swagger/index.html`

**API Base URL:** `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`

---

## Environment Setup

### Environment Files

The project includes environment configuration files:

- **`.env`** - Default environment variables
- **`.env.development`** - Local development configuration
- **`.env.production`** - Production deployment configuration
- **`src/config/apiConfig.ts`** - API configuration helper

### Environment Variables

The API base URL is configured via the `VITE_API_BASE_URL` environment variable:

```env
# Production (Cloud Azure)
VITE_API_BASE_URL=https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api

# Development (Local)
VITE_API_BASE_URL=https://localhost:7104/api
```

---

## Building for Production

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build the Project
```bash
npm run build
```

This will:
- Bundle the React application
- Use the `.env.production` configuration
- Output production-ready files to the `dist/` folder

### Step 3: Deploy

The `dist/` folder contains all the static files needed for deployment:

#### Option A: Azure Static Web Apps
```bash
# Deploy using Azure CLI
az staticwebapp upload --app-name <app-name> --app-location "dist" --source .
```

#### Option B: Any Static Hosting
Upload the contents of the `dist/` folder to your hosting provider (Vercel, Netlify, GitHub Pages, etc.)

---

## Development Setup

For local development with the cloud API:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The dev server will run at `http://localhost:5173` and connect to the cloud API at:
`https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`

To use local API instead:
```bash
# Create or edit .env.development
VITE_API_BASE_URL=https://localhost:7104/api
```

---

## API Changes Made

All API client files have been updated to support dynamic base URLs:

### Files Modified:
1. **`src/api/hmsApi.ts`** - Uses environment variable with cloud API fallback
2. **`src/services/apiClient.ts`** - Main API client with dynamic base URL
3. **`src/services/hmsApi.ts`** - Service layer API client
4. **`src/config/apiConfig.ts`** - Configuration helper (NEW)
5. **All component/page files** - Updated to use environment-based URLs

### Environment-Based Configuration Pattern:

```typescript
// Example from updated files
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 
  'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';
```

---

## Deployment Checklist

- [x] API base URL updated to cloud deployment
- [x] Environment configuration files created (`.env`, `.env.production`, `.env.development`)
- [x] API client files updated with dynamic base URL
- [x] All hardcoded localhost URLs removed
- [x] Config helper created (`src/config/apiConfig.ts`)
- [ ] Test build locally: `npm run build`
- [ ] Verify `dist/` folder is created
- [ ] Test production build: `npm run preview`
- [ ] Deploy to hosting platform

---

## Testing

### Local Build Test:
```bash
npm run build
npm run preview
```

This will create a production build and serve it locally to verify everything works.

### Verify API Connection:
Open browser DevTools → Network tab and check that API calls are going to:
`https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`

---

## Troubleshooting

### API calls still going to localhost
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Run `npm run build`

### Environment variable not loading
- Ensure `.env.production` is in the root directory
- Vite reads env files at build time, not runtime
- Rebuild after changing environment files: `npm run build`

### CORS Issues
- Verify API server CORS headers allow your deployment domain
- Check Azure App Service CORS settings if deployed to Azure

---

## Next Steps

1. **Build:** `npm run build`
2. **Test:** `npm run preview`
3. **Deploy:** Upload `dist/` folder to your hosting platform
4. **Monitor:** Check API calls in browser DevTools to confirm proper connectivity

For deployment-specific setup (Azure, Vercel, etc.), refer to their documentation.
