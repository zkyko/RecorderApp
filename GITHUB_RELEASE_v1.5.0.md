# GitHub Release Instructions for v1.5.0

## Release Files Ready

The following release files have been built and are ready for upload:

- `release-zips/QA-Studio-Windows-x64-v1.5.0.zip` (111.33 MB)
- `release-zips/QA-Studio-Windows-ARM64-v1.5.0.zip` (112.68 MB)

**Note:** Mac build needs to be created on a Mac machine using `npm run dist:mac`

## Steps to Create GitHub Release

1. **Go to GitHub Releases:**
   - Navigate to: https://github.com/zkyko/RecorderApp/releases/new

2. **Create New Release:**
   - **Tag version:** `v1.5.0`
   - **Release title:** `QA Studio v1.5.0`
   - **Description:** (Use the release notes below)

3. **Upload Files:**
   - Click "Attach binaries by dropping them here or selecting them"
   - Upload both zip files from the `release-zips/` directory:
     - `QA-Studio-Windows-x64-v1.5.0.zip`
     - `QA-Studio-Windows-ARM64-v1.5.0.zip`

4. **Publish Release:**
   - Click "Publish release"

## Release Notes Template

```markdown
# QA Studio v1.5.0

## Visual Test Builder & Enhanced Workflow

Major update introducing visual test building capabilities and improved locator management.

### What's New

- **Visual Test Builder (BETA)** - Build test steps visually by selecting locators and actions
- **Complete workflow integration** - Visual Builder now follows same flow as manual recording (Step Editor → Locator Cleanup → Parameter Mapping → Save Test)
- **BrowseLocator Tool** - Interactive browser for capturing and evaluating locators with quality metrics
- **Editable Steps Tab** - Edit test steps directly from the UI with add, delete, and reorder capabilities
- **Locator Library** - Centralized locator management with status tracking and synchronization
- **Enhanced Trace Viewer** - More prominent trace debugging with dedicated tab and improved visibility
- **Dev Mode Settings** - Advanced developer controls including workspace management, temp file cleanup, and statistics
- **Fixed locator status saving** - Status changes now persist correctly across the application

## Downloads

- **Windows x64:** [QA-Studio-Windows-x64-v1.5.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.5.0/QA-Studio-Windows-x64-v1.5.0.zip)
- **Windows ARM64:** [QA-Studio-Windows-ARM64-v1.5.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.5.0/QA-Studio-Windows-ARM64-v1.5.0.zip)

## Installation

1. Download the appropriate zip file for your Windows platform (x64 or ARM64)
2. Extract the zip file to your desired location
3. Run `QA Studio.exe` from the extracted folder

## Full Changelog

See the [Updates page](https://zkyko.github.io/RecorderApp/updates) for the complete changelog.
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh release create v1.5.0 \
  release-zips/QA-Studio-Windows-x64-v1.5.0.zip \
  release-zips/QA-Studio-Windows-ARM64-v1.5.0.zip \
  --title "QA Studio v1.5.0" \
  --notes-file GITHUB_RELEASE_v1.5.0.md
```

