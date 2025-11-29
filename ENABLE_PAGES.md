# Enable GitHub Pages - Required Step

## ⚠️ Important: You must enable GitHub Pages manually before the workflow can deploy.

### Steps to Enable GitHub Pages:

1. **Go to your repository settings:**
   - Visit: https://github.com/zkyko/RecorderApp/settings/pages

2. **Configure Pages:**
   - Under **"Source"**, select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Click **"Save"**

3. **Verify:**
   - You should see a message that Pages is enabled
   - The workflow will now be able to deploy

### Why This Is Required:

GitHub requires repository admin permissions to enable Pages. The workflow cannot do this automatically for security reasons. Once enabled manually, the workflow will handle all future deployments automatically.

### After Enabling:

- The workflow will run automatically on every push to `main`
- Your site will be available at: `https://zkyko.github.io/RecorderApp/`
- You can check deployment status in the **Actions** tab

