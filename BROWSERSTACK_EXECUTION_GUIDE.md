# BrowserStack Automate Execution Guide

## Why Can't I Execute Tests in BrowserStack Automate?

BrowserStack Automate execution requires **system Node.js/npm** to be installed and available, which is different from local execution that uses the bundled Playwright runtime.

## Prerequisites

BrowserStack Automate execution requires:

1. **Node.js and npm installed** on your system
   - Download from: https://nodejs.org/
   - Ensure `npx` is in your system PATH
   - Verify: Run `npx --version` in a terminal

2. **browserstack-node-sdk package installed**
   - Global installation (recommended): `npm install -g browserstack-node-sdk`
   - Local installation: `cd <workspace-path>` then `npm install browserstack-node-sdk`

3. **BrowserStack credentials configured**
   - Go to Settings → BrowserStack
   - Enter your BrowserStack username and access key
   - Test the connection

4. **BrowserStack Local Testing** (if using local storage state)
   - Required when `BROWSERSTACK_LOCAL: 'true'` is set
   - Download BrowserStack Local binary from: https://www.browserstack.com/docs/local-testing/getting-started
   - Start the Local binary before running tests

## Common Issues & Solutions

### Issue 1: "npx not found" or "ENOENT" error

**Cause:** Node.js/npm is not installed or not in PATH.

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart your terminal/command prompt
3. Verify: `npx --version` should work
4. Restart QA Studio after installing Node.js

### Issue 2: "browserstack-node-sdk not found"

**Cause:** The `browserstack-node-sdk` package is not installed.

**Solution:**
```bash
# Global installation (recommended)
npm install -g browserstack-node-sdk

# OR local installation in workspace
cd <your-workspace-path>
npm install browserstack-node-sdk
```

### Issue 3: "BrowserStack Local Testing" errors

**Cause:** BrowserStack Local binary is not running when `BROWSERSTACK_LOCAL: 'true'` is set.

**Solution:**
1. Download BrowserStack Local from: https://www.browserstack.com/docs/local-testing/getting-started
2. Start the Local binary before running tests
3. OR disable Local Testing in the config (set `BROWSERSTACK_LOCAL: 'false'`)

### Issue 4: Network/firewall blocking BrowserStack

**Cause:** Corporate firewall or network restrictions blocking BrowserStack connections.

**Solution:**
1. Check if `cdp.browserstack.com` and `api.browserstack.com` are accessible
2. Configure proxy settings if needed
3. Contact your IT administrator for firewall exceptions

### Issue 5: Invalid credentials

**Cause:** BrowserStack username or access key is incorrect.

**Solution:**
1. Go to Settings → BrowserStack
2. Verify your credentials at: https://www.browserstack.com/accounts/settings
3. Test the connection in Settings

## How to Verify Setup

1. **Check Diagnostics:**
   - Go to Diagnostics screen
   - Run "BrowserStack Automate" check
   - It will verify credentials, npx, and browserstack-node-sdk

2. **Manual Verification:**
   ```bash
   # Check npx
   npx --version
   
   # Check browserstack-node-sdk
   npx browserstack-node-sdk --version
   
   # Test BrowserStack connection
   npx browserstack-node-sdk playwright test --help
   ```

## Why This Limitation Exists

QA Studio uses a **bundled Playwright runtime** for local execution, which allows the app to work without requiring Node.js to be installed. However, BrowserStack's `browserstack-node-sdk` wrapper requires:

- System `npx` to be available
- The SDK package to be installed via npm
- Network access to BrowserStack's CDP endpoints

This is a limitation of BrowserStack's architecture, not QA Studio. BrowserStack requires their Node.js SDK to be installed separately.

## Alternative: Use BrowserStack REST API Directly

If you cannot install Node.js/npm, you could:
1. Use BrowserStack's REST API directly (more complex)
2. Use BrowserStack's web-based test execution
3. Stick with local execution only

## Getting Help

If you continue to have issues:
1. Check the Diagnostics screen for detailed error messages
2. Review the test run logs in the Runs screen
3. Check BrowserStack's documentation: https://www.browserstack.com/docs/automate/playwright
