# Create and Publish Release v1.7.0
$ErrorActionPreference = "Stop"

$version = "1.7.0"
$tag = "v$version"
$zipFile = "release-zips\QA-Studio-Windows-x64-v$version.zip"
$notesFile = "RELEASE_NOTES_v1.7.0.md"
$repo = "zkyko/RecorderApp"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating and Publishing Release v$version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ZIP file exists
if (-not (Test-Path $zipFile)) {
    Write-Host "❌ ERROR: ZIP file not found: $zipFile" -ForegroundColor Red
    Write-Host "Please build the application first." -ForegroundColor Yellow
    exit 1
}

$zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "✅ Found ZIP file: $zipFile ($zipSize MB)" -ForegroundColor Green
Write-Host ""

# Check if notes file exists
if (-not (Test-Path $notesFile)) {
    Write-Host "⚠️  WARNING: Release notes file not found: $notesFile" -ForegroundColor Yellow
    $notesFile = ""
}

# Check if release already exists
Write-Host "Checking if release already exists..." -ForegroundColor Cyan
$existingRelease = gh release view $tag --repo $repo 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Release $tag already exists!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current release status:" -ForegroundColor Cyan
    gh release view $tag --repo $repo 2>&1 | Select-String -Pattern "draft|published|state" | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    Write-Host ""
    $response = Read-Host "Do you want to delete and recreate it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Deleting existing release..." -ForegroundColor Yellow
        gh release delete $tag --repo $repo --yes
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to delete existing release" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Deleted existing release" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Aborted. You can manually edit the release at:" -ForegroundColor Yellow
        Write-Host "https://github.com/$repo/releases/tag/$tag" -ForegroundColor Cyan
        exit 0
    }
}

# Create release
Write-Host "Creating release $tag..." -ForegroundColor Cyan
if ($notesFile -and (Test-Path $notesFile)) {
    gh release create $tag `
        --title "QA Studio v$version" `
        --notes-file $notesFile `
        $zipFile `
        --repo $repo
} else {
    $notes = @"
QA Studio v$version

## What's New

- BrowserStack Test Management integration
- Context-Aware Recorder improvements
- Enhanced test execution capabilities

Download the ZIP file and extract it to run QA Studio.
"@
    $tempNotes = "temp-release-notes-$version.md"
    $notes | Out-File -FilePath $tempNotes -Encoding UTF8
    
    gh release create $tag `
        --title "QA Studio v$version" `
        --notes-file $tempNotes `
        $zipFile `
        --repo $repo
    
    Remove-Item $tempNotes -ErrorAction SilentlyContinue
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Release created successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Check if it's a draft and publish it
    Write-Host "Checking release status..." -ForegroundColor Cyan
    $releaseInfo = gh release view $tag --repo $repo --json isDraft 2>&1 | ConvertFrom-Json
    if ($releaseInfo.isDraft) {
        Write-Host "Publishing release..." -ForegroundColor Cyan
        gh release edit $tag --repo $repo --draft=false
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Release published successfully!" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Release is already published!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ Release Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "View release: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Cyan
    Write-Host "Download link: https://github.com/$repo/releases/download/$tag/QA-Studio-Windows-x64-v$version.zip" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ Failed to create release" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can create it manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/$repo/releases/new" -ForegroundColor White
    Write-Host "2. Tag: $tag" -ForegroundColor White
    Write-Host "3. Title: QA Studio v$version" -ForegroundColor White
    Write-Host "4. Upload: $zipFile" -ForegroundColor White
    exit 1
}


