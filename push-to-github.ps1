# PowerShell script to commit and push CI/CD setup to GitHub dev branch

Write-Host "=== GitHub CI/CD Setup Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
$projectPath = "c:\Users\Nbhandari\Desktop\QA Studio\RecorderApp"
Set-Location $projectPath

# Check if we're in a git repo
Write-Host "1. Checking git repository..." -ForegroundColor Yellow
$gitCheck = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not a git repository!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Git repository found" -ForegroundColor Green

# Show current branch
Write-Host ""
Write-Host "2. Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Current branch: $currentBranch" -ForegroundColor Cyan

# Show remote
Write-Host ""
Write-Host "3. Checking remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Remote: $remote" -ForegroundColor Cyan
} else {
    Write-Host "   WARNING: No remote 'origin' found" -ForegroundColor Yellow
}

# Check status
Write-Host ""
Write-Host "4. Checking git status..." -ForegroundColor Yellow
git status --short

# Stage all changes
Write-Host ""
Write-Host "5. Staging all changes..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Files staged" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error staging files" -ForegroundColor Red
    exit 1
}

# Check what will be committed
Write-Host ""
Write-Host "6. Files to be committed:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host ""
Write-Host "7. Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
feat: add GitHub Actions CI/CD setup with test framework

- Add Jest configuration for unit and integration tests
- Add Vitest configuration for UI component tests
- Add Playwright E2E test configuration
- Create GitHub Actions workflows (ci-dev, ci-pr, release)
- Add PR template and lint-staged config
- Update package.json with test scripts and dependencies
- Add example test files for all test types
"@

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error committing (may be no changes to commit)" -ForegroundColor Yellow
}

# Switch to or create dev branch
Write-Host ""
Write-Host "8. Switching to dev branch..." -ForegroundColor Yellow
$devBranchExists = git branch -a | Select-String "dev"
if ($devBranchExists) {
    Write-Host "   Dev branch exists, checking out..." -ForegroundColor Cyan
    git checkout dev 2>&1
} else {
    Write-Host "   Dev branch doesn't exist, creating..." -ForegroundColor Cyan
    git checkout -b dev 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ On dev branch" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error switching to dev branch" -ForegroundColor Red
}

# Push to dev branch
Write-Host ""
Write-Host "9. Pushing to origin/dev..." -ForegroundColor Yellow
Write-Host "   This will push the current branch to GitHub..." -ForegroundColor Cyan
git push origin dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Successfully pushed to origin/dev" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error pushing to origin/dev" -ForegroundColor Red
    Write-Host "   You may need to set upstream: git push -u origin dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Trying with -u flag..." -ForegroundColor Yellow
    git push -u origin dev
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to your GitHub repository" -ForegroundColor White
Write-Host "2. Check the Actions tab to see workflows running" -ForegroundColor White
Write-Host "3. Configure branch protection rules (Settings -> Branches)" -ForegroundColor White
Write-Host ""
