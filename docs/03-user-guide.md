## User Guide

This document explains how product owners, QA engineers, and analysts use QA Studio day-to-day. For deeper architectural context see `01-studio-architecture.md`; for contributor instructions see `02-developer-guide.md`.

### 1. Getting Ready
- **Install & launch:** Run the packaged Electron app or `npm run dev` during previews. The app will check for updates automatically (v2.0).
- **Select or Create Workspace:** Choose your target platform workspace from the workspace selector:
  - **D365** - Microsoft Dynamics 365 Finance & Operations (full POM support)
  - **Web Demo** - Demo workspace showcasing multi-workspace architecture
  - **Create New** - Create a custom workspace for your platform
- **Configure environments:** Open the Settings screen and provide:
  - Platform-specific tenant URL and credentials (stored securely in `electron-store`).
  - Default module (e.g., `Sales`, `Warehouse`) for D365 workspace so generated files land under the workspace-specific path.
  - Execution profile (Local Playwright, BrowserStack Automate).
  - **BrowserStack credentials** (optional) - For cloud test execution and Test Management sync.
  - **Jira integration** (optional) - For one-click defect creation from failed tests.
- **Verify dependencies:** Use the **Diagnostics** screen (v2.0) to run comprehensive health checks:
  - **Runtime Check** - Verify Playwright runtime and browser installation
  - **Workspace Check** - Validate workspace configuration and structure
  - **BrowserStack Check** - Test BrowserStack Automate connectivity
  - **BrowserStack TM Check** - Verify Test Management API access
  - **Jira Check** - Test Jira API connectivity and credentials
  - **RAG Check** - Verify AI debugging service configuration
  - **Config Check** - Validate application configuration
  - **Flow Local Run Check** - Test local test execution capability

**Note:** QA Studio v2.0 supports D365 and Web Demo workspaces. Additional workspaces for Koerber, Salesforce, and other platforms will be added in future releases. Each workspace uses platform-specific locator algorithms while sharing the same recording, code generation, assertion engine, and execution infrastructure.

### 2. Recording a Flow
1. Ensure the correct workspace is selected (D365, Web Demo, etc.).
2. Click **Start Recording**.
3. Studio launches an embedded Playwright browser window pointing at your configured platform environment.
4. Interact with the application normally. The recorder:
   - Captures clicks, fills, selects, and navigations.
   - Applies platform-specific heuristics (navigation pane rules, spatial safety net) to produce stable locators.
   - Updates the shared page registry whenever you land on a new page or workspace.
5. **Add Assertions (v2.0):** Use the step editor or mini-toolbar to insert assertions:
   - Select an assertion type (toHaveText, toContainText, toBeVisible, etc.)
   - Choose target (locator or page-level)
   - Enter expected value (use `{{param}}` syntax for parameterized assertions)
   - Add optional custom message for better failure reporting
6. Hit **Stop Recording** to close the session and push the captured steps into the code generator pipeline.

### 3. Reviewing Generated Assets
After recording, the Review panel shows:
- **Steps:** Raw timeline with metadata (pageId, locator strategy, action, assertions). You can drop unwanted steps before generation.
- **Assertions:** Review assertion steps with their expected values and parameterization. Edit assertions directly in the step editor.
- **Specs:** Playwright test files written to `<workspace>/tests/specs/<TestName>/<TestName>.spec.ts`. Edit titles, data inputs, or tags inline.

Tips:
- Hover over a locator badge to see the extraction strategy (role, control name, text, etc.).
- Assertion steps show their expected values and whether they're parameterized.
- When multiple flows share a page, Studio merges locators and methods instead of duplicating the class (D365 workspace).
- For Web Demo and future workspaces, specs are generated without POM classes.

### 4. Running Tests
1. Choose **Run Locally** for quick validation. Studio calls `test-runner.ts`, streams console logs, and captures screenshots/videos where configured.
2. Choose **Run on BrowserStack Automate** (v2.0) to validate across browsers. Studio automatically:
   - Generates `playwright.browserstack.config.ts` with your credentials
   - Runs tests on cloud browsers
   - Captures BrowserStack session IDs and dashboard URLs
   - Syncs test case and run to BrowserStack Test Management (if configured)
3. Inspect the **Run Output** panel:
   - Status timeline (queued → running → passed/failed)
   - Collapsible log lines with `[Recorder]`, `[Playwright]`, and `[BrowserStack]` tags
   - Assertion results showing expected vs actual values
   - Link to `playwright-report/index.html` for deep dives
   - BrowserStack session links (for cloud runs)
4. **Create Jira Defect (v2.0):** If a test fails, click **Create Jira Defect** to:
   - Pre-fill defect summary with test failure details
   - Include reproduction steps from the test flow
   - Add BrowserStack session link (if applicable)
   - Map custom fields using JiraRestAPI.json schema

### 5. Iterating & Publishing
- **Edit & regenerate:** If you tweak locators, assertions, or method names manually, rerun generation to reconcile changes. Studio preserves custom code by parsing with `ts-morph`.
- **Parameterize assertions:** Use `{{param}}` syntax in assertion expected values to drive validation from test data files.
- **Workspace switching:** Switch between workspaces seamlessly. Each workspace maintains its own tests, data, and configuration.
- **Branch awareness:** Studio tags each session with the current Git branch. Keep `main` clean—record on feature branches and commit generated assets there.
- **Export artifacts:** Use "Export Bundle" to zip specs + registry snapshot for sharing with other squads.
- **BrowserStack TM sync:** Test cases and runs are automatically synced to BrowserStack Test Management (if configured) for centralized tracking.

### 6. Diagnostics & Health Checks (v2.0)
QA Studio includes a built-in diagnostics screen to help troubleshoot environment and integration issues:

1. **Access Diagnostics:** Navigate to the Diagnostics screen from the main menu or Settings
2. **Run Health Checks:** Click individual check buttons or "Run All Checks" to verify:
   - **Runtime Check** - Validates Playwright runtime installation and browser availability
   - **Workspace Check** - Verifies workspace structure, configuration, and test bundle integrity
   - **BrowserStack Check** - Tests BrowserStack Automate API connectivity and credentials
   - **BrowserStack TM Check** - Validates Test Management API access and project configuration
   - **Jira Check** - Tests Jira API connectivity, credentials, and project access
   - **RAG Check** - Verifies AI provider configuration and API connectivity
   - **Config Check** - Validates application configuration and settings
   - **Flow Local Run Check** - Tests local test execution capability and Playwright setup
3. **Review Results:** Each check provides detailed status, error messages, and suggestions for fixing issues
4. **Use for Troubleshooting:** Run diagnostics when experiencing integration or execution issues

### 7. Troubleshooting
| Symptom | Fix |
| --- | --- |
| No events captured | Ensure the recorder window has focus; if running headless, disable headless mode in Settings for debugging. |
| Wrong module in file path | Update the Module selector before recording; paths are derived from that setting (D365 workspace). |
| Locator looks like `body` | Recorder discards non-interactive clicks; re-record with the navigation pane open or use the "Force Capture" hotkey. |
| Assertion not generating code | Verify assertion step has valid target (locator name or 'page') and expected value. Check SpecGenerator logs. |
| BrowserStack job stuck | Run BrowserStack check in Diagnostics. Check network/proxy access first; verify credentials in Settings → BrowserStack. Review `log/performance-report/modified-key-metrics.json` for hints. |
| BrowserStack TM sync failing | Run BrowserStack TM check in Diagnostics. Verify TM Project ID in Settings → BrowserStack Test Management. Check credentials and network connectivity. |
| Jira defect creation failing | Run Jira check in Diagnostics. Test connection in Settings → Jira. Verify project key, API token, and custom field mappings in JiraRestAPI.json. |
| Spec fails on login | Verify credentials in Settings → Security, and confirm workspace configuration matches your tenant's redirects. |
| Workspace not loading | Run Workspace check in Diagnostics. Check `workspaces/<id>/workspace.json` exists and is valid JSON. Verify workspace manager logs in main process console. |
| Runtime not detected | Run Runtime check in Diagnostics. Verify bundled runtime exists or system Playwright is installed. Check `playwright-runtime/` directory. |
| Auto-updates not working | Verify `package.json` has correct `publish` configuration. Check GitHub Releases for available updates. Review updater service logs. |

### 8. Auto-Updates (v2.0)
QA Studio v2.0 includes automatic update functionality:

1. **Automatic Checks:** The app checks for updates on startup
2. **Update Notifications:** When an update is available, you'll see a notification with version details
3. **Download Progress:** Updates download in the background with progress indicators
4. **One-Click Install:** Click "Restart to Install" to apply the update
5. **Release Notes:** View what's new in each update before installing
6. **Manual Check:** You can manually check for updates from the Settings screen

Updates are delivered through GitHub Releases and use electron-updater for seamless installation.

### 9. Best Practices
- **Workspace organization:** Use appropriate workspace for your platform. D365 for Finance & Operations, Web Demo for web applications.
- **Recording:** Record the "happy path" first, then layer validations/assertions using the assertion editor.
- **Assertions:** Use parameterized assertions (`{{param}}`) for data-driven validation. Add custom messages for better failure context.
- **Scope:** Keep recordings scoped (<30 steps) so generated specs stay readable; chain specs via shared methods instead of giant flows.
- **Reuse (D365):** Reuse module folders: e.g., `d365/sales/SalesOrderList.page.ts` becomes the canonical class for all sales-order-related specs.
- **Version control:** Commit both generated code and the updated `Recordings/page-registry.json` so teammates inherit the improved page identities.
- **BrowserStack:** Use BrowserStack Automate for cross-browser validation. Enable Test Management sync for centralized tracking.
- **Jira integration:** Create defects immediately after test failures while context is fresh. Review pre-filled details before submitting.

Once you’re comfortable with these flows, explore `00-product-vision.md` to understand where the product is headed and how your feedback shapes the roadmap.

