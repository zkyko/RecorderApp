# Publish Release v1.7.0
Write-Host "Publishing GitHub release v1.7.0..." -ForegroundColor Cyan
Write-Host ""

gh release edit v1.7.0 --repo zkyko/RecorderApp --draft=false

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Release published successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View your release at:" -ForegroundColor Cyan
    Write-Host "https://github.com/zkyko/RecorderApp/releases/tag/v1.7.0" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to publish release." -ForegroundColor Red
    Write-Host "You may need to publish it manually through the GitHub web interface." -ForegroundColor Yellow
    Write-Host ""
}


