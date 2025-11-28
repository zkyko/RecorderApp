## User Guide

This document explains how product owners, QA engineers, and analysts use QA Studio day-to-day. For deeper architectural context see `01-studio-architecture.md`; for contributor instructions see `02-developer-guide.md`.

### 1. Getting Ready
- **Install & launch:** Run the packaged Electron app or `npm run dev` during previews.
- **Configure environments:** Open the Settings screen and provide:
  - D365 tenant URL and credentials (stored securely in `electron-store`).
  - Default module (e.g., `Sales`, `Warehouse`) so generated files land under `d365/<module>/`.
  - Execution profile (Local Playwright, BrowserStack, or custom runner).
- **Verify dependencies:** Use the “Diagnostics” card to ensure Playwright browsers, Node, and BrowserStack creds (if selected) are reachable.

### 2. Recording a Flow
1. Click **Start Recording**.
2. Studio launches an embedded Playwright browser window pointing at your configured D365 environment.
3. Interact with the application normally. The recorder:
   - Captures clicks, fills, selects, and navigations.
   - Applies D365-specific heuristics (navigation pane rules, spatial safety net) to produce stable locators.
   - Updates the shared page registry whenever you land on a new page or workspace.
4. Use the mini-toolbar to insert checkpoints (assertions) or notes; they’ll appear as annotated steps in the timeline.
5. Hit **Stop Recording** to close the session and push the captured steps into the code generator pipeline.

### 3. Reviewing Generated Assets
After recording, the Review panel shows three tabs:
- **Steps:** Raw timeline with metadata (pageId, locator strategy, action). You can drop unwanted steps before generation.
- **Page Objects:** Generated files under `d365/<module>/<page>.page.ts`. Compare with existing versions; accept/reject per file.
- **Specs:** Playwright test files written to `Recordings/tests/*.spec.ts`. Edit titles, data inputs, or tags inline.

Tips:
- Hover over a locator badge to see the extraction strategy (role, control name, text, etc.).
- When multiple flows share a page, Studio merges locators and methods instead of duplicating the class.

### 4. Running Tests
1. Choose **Run Locally** for quick validation. Studio calls `src/main/test-executor.ts`, streams console logs, and captures screenshots/videos where configured.
2. Choose **Run on BrowserStack** to validate across browsers. Provide credentials once in Settings; Studio injects them into `playwright.browserstack.config.ts`.
3. Inspect the **Run Output** panel:
   - Status timeline (queued → running → passed/failed)
   - Collapsible log lines with `[Recorder]`, `[Playwright]`, and `[BrowserStack]` tags
   - Link to `playwright-report/index.html` for deep dives

### 5. Iterating & Publishing
- **Edit & regenerate:** If you tweak locators or method names manually, rerun generation to reconcile changes. Studio preserves custom code by parsing with `ts-morph`.
- **Branch awareness:** Studio tags each session with the current Git branch. Keep `main` clean—record on feature branches and commit generated assets there.
- **Export artifacts:** Use “Export Bundle” to zip POMs + specs + registry snapshot for sharing with other squads.

### 6. Troubleshooting
| Symptom | Fix |
| --- | --- |
| No events captured | Ensure the recorder window has focus; if running headless, disable headless mode in Settings for debugging. |
| Wrong module in file path | Update the Module selector before recording; paths are derived from that setting. |
| Locator looks like `body` | Recorder discards non-interactive clicks; re-record with the navigation pane open or use the “Force Capture” hotkey. |
| BrowserStack job stuck | Check network/proxy access first; then review `log/performance-report/modified-key-metrics.json` for hints. |
| Spec fails on login | Verify credentials in Settings → Security, and confirm `config/default-config.json` matches your tenant’s redirects. |

### 7. Best Practices
- Record the “happy path” first, then layer validations/assertions.
- Keep recordings scoped (<30 steps) so generated specs stay readable; chain specs via shared POM methods instead of giant flows.
- Reuse module folders: e.g., `d365/sales/SalesOrderList.page.ts` becomes the canonical class for all sales-order-related specs.
- Commit both generated code and the updated `Recordings/page-registry.json` so teammates inherit the improved page identities.

Once you’re comfortable with these flows, explore `00-product-vision.md` to understand where the product is headed and how your feedback shapes the roadmap.

