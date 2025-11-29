# GitHub Release Upload Instructions

## For Large Files (Releases)

GitHub **releases** support files up to **2GB**, so your zip files can be uploaded directly:

- ✅ Windows x64: 111 MB - OK
- ✅ Windows ARM64: 112 MB - OK  
- ✅ Mac ARM64: 272 MB - OK

## Option 1: Using GitHub CLI (Recommended)

### Step 1: Authenticate GitHub CLI

```bash
gh auth login
```

Follow the prompts:
- Choose "GitHub.com"
- Choose "HTTPS" or "SSH"
- Choose "Login with a web browser" (easiest)
- Authorize the app

### Step 2: Create Release and Upload Files

```bash
# Create release and upload all files at once
npm run release:github 1.5.0
```

Or manually:
```bash
# Create draft release
gh release create v1.5.0 \
  --title "QA Studio v1.5.0" \
  --notes "Release notes here" \
  --repo zkyko/RecorderApp \
  --draft

# Upload files
gh release upload v1.5.0 release-zips/*.zip --repo zkyko/RecorderApp --clobber

# Publish release
gh release edit v1.5.0 --repo zkyko/RecorderApp --draft=false
```

## Option 2: Using Web Interface

1. Go to: https://github.com/zkyko/RecorderApp/releases/new
2. Tag: `v1.5.0`
3. Title: `QA Studio v1.5.0`
4. Drag and drop all 3 zip files from `release-zips/` folder
5. Click "Publish release"

**Note**: GitHub web interface supports files up to 2GB, so all your files will upload fine.

## Option 3: Using Git LFS (Only if pushing to repo)

If you ever need to push large files to the repository itself (not releases), you'd need Git LFS:

```bash
# Install Git LFS
brew install git-lfs

# Initialize in your repo
git lfs install

# Track large files
git lfs track "*.zip"
git lfs track "release-zips/**"

# Add and commit
git add .gitattributes
git commit -m "Add Git LFS tracking for large files"
```

**However, you don't need this for releases** - releases handle large files natively.

## File Size Limits

- **Regular Git files**: 100 MB limit (would need Git LFS)
- **GitHub Releases**: 2 GB limit per file ✅
- **Your files**: All under 300 MB ✅

## Quick Command Reference

```bash
# Package releases
npm run package:releases

# Create and upload release (after auth)
npm run release:github 1.5.0

# Or use the script directly
./scripts/create-github-release.sh 1.5.0
```

