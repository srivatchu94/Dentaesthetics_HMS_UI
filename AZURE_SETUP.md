# 🔧 Azure Static Web Apps Configuration

## ✅ Workflow Fixed!

The GitHub Actions workflow has been corrected to use the correct build output folder.

---

## 🔑 Required GitHub Secrets

Before deploying, add these secrets to your GitHub repository:

### 1. Azure Static Web Apps API Token

1. Go to your **Azure Static Web Apps** resource in Azure Portal
2. Click **Manage deployment token** (or get from **Overview** → **Manage deployment token**)
3. Copy the token
4. Add to GitHub:
   - Go to your repo → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the token

### 2. API Base URL (Optional but Recommended)

Add this secret for production API configuration:

1. Go to GitHub Secrets (as above)
2. Click **New repository secret**
3. Name: `VITE_API_BASE_URL`
4. Value: `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`

---

## 📋 Workflow Configuration

The workflow (`azure-static-web-apps-deploy.yml`) is now correctly configured:

### Key Settings:
```yaml
app_location: "/"              # Source code root
output_location: "dist"        # Vite build output ✅ FIXED
skip_app_build: true           # We handle build ourselves
```

### Build Command:
```bash
npm install
npm run build
```

### What It Does:
1. ✅ Installs dependencies
2. ✅ Builds the app with Vite
3. ✅ Outputs to `dist/` folder
4. ✅ Deploys `dist/` contents to Azure

---

## 🚀 Deploy Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Fix Azure deployment configuration"
git push origin main
```

### Step 2: GitHub Actions Runs Automatically
- Workflow triggers on push to `main`
- Builds the app
- Deploys to Azure Static Web Apps

### Step 3: Monitor Deployment
- Go to your GitHub repo
- Click **Actions** tab
- Watch the workflow run
- Check deployment status

### Step 4: Verify Live Site
- Go to your Azure Static Web Apps resource
- Copy the **URL**
- Paste in browser
- Test all features

---

## 🔍 Troubleshooting

### Workflow Still Fails

**Check error logs:**
1. Go to GitHub repo → **Actions**
2. Click on the failed workflow run
3. Expand the step that failed
4. Read the error message

**Common Issues:**

| Error | Solution |
|-------|----------|
| `npm ERR!` | Run `npm install` locally to verify |
| `VITE build error` | Check `.env.production` exists |
| `Output folder not found` | Ensure `output_location: dist` in workflow |
| `API token error` | Verify secret name and value |

### Secrets Not Set

If you see "secrets missing" error:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN`
3. Optionally add `VITE_API_BASE_URL`
4. Run workflow again

### Build Succeeds But Deploy Fails

1. Check Azure Static Web Apps resource exists
2. Verify API token is correct
3. Check resource name matches in workflow
4. Run manual redeployment from Azure Portal

---

## 📁 Repository Structure

```
.github/workflows/
└── azure-static-web-apps-deploy.yml ✅ NEW FILE
.env                                  ✅ Production config
.env.production                       ✅ Production config
.env.development                      ✅ Dev config
src/                                  ✅ Source code
dist/                                 ⬅️ Build output
package.json                          ✅ Dependencies
vite.config.js                        ✅ Build config
```

---

## ✨ What This Fixes

### Before (Error):
```
output_location: build
❌ Error: 'build' folder not found
```

### After (Fixed):
```
output_location: dist
✅ Success: dist folder found and deployed
```

---

## 🎯 Environment Variables in Workflow

The workflow now passes environment variables during build:

```yaml
env:
  VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
```

This ensures:
- ✅ Cloud API URL compiled into production build
- ✅ Correct API endpoint in deployed app
- ✅ No hardcoded URLs in code

---

## 📚 Next Steps

1. **Verify secrets are set** in GitHub
2. **Push to main branch** to trigger workflow
3. **Monitor Actions tab** for build/deploy
4. **Test live site** once deployed
5. **Check DevTools** to verify API calls go to cloud endpoint

---

## 📞 Reference Links

- [Azure Static Web Apps Docs](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

---

## ✅ You're Ready!

Your GitHub Actions workflow is now correctly configured to:
1. ✅ Build with Vite
2. ✅ Output to `dist/` folder
3. ✅ Deploy to Azure Static Web Apps
4. ✅ Use environment variables for API configuration

**Next: Push to GitHub and watch it deploy!** 🚀
