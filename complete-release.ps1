# Complete Release Script for v1.7.0
# Run this to package and upload the release

$ErrorActionPreference = "Stop"
$version = "1.7.0"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Completing QA Studio v$version Release" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create ZIP file if it doesn't exist
$zipPath = "release-zips\QA-Studio-Windows-x64-v$version.zip"
if (-not (Test-Path $zipPath)) {
    Write-Host "Creating ZIP file from win-unpacked..." -ForegroundColor Yellow
    if (-not (Test-Path "release-zips")) {
        New-Item -ItemType Directory -Path "release-zips" | Out-Null
    }
    Compress-Archive -Path "release\win-unpacked" -DestinationPath $zipPath -Force
    Write-Host "✅ Created: $zipPath" -ForegroundColor Green
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "   Size: $zipSize MB" -ForegroundColor Gray
} else {
    Write-Host "✅ ZIP file already exists: $zipPath" -ForegroundColor Green
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "   Size: $zipSize MB" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Upload to GitHub release
Write-Host "Uploading to GitHub release v$version..." -ForegroundColor Cyan
try {
    gh release upload "v$version" $zipPath --repo zkyko/RecorderApp --clobber
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error uploading: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Publish the release
Write-Host "Publishing release..." -ForegroundColor Cyan
try {
    gh release edit "v$version" --repo zkyko/RecorderApp --draft=false
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Release published successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Release might already be published or there was an issue." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error publishing release: $_" -ForegroundColor Yellow
    Write-Host "   You may need to publish it manually at:" -ForegroundColor Yellow
    Write-Host "   https://github.com/zkyko/RecorderApp/releases/tag/v$version" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Release Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View release: https://github.com/zkyko/RecorderApp/releases/tag/v$version" -ForegroundColor Cyan
Write-Host ""

