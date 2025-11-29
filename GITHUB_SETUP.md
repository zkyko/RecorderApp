# GitHub Setup Instructions

## ✅ What's Been Configured

1. **GitHub Pages Deployment**
   - Workflow file: `.github/workflows/deploy.yml`
   - Automatically builds and deploys on push to `main`
   - Website will be available at: `https://zkyko.github.io/RecorderApp/`

2. **Download Links**
   - Hero section buttons point to GitHub Releases
   - Download page updated with release links
   - Links format: `https://github.com/zkyko/RecorderApp/releases/latest/download/[filename]`

## 🚀 Next Steps

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/zkyko/RecorderApp
2. Click **Settings** → **Pages**
3. Under **Source**, select **"GitHub Actions"**
4. Click **Save**

### 2. Push to GitHub

```bash
cd /Users/zk/Desktop/RecorderApp
git add .
git commit -m "Add Frontend website with GitHub Pages deployment"
git push origin main
```

### 3. Create First Release (for Download Links)

1. Go to **Releases** in your GitHub repo
2. Click **"Create a new release"**
3. Tag: `v1.5.0`
4. Title: `QA Studio v1.5.0`
5. Upload files:
   - `QA.Studio.Setup.1.5.0.exe` (Windows installer)
   - `QA.Studio-1.5.0.dmg` (Mac installer)
6. Click **"Publish release"**

**Note:** The download links expect these exact filenames:
- Windows: `QA.Studio.Setup.1.5.0.exe`
- Mac: `QA.Studio-1.5.0.dmg`

### 4. Verify Deployment

After pushing:
1. Check **Actions** tab - workflow should run automatically
2. Once complete, visit: `https://zkyko.github.io/RecorderApp/`
3. Test download buttons - they should link to your GitHub release

## 📝 Future Releases

When you create new releases:
1. Update version in `Frontend-website/app/download/page.tsx`
2. Upload new installer files with matching names
3. The `latest` download links will automatically point to the newest release

## 🔧 Custom Domain (Optional)

If you want to use a custom domain:
1. Update `next.config.js` - set `basePath: ''` and `assetPrefix: ''`
2. Add your domain in GitHub Pages settings
3. Update DNS records as instructed by GitHub

