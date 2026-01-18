# 🚀 Azure Deployment - Quick Reference

## ✅ Issue Fixed

| Before | After |
|--------|-------|
| ❌ `output_location: build` | ✅ `output_location: dist` |
| ❌ Error: Folder not found | ✅ Correct build output |

---

## 📋 3-Step Setup

### Step 1: Add GitHub Secrets (2 minutes)

Go to: `GitHub Repo → Settings → Secrets and variables → Actions`

**Add Secret 1 (REQUIRED):**
```
Name:  AZURE_STATIC_WEB_APPS_API_TOKEN
Value: [Get from Azure Portal]
```

**Add Secret 2 (RECOMMENDED):**
```
Name:  VITE_API_BASE_URL
Value: https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api
```

### Step 2: Push Changes (1 minute)

```bash
git add .
git commit -m "Fix Azure deployment"
git push origin main
```

### Step 3: Deploy (Automatic!)

- ✅ GitHub Actions runs automatically
- ✅ Builds with Vite
- ✅ Outputs to `dist/`
- ✅ Deploys to Azure

---

## 📍 Get Azure Token

1. Azure Portal → Your Static Web Apps resource
2. Find: **Overview** or **Settings**
3. Click: **Manage deployment token**
4. Copy the token
5. Add to GitHub Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`

---

## ✨ Files Created

```
✅ .github/workflows/azure-static-web-apps-deploy.yml
   - GitHub Actions workflow
   - Correct output_location: dist
   - Automatic build & deploy

✅ AZURE_SETUP.md
   - Detailed setup guide
   - Troubleshooting tips

✅ FIX_AZURE_ERROR.md
   - This quick fix summary
```

---

## 🔍 Verify Deployment

1. **Push Code:** `git push origin main`
2. **Watch Build:** GitHub Repo → Actions tab
3. **Check Deployment:** Azure Portal → Static Web Apps → URL
4. **Test API:** DevTools → Network → Check cloud API endpoint

---

## ✅ You're Done!

Once secrets are added and you push to main, Azure will automatically:
- ✅ Build your app
- ✅ Output to `dist/` (fixed!)
- ✅ Deploy to Azure
- ✅ Live app accessible

**Status:** Ready for deployment! 🚀
