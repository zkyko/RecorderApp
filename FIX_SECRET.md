# 🔒 Fix: Remove Secret from Git History

GitHub blocked your push because there's a hardcoded API token in the code. I've removed it, but we also need to remove it from the git commit history.

## ✅ What I Fixed

I've removed the hardcoded API token from `src/main/services/jiraService.ts`. 

## 🔧 What You Need to Do

Since the commit with the secret is already in your local history, you need to remove it and recommit. Run these commands:

### Option 1: Reset and Recommit (Recommended)

```powershell
# 1. Reset the last commit (keeps your changes)
git reset --soft HEAD~1

# 2. Stage all changes again (including the fix)
git add .

# 3. Commit again (without the secret)
git commit -m "feat: add GitHub Actions CI/CD setup with test framework"

# 4. Push to dev branch
git push -u origin dev
```

### Option 2: Amend the Commit

```powershell
# 1. Stage the fixed file
git add src/main/services/jiraService.ts

# 2. Amend the previous commit
git commit --amend --no-edit

# 3. Force push (since we're rewriting history)
git push -u origin dev --force
```

## ⚠️ Important Notes

- **Never commit secrets again!** Use environment variables or config files that are gitignored
- The API token should be configured in Settings, not hardcoded in source code
- GitHub's push protection saved you from exposing this secret publicly!

## 📝 After Pushing

1. Verify on GitHub that the push succeeds
2. Check the Actions tab to see workflows running
3. Make sure your Jira API token is configured in the app Settings (not in code)
