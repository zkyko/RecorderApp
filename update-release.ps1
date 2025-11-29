# PowerShell script to update existing GitHub release for v1.5.0

$version = "1.5.0"
$tag = "v$version"
$title = "QA Studio v$version"

# Release notes
$notes = @"
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
- **Mac ARM64:** (Coming soon - needs to be built on Mac)

## Installation

1. Download the appropriate zip file for your platform
2. Extract the zip file to your desired location
3. Run `QA Studio.exe` (Windows) or `QA Studio.app` (Mac) from the extracted folder

## Full Changelog

See the [Updates page](https://zkyko.github.io/RecorderApp/updates) for the complete changelog.
"@

Write-Host "Updating GitHub release: $tag" -ForegroundColor Cyan

# Check if files exist
$files = @(
    "release-zips\QA-Studio-Windows-x64-v$version.zip",
    "release-zips\QA-Studio-Windows-ARM64-v$version.zip"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "ERROR: File not found: $file" -ForegroundColor Red
        exit 1
    }
    Write-Host "Found: $file" -ForegroundColor Green
}

# Save notes to temp file
$notesFile = "release-notes-temp.md"
$notes | Out-File -FilePath $notesFile -Encoding UTF8

Write-Host ""
Write-Host "Updating release with new files..." -ForegroundColor Cyan

try {
    # Update the release notes
    gh release edit $tag --title $title --notes-file $notesFile
    
    # Upload/update the files
    gh release upload $tag `
        release-zips\QA-Studio-Windows-x64-v$version.zip `
        release-zips\QA-Studio-Windows-ARM64-v$version.zip `
        --clobber
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Release updated successfully!" -ForegroundColor Green
        Write-Host "View release: https://github.com/zkyko/RecorderApp/releases/tag/$tag" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: Failed to update release." -ForegroundColor Red
        Write-Host "You can manually update it at: https://github.com/zkyko/RecorderApp/releases/tag/$tag" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update the release manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://github.com/zkyko/RecorderApp/releases/tag/$tag" -ForegroundColor White
    Write-Host "   2. Click 'Edit release'" -ForegroundColor White
    Write-Host "   3. Upload/update files from release-zips/" -ForegroundColor White
    Write-Host "   4. Update release notes from: $notesFile" -ForegroundColor White
}

# Clean up temp file
if (Test-Path $notesFile) {
    Remove-Item $notesFile
}

