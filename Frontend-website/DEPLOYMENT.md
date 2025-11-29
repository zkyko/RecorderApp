# Deployment Guide

## GitHub Pages Setup

This website is configured to deploy automatically to GitHub Pages when you push to the `main` branch.

### Initial Setup

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

2. **The website will be available at:**
   - `https://zkyko.github.io/RecorderApp/`

### Manual Deployment

If you need to deploy manually:

```bash
cd Frontend-website
npm install
npm run build
# The static files will be in the 'out' directory
```

### Download Links

The download buttons point to GitHub Releases. To update:

1. Create a new release on GitHub
2. Upload the Windows `.exe` file as `QA.Studio.Setup.1.5.0.exe`
3. Upload the Mac `.dmg` file as `QA.Studio-1.5.0.dmg`
4. The links will automatically point to the latest release

### Custom Domain (Optional)

If you want to use a custom domain:

1. Update `next.config.js` to remove `basePath` and `assetPrefix`
2. Add your custom domain in GitHub Pages settings
3. Update CNAME file if needed

