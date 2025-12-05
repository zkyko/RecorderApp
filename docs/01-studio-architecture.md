## Studio Architecture & Tooling Topology

### System Overview
QA Studio is an Electron desktop application that orchestrates four collaborating branches:
1. **Core Runtime (`src/core/`)** – Playwright-powered recorder, locator extractor, registry, and session utilities that run inside the browser context during capture.
2. **Main Process (`src/main//`)** – Electron orchestration layer that brokers device capabilities (filesystem, config, BrowserStack credentials) and exposes them via IPC services.
3. **Code Generation & Execution (`src/generators/`, `src/main/services/`, `src/main/test-executor.ts`)** – Translates recorded steps into TypeScript POMs/specs and executes them through Playwright.
4. **Studio UI (`src/ui/`)** – Mantine/React front-end that drives recording sessions, artifact review, settings, and run management.

The `dist/` directory contains the compiled equivalents of those branches for packaged releases, while `Recordings/` stores runtime outputs (page registry, tests, data captures).

### Workspace Architecture (v2.0)
QA Studio v2.0 uses a **workspace-based architecture** that makes it platform-agnostic and easily extensible:

- **Current Support:** 
  - Microsoft Dynamics 365 (D365) workspace with optimized locator extraction algorithms
  - Web Demo workspace demonstrating multi-workspace architecture
- **Future Support:** Koerber, Salesforce, and other enterprise platforms will be added as separate workspaces
- **Pluggable Design:** Each workspace contains platform-specific locator logic, page classification rules, and navigation heuristics
- **Shared Infrastructure:** The recorder engine, code generation, assertion engine, and execution layers remain the same across all workspaces
- **Workspace Manager:** Central service (`src/main/services/workspace-manager.ts`) handles workspace switching, configuration loading, and path resolution

**Workspace Structure:**
```
workspaces/
├── d365/
│   ├── workspace.json          # Workspace configuration
│   ├── tests/specs/            # Test bundles
│   ├── data/                    # Test data files
│   └── locators/                # Locator status tracking
└── web-demo/
    └── ... (same structure)
```

To add support for a new platform, developers need to:
1. Create workspace directory under `workspaces/`
2. Add `workspace.json` with platform configuration
3. Create platform-specific locator extraction algorithms (if needed)
4. Define platform-specific page classification rules (if needed)
5. Register workspace in workspace manager

The workspace system ensures that QA Studio can adapt to any enterprise application while maintaining a consistent user experience and code generation pipeline.

### Toolchain Interplay
| Stage | Responsible Module | Key Artifacts | Notes |
| --- | --- | --- | --- |
| 1. Session bootstrap | `src/main/index.ts`, `src/main/config-manager.ts` | Environment config, tenant secrets, module selection | Main process validates D365 URLs, loads `.env`, and initializes Playwright contexts. |
| 2. Recorder attach | `src/core/recorder/recorder-engine.ts`, `src/core/recorder/event-listeners.ts` | Live `RecordedStep` stream | Injects DOM listeners + CDP hooks, applies spatial/nav heuristics, and enriches events with page identity. |
| 3. Classification & Registry | `src/core/classification/page-classifier.ts`, `src/core/registry/page-registry.ts` | `PageIdentity`, `Recordings/page-registry.json` | Each navigation updates the registry with MI, captions, module tags, and inferred class names. |
| 4. Locator intelligence | `src/core/locators/locator-extractor.ts`, `src/core/utils/identifiers.ts` | D365-specific selectors, sanitized IDs | Combines attribute probes (`data-dyn-controlname`, roles, spatial hints) to avoid brittle CSS. |
| 5. Code generation | `src/main/services/codegen-service.ts`, `src/generators/spec-generator.ts`, `src/generators/code-formatter.ts` | `<workspace>/tests/specs/*.spec.ts` | Parses steps, processes assertions, and emits formatted Playwright code with expect() calls. |
| 6. Assertion processing | `src/generators/spec-generator.ts` | Assertion metadata in run summaries | Processes AssertStep entries, resolves parameterized values, and generates Playwright expect() calls. |
| 7. Execution & feedback | `src/main/services/test-runner.ts`, `playwright*.config.ts`, `log/performance-report` | Run logs, screenshots, BrowserStack metadata | Supports local and BrowserStack Automate execution, with Test Management sync and performance snapshots. |
| 8. Enterprise integrations | `src/main/services/browserstackTmService.ts`, `src/main/services/jiraService.ts` | BrowserStack TM test cases/runs, Jira defects | Syncs test cases and runs to BrowserStack TM, creates Jira defects from failed tests. |
| 9. Diagnostics & health checks | `src/ElectronTest/`, `src/main/services/` | Environment validation, workspace health, integration connectivity | Built-in diagnostics for runtime, workspace, BrowserStack, Jira, and RAG service verification. |
| 10. Auto-updates | `src/main/services/updaterService.ts` | Update notifications, downloads, installation | Automatic updates via GitHub Releases with download progress and one-click restart. |
| 11. UI orchestration | `src/ui/src/components/*`, `src/ui/src/store` | Settings, timeline, diff viewers, workspace selector, diagnostics | React screens call main-process IPC endpoints to drive recording, review generated files, trigger runs, manage workspaces, and run diagnostics. |

### Data Flow Snapshot
1. **User selects workspace and hits "Record" in SettingsScreen (`src/ui/src/components/SettingsScreen.tsx`).**
2. UI requests `main/index.ts` to spawn a Playwright session with platform auth + workspace context.
3. `RecorderEngine` attaches to the browser page, funneling DOM events -> `RecordedStep`.
4. Each step enriches the `PageRegistryManager`, so subsequent generations know the canonical `pageId`, MI, and caption.
5. User can add assertions via the step editor, creating `AssertStep` entries with parameterized expected values.
6. When recording stops, the UI asks `codegen-service.ts` to:
   - Normalize steps (merge adjacent events, drop body-only locators).
   - Process assertion steps and resolve parameterized values.
   - Feed them into `SpecGenerator` (and `POMGenerator` for D365).
   - Format results and write to `<workspace>/tests/specs/`.
7. The UI presents side-by-side diffs so engineers can accept/reject artifacts before committing.
8. Optional: `test-runner.ts` runs the new spec locally or via BrowserStack Automate, streaming logs back into the UI console.
9. On test completion: `browserstackTmService.ts` syncs test case and run to BrowserStack TM.
10. On test failure: User can create Jira defect via `jiraService.ts` with pre-filled failure context.
11. Diagnostics: User can run health checks via diagnostics screen to verify environment, workspace, and integration connectivity.
12. Auto-updates: `updaterService.ts` checks for updates on startup and provides seamless update experience.

### Branch-Specific Concerns
- **Core branch:** TypeScript targeting browser contexts; prioritize lightweight dependencies and guard against leaking Node APIs.
- **Main branch:** Electron-only, handles filesystem, secrets, and long-running Playwright sessions; keep side effects isolated behind service classes (`codegen-parser`, `config-manager`, `bridge`).
- **Generator branch:** Deterministic output is critical; unit tests should assert AST transformations instead of string compares whenever possible.
- **UI branch:** React + Mantine with Zustand state. Keep IPC calls centralized (e.g., in `src/ui/src/services/bridge.ts`) so we can mock them for story-driven testing.

### How Tools Stay in Sync
- **Shared Types (`src/types/`):** `RecordedStep`, `LocatorDefinition`, and `PageClassification` are versioned here so core, generators, and UI speak the same contract.
- **Registry File (`Recordings/page-registry.json`):** Acts as the link between recorder discoveries and generators; the main process persists it after each session.
- **Build Scripts:** `npm run build:all` compiles main + generators + UI. `npm run dist:win` packages the Electron app with the `dist/` artifacts and `config/default-config.json`.
- **Testing:** `npm run test:ui` launches Playwright’s UI mode for spec debugging; BrowserStack credentials flow through `playwright.browserstack.config.ts`.

### Extension Map
- **Add a new platform workspace:** Create workspace directory, add `workspace.json`, implement platform-specific locators/classification if needed, register in `workspace-manager.ts`.
- **Add a new D365 heuristic:** Extend `LocatorExtractor` or `PageClassifier`, then update `PageRegistryManager` to store any new metadata.
- **Add a new assertion type:** Extend `AssertionKind` type, add UI support in assertion editor, update `SpecGenerator` to emit corresponding Playwright expect() call.
- **Introduce a new artifact:** Create a generator in `src/generators/` and register it inside `codegen-service.ts` so the UI can expose it as another export toggle.
- **Wire a new execution target:** Implement a runner in `src/main/services/test-runner.ts` and surface it as a selectable profile in the Settings screen.
- **Add a new integration:** Create a service in `src/main/services/` (e.g., `newIntegrationService.ts`), add IPC handlers in `bridge.ts`, and create UI components in `src/ui/src/components/`.
- **Add diagnostics check:** Create a check in `src/ElectronTest/checks/` and register it in the diagnostics screen for environment validation.

Use this document as the “map of maps.” For contributor-level detail see `02-developer-guide.md`; for step-by-step UX flows see `03-user-guide.md`.

