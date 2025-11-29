# Release Guide

## Creating a GitHub Release

### Step 1: Build and Package Releases

```bash
# Build Windows x64
npm run dist:win

# Build Windows ARM64 (optional)
npm run dist:win:arm64

# Build Mac (on macOS)
npm run dist:mac

# Package all builds into zip files
npm run package:releases
```

This will create zip files in the `release-zips/` directory:
- `QA-Studio-Windows-x64-v1.5.0.zip`
- `QA-Studio-Windows-ARM64-v1.5.0.zip` (if built)
- `QA-Studio-Mac-ARM64-v1.5.0.zip` (if built on macOS)

### Step 2: Create GitHub Release

1. Go to: https://github.com/zkyko/RecorderApp/releases/new

2. Fill in the release details:
   - **Tag**: `v1.5.0` (or your version)
   - **Title**: `QA Studio v1.5.0`
   - **Description**: Add release notes

3. **Upload the zip files** from `release-zips/`:
   - Drag and drop all zip files
   - Or click "Attach binaries" and select files

4. Click **"Publish release"**

### Step 3: Verify Download Links

The download links on the website will automatically point to:
- Windows x64: `https://github.com/zkyko/RecorderApp/releases/latest/download/QA-Studio-Windows-x64-v1.5.0.zip`
- Windows ARM64: `https://github.com/zkyko/RecorderApp/releases/latest/download/QA-Studio-Windows-ARM64-v1.5.0.zip`
- Mac: `https://github.com/zkyko/RecorderApp/releases/latest/download/QA-Studio-Mac-ARM64-v1.5.0.zip`

**Note**: The `latest` tag automatically points to the most recent release, so users always get the newest version.

## Available Build Commands

- `npm run dist:win` - Build Windows x64 unpacked
- `npm run dist:win:arm64` - Build Windows ARM64 unpacked
- `npm run dist:mac` - Build Mac unpacked (macOS only)
- `npm run package:releases` - Package all builds into zip files

## File Sizes

Typical file sizes:
- Windows x64: ~110 MB
- Windows ARM64: ~110 MB
- Mac ARM64: ~270 MB

Make sure you have enough space and bandwidth to upload these files to GitHub.

