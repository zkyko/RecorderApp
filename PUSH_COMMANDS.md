# Commands to Push CI/CD Setup to GitHub

Run these commands in PowerShell or Git Bash from your project directory:

## Step 1: Check Current Status

```powershell
cd "c:\Users\Nbhandari\Desktop\QA Studio\RecorderApp"
git status
```

## Step 2: Stage All Changes

```powershell
git add .
```

## Step 3: Commit Changes

```powershell
git commit -m "feat: add GitHub Actions CI/CD setup with test framework

- Add Jest configuration for unit and integration tests
- Add Vitest configuration for UI component tests
- Add Playwright E2E test configuration
- Create GitHub Actions workflows (ci-dev, ci-pr, release)
- Add PR template and lint-staged config
- Update package.json with test scripts and dependencies
- Add example test files for all test types"
```

## Step 4: Switch to Dev Branch (if not already on it)

```powershell
# Check if dev branch exists
git branch -a

# If dev branch exists locally:
git checkout dev

# If dev branch doesn't exist, create it:
git checkout -b dev

# If dev branch exists on remote but not locally:
git checkout -b dev origin/dev
```

## Step 5: Push to GitHub

```powershell
# Push to dev branch (first time with -u to set upstream)
git push -u origin dev

# Or if already tracking:
git push origin dev
```

## Alternative: Push Current Branch First, Then Merge to Dev

If you're on a different branch and want to create a PR:

```powershell
# Push your current branch
git push -u origin <your-current-branch-name>

# Then create a Pull Request on GitHub from your branch to dev
```

## Verify on GitHub

After pushing:

1. Go to: `https://github.com/YOUR_USERNAME/RecorderApp`
2. Check the **Actions** tab - you should see workflows
3. Check that files are in `.github/workflows/` directory

## Quick One-Liner (if you're already on dev branch)

```powershell
cd "c:\Users\Nbhandari\Desktop\QA Studio\RecorderApp" && git add . && git commit -m "feat: add GitHub Actions CI/CD setup" && git push origin dev
```
