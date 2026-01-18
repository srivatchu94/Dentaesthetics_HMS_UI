# 🚀 Quick Start - Deploy to Production

## Configuration Summary

✅ **API Endpoint:** `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`
✅ **Swagger:** `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/swagger/index.html`

All hardcoded URLs have been replaced with environment-based configuration.

---

## Deploy in 3 Steps

### 1️⃣ Build for Production
```bash
npm install
npm run build
```

### 2️⃣ Test Locally (Optional)
```bash
npm run preview
```
Open `http://localhost:4173` and verify API calls work correctly.

### 3️⃣ Deploy to Your Host
Upload the **`dist/`** folder to your hosting platform:

#### Azure Static Web Apps:
```bash
az staticwebapp upload --app-name <your-app-name> --app-location "dist"
```

#### Vercel:
```bash
vercel deploy --prod
```

#### Netlify:
```bash
netlify deploy --prod --dir=dist
```

#### GitHub Pages, AWS S3, etc:
Simply copy the contents of the `dist/` folder to your hosting service.

---

## What Changed

### ✨ New Files Created:
- `.env` - Default environment config (cloud API)
- `.env.development` - Development config (local API)
- `.env.production` - Production config (cloud API)
- `src/config/apiConfig.ts` - API configuration helper
- `DEPLOYMENT.md` - Full deployment guide

### 📝 Files Updated:
- `src/api/hmsApi.ts`
- `src/services/apiClient.ts`
- `src/services/hmsApi.ts`
- All component files (`src/components/`)
- All page files (`src/pages/`)
- All service files (`src/services/`)

All now use: `(import.meta as any).env?.VITE_API_BASE_URL`

---

## Verify Configuration

Before deploying, ensure:

```bash
# Check dist folder exists
ls -la dist/

# Verify build size is reasonable
du -sh dist/

# Optional: Run preview
npm run preview
```

Then open browser DevTools (F12) → Network tab and check that API calls go to:
```
https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/
```

---

## Environment Variables

### Current Configuration:

**`.env` (Production)**
```env
VITE_API_BASE_URL=https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api
```

**`.env.development` (Local)**
```env
VITE_API_BASE_URL=https://localhost:7104/api
```

### To Switch Environments:
Vite automatically selects the right `.env` file based on build mode:
- `npm run dev` → uses `.env.development`
- `npm run build` → uses `.env.production`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API not connecting | Clear cache: `rm -rf dist node_modules`, then `npm install && npm run build` |
| Wrong API in production | Ensure `.env.production` exists in root directory |
| CORS errors | Contact API admin to verify CORS headers allow your domain |
| 404 errors | Verify API endpoint is correct in DevTools Network tab |

---

## Next Steps

1. ✅ Build: `npm run build`
2. ✅ Test: `npm run preview` (optional)
3. ✅ Deploy: Upload `dist/` folder
4. ✅ Monitor: Check API calls in browser DevTools

**You're ready to deploy!** 🎉
