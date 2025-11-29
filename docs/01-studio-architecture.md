## Studio Architecture & Tooling Topology

### System Overview
QA Studio is an Electron desktop application that orchestrates four collaborating branches:
1. **Core Runtime (`src/core/`)** – Playwright-powered recorder, locator extractor, registry, and session utilities that run inside the browser context during capture.
2. **Main Process (`src/main//`)** – Electron orchestration layer that brokers device capabilities (filesystem, config, BrowserStack credentials) and exposes them via IPC services.
3. **Code Generation & Execution (`src/generators/`, `src/main/services/`, `src/main/test-executor.ts`)** – Translates recorded steps into TypeScript POMs/specs and executes them through Playwright.
4. **Studio UI (`src/ui/`)** – Mantine/React front-end that drives recording sessions, artifact review, settings, and run management.

The `dist/` directory contains the compiled equivalents of those branches for packaged releases, while `Recordings/` stores runtime outputs (page registry, tests, data captures).

### Workspace Architecture
QA Studio uses a **workspace-based architecture** that makes it platform-agnostic and easily extensible:

- **Current Support:** Microsoft Dynamics 365 (D365) workspace with optimized locator extraction algorithms
- **Future Support:** Koerber, Salesforce, and other enterprise platforms will be added as separate workspaces
- **Pluggable Design:** Each workspace contains platform-specific locator logic, page classification rules, and navigation heuristics
- **Shared Infrastructure:** The recorder engine, code generation, and execution layers remain the same across all workspaces

To add support for a new platform, developers need to:
1. Create platform-specific locator extraction algorithms
2. Define platform-specific page classification rules
3. Configure workspace settings and metadata
4. Plug the new workspace into the system

The workspace system ensures that QA Studio can adapt to any enterprise application while maintaining a consistent user experience and code generation pipeline.

### Toolchain Interplay
| Stage | Responsible Module | Key Artifacts | Notes |
| --- | --- | --- | --- |
| 1. Session bootstrap | `src/main/index.ts`, `src/main/config-manager.ts` | Environment config, tenant secrets, module selection | Main process validates D365 URLs, loads `.env`, and initializes Playwright contexts. |
| 2. Recorder attach | `src/core/recorder/recorder-engine.ts`, `src/core/recorder/event-listeners.ts` | Live `RecordedStep` stream | Injects DOM listeners + CDP hooks, applies spatial/nav heuristics, and enriches events with page identity. |
| 3. Classification & Registry | `src/core/classification/page-classifier.ts`, `src/core/registry/page-registry.ts` | `PageIdentity`, `Recordings/page-registry.json` | Each navigation updates the registry with MI, captions, module tags, and inferred class names. |
| 4. Locator intelligence | `src/core/locators/locator-extractor.ts`, `src/core/utils/identifiers.ts` | D365-specific selectors, sanitized IDs | Combines attribute probes (`data-dyn-controlname`, roles, spatial hints) to avoid brittle CSS. |
| 5. Code generation | `src/main/services/codegen-parser.ts`, `src/generators/pom-generator.ts`, `src/generators/spec-generator.ts`, `src/generators/code-formatter.ts` | `d365/<module>/*.page.ts`, `Recordings/tests/*.spec.ts` | Parses steps, merges with existing classes via `ts-morph`, and emits formatted Playwright code. |
| 6. Execution & feedback | `src/main/test-executor.ts`, `playwright*.config.ts`, `log/performance-report` | Run logs, screenshots, BrowserStack metadata | Supports local headed/headless runs, BrowserStack orchestration, and performance snapshots. |
| 7. UI orchestration | `src/ui/src/components/*`, `src/ui/src/store` | Settings, timeline, diff viewers | React screens call main-process IPC endpoints to drive recording, review generated files, and trigger runs. |

### Data Flow Snapshot
1. **User hits “Record” in SettingsScreen (`src/ui/src/components/SettingsScreen.tsx`).**
2. UI requests `main/index.ts` to spawn a Playwright session with D365 auth + module context.
3. `RecorderEngine` attaches to the browser page, funneling DOM events -> `RecordedStep`.
4. Each step enriches the `PageRegistryManager`, so subsequent generations know the canonical `pageId`, MI, and caption.
5. When recording stops, the UI asks `codegen-parser.ts` to:
   - Normalize steps (merge adjacent events, drop body-only locators).
   - Feed them into `POMGenerator` and `SpecGenerator`.
   - Format results and write to `Recordings/tests` + `dist/generators`.
6. The UI presents side-by-side diffs so engineers can accept/reject artifacts before committing.
7. Optional: `test-executor.ts` runs the new spec locally or via BrowserStack, streaming logs back into the UI console.

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
- Add a new D365 heuristic → extend `LocatorExtractor` or `PageClassifier`, then update `PageRegistryManager` to store any new metadata.
- Introduce a new artifact (e.g., API contract) → create a generator in `src/generators/` and register it inside `codegen-parser.ts` so the UI can expose it as another export toggle.
- Wire a new execution target → implement a runner in `src/main/test-executor.ts` and surface it as a selectable profile in the Settings screen.

Use this document as the “map of maps.” For contributor-level detail see `02-developer-guide.md`; for step-by-step UX flows see `03-user-guide.md`.

