# GitHub Setup Guide - Implementing CI/CD

This guide walks you through implementing the GitHub Actions CI/CD setup in your GitHub repository.

## Step 1: Commit and Push Changes to GitHub

### 1.1 Review Your Changes
Check what files have been created/modified:

```bash
git status
```

You should see:
- New workflow files in `.github/workflows/`
- New test directories and files
- Updated `package.json` files
- Configuration files (Jest, Vitest, etc.)

### 1.2 Stage and Commit All Changes

```bash
# Stage all new files
git add .

# Commit with a descriptive message
git commit -m "feat: add GitHub Actions CI/CD setup with test framework

- Add Jest configuration for unit and integration tests
- Add Vitest configuration for UI component tests
- Add Playwright E2E test configuration
- Create GitHub Actions workflows (ci-dev, ci-pr, release)
- Add PR template and lint-staged config
- Update package.json with test scripts and dependencies
- Add example test files for all test types"
```

### 1.3 Push to Your Repository

```bash
# Push to your current branch (or create a feature branch first)
git push origin <your-branch-name>

# If you want to push directly to dev branch
git push origin dev
```

## Step 2: Create a Feature Branch (Recommended)

If you're not already on a feature branch, create one:

```bash
# Create and switch to a new branch
git checkout -b feature/ci-cd-setup

# Push the branch
git push -u origin feature/ci-cd-setup
```

Then create a Pull Request from this branch to `dev` or `main`.

## Step 3: Set Up Branch Protection Rules

### 3.1 For `main` Branch

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Click **Add branch protection rule**
4. Configure as follows:

```
Branch name pattern: main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Required status checks (add these as they appear in Actions):
      - Lint & Type Check
      - Unit Tests
      - UI Component Tests
      - Integration Tests
      - E2E Tests
      - Build Application
      - All Tests Passed

✅ Require conversation resolution before merging
✅ Require linear history
✅ Include administrators
```

5. Click **Create** or **Save changes**

### 3.2 For `dev` Branch (Optional)

Repeat the process for `dev` branch with lighter requirements:

```
Branch name pattern: dev

✅ Require status checks to pass before merging
   Required status checks:
      - Lint & Type Check
      - Unit Tests
      - All Tests Passed
```

## Step 4: Configure GitHub Secrets (Optional)

For enhanced functionality, add these secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

### Secrets to Add:

**SNYK_TOKEN** (for security scanning):
- Sign up at https://snyk.io/
- Get your API token from account settings
- Add as `SNYK_TOKEN`

**CODECOV_TOKEN** (for coverage reporting):
- Sign up at https://codecov.io/
- Add your repository
- Get the upload token
- Add as `CODECOV_TOKEN`

## Step 5: Install Dependencies Locally

Before the workflows run, install dependencies:

```bash
# Install root dependencies
npm install

# Install UI dependencies
cd src/ui && npm install && cd ../..
```

## Step 6: Test Workflows Locally (Optional)

Test that your scripts work before pushing:

```bash
# Run linting (will fail if ESLint isn't configured, that's okay)
npm run lint || echo "Lint check skipped - configure ESLint later"

# Run type checking
npm run typecheck
npm run typecheck:ui

# Run unit tests (may fail initially - that's expected)
npm run test:unit || echo "Tests will fail until dependencies are installed"
```

## Step 7: Create a Test Pull Request

To verify everything works:

1. **Make a small change** to trigger workflows:
   ```bash
   # Create a small test change
   echo "# Test PR" >> TEST.md
   git add TEST.md
   git commit -m "test: verify CI/CD workflows"
   git push
   ```

2. **Create a Pull Request**:
   - Go to GitHub → **Pull requests** → **New pull request**
   - Select your branch
   - Fill out the PR template
   - Create the PR

3. **Watch the Workflows Run**:
   - Go to **Actions** tab in GitHub
   - You should see workflows running
   - Wait for them to complete

## Step 8: Troubleshooting

### Workflows Not Running?

**Check:**
- Workflow files are in `.github/workflows/` directory
- Files have `.yml` extension
- YAML syntax is valid (no indentation errors)
- You've pushed to the correct branch (`dev` for ci-dev.yml, `main` for release.yml)

**Validate YAML:**
```bash
# Install yamllint (optional)
pip install yamllint

# Check workflow files
yamllint .github/workflows/*.yml
```

### Tests Failing?

**Common Issues:**
1. **Dependencies not installed**: Make sure `npm install` has been run
2. **Missing ESLint config**: Create `.eslintrc.js` or `.eslintrc.json`
3. **Type errors**: Fix TypeScript errors before pushing

**Quick Fix - Skip Tests Initially:**
The workflows have `continue-on-error: true` flags. You can remove these later when tests are fully implemented.

### Workflow Permissions Error?

If you see permission errors:
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Step 9: Enable Workflow Notifications (Optional)

### Email Notifications
- Go to **Settings** → **Notifications**
- Enable email notifications for Actions

### Slack Notifications (Advanced)
Add to `.github/workflows/notify.yml` (if you want Slack notifications - see original guide)

## Step 10: Verify Everything Works

### Checklist:
- [ ] All workflow files pushed to GitHub
- [ ] Branch protection rules configured
- [ ] Workflows appear in Actions tab
- [ ] Test PR created and workflows run
- [ ] Status checks appear on PR
- [ ] PR cannot be merged until checks pass (if branch protection is enabled)

## Quick Reference Commands

```bash
# Full setup sequence
git add .
git commit -m "feat: add GitHub Actions CI/CD setup"
git push origin <branch-name>

# Check workflow status
gh workflow list  # If you have GitHub CLI installed

# View workflow runs
# Go to: https://github.com/YOUR_USERNAME/RecorderApp/actions
```

## Next Steps After Implementation

1. **Install Dependencies**: Run `npm install` in root and `src/ui`
2. **Configure ESLint**: Create ESLint config file
3. **Write Real Tests**: Replace example tests with actual test implementations
4. **Remove Continue-on-Error**: Once tests are stable, remove `continue-on-error: true` from workflows
5. **Monitor Workflows**: Check Actions tab regularly to ensure everything runs smoothly

## Need Help?

- Check workflow logs in GitHub Actions tab
- Review the implementation summary: `GITHUB_ACTIONS_IMPLEMENTATION.md`
- Refer to original guide: `ElectronTest/GithubActionsTest.md`
