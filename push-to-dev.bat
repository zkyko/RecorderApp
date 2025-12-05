@echo off
echo ========================================
echo Pushing CI/CD Setup to GitHub Dev Branch
echo ========================================
echo.

cd /d "c:\Users\Nbhandari\Desktop\QA Studio\RecorderApp"

echo Step 1: Staging all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to stage files
    pause
    exit /b 1
)
echo ✓ Files staged
echo.

echo Step 2: Committing changes...
git commit -m "feat: add GitHub Actions CI/CD setup with test framework"
if %errorlevel% neq 0 (
    echo NOTE: No changes to commit or commit failed
    echo.
)
echo.

echo Step 3: Checking current branch...
git branch --show-current
echo.

echo Step 4: Switching to dev branch (if needed)...
git checkout dev 2>nul
if %errorlevel% neq 0 (
    echo Creating dev branch...
    git checkout -b dev
)
echo.

echo Step 5: Pushing to origin/dev...
git push -u origin dev
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Push failed. You may need to:
    echo   1. Check your GitHub credentials
    echo   2. Verify remote is configured: git remote -v
    echo   3. Manually push: git push -u origin dev
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✓ Successfully pushed to GitHub!
echo ========================================
echo.
echo Next steps:
echo 1. Go to your GitHub repository
echo 2. Check the Actions tab to see workflows
echo 3. Configure branch protection (Settings -^> Branches)
echo.
pause
