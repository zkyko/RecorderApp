# PowerShell script to create GitHub release for v1.7.0
# Run this after authenticating with GitHub CLI: gh auth login

$version = "1.7.0"
$tag = "v$version"
$title = "QA Studio v$version"

# Release notes
$notes = @"
# QA Studio v1.7.0

## BrowserStack Integration & Enhanced Recorder Logic

Major update adding full BrowserStack cloud testing integration and improved context-aware recording logic for more reliable test generation.

### What's New

- **BrowserStack Test Management** - Embedded BrowserStack TM interface directly in QA Studio sidebar with persistent login sessions
- **BrowserStack Test Execution** - Full cloud test execution support with automatic config generation, credential management, and environment variable handling
- **Context-Aware Recorder** - Smart navigation step preservation for workspace context (e.g., 'All sales orders' clicks now preserve navigation steps)
- **Toolbar Button Context Tracking** - Recorder now tracks workspace context and warns when toolbar buttons are used without proper navigation
- **DOM-Aware Locator Detection** - Enhanced heuristics using D365-specific attributes (data-dyn-controlname, data-dyn-menutext) for better context-setting click detection
- **Windows Filesystem Lock Fix** - Robust file deletion with fs-extra and automatic retry logic for EBUSY errors on Windows
- **Improved Test Execution Logging** - Better visibility into test runs with streaming output and error handling

### Technical Improvements

- Added `fs-extra` dependency for cross-platform file operations
- Implemented context state machine for recorder logic (None → PendingNav → Ready)
- Enhanced BrowserStack config generation with dynamic browser/OS selection
- Added persistent session partition for BrowserStack TM webview

## Downloads

- **Windows x64:** [QA-Studio-Windows-x64-v1.7.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-x64-v1.7.0.zip)
- **Windows ARM64:** [QA-Studio-Windows-ARM64-v1.7.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-ARM64-v1.7.0.zip)
- **Mac ARM64:** (Coming soon - needs to be built on Mac)

## Installation

1. Download the appropriate zip file for your platform
2. Extract the zip file to your desired location
3. Run `QA Studio.exe` (Windows) or `QA Studio.app` (Mac) from the extracted folder

## Full Changelog

See the [Updates page](https://zkyko.github.io/RecorderApp/updates) for the complete changelog.
"@

Write-Host "Creating GitHub release: $tag" -ForegroundColor Cyan
Write-Host "Title: $title" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Error: GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Create the release
Write-Host "Creating release..." -ForegroundColor Green
gh release create $tag --title $title --notes $notes --draft=false --prerelease=false

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Release created successfully!" -ForegroundColor Green
    Write-Host "Release URL: https://github.com/zkyko/RecorderApp/releases/tag/$tag" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Error creating release. Check the output above for details." -ForegroundColor Red
    exit 1
}


