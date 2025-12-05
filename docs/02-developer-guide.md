## Developer Guide

This guide targets engineers extending QA Studio. Pair it with `01-studio-architecture.md` for the system map and `03-user-guide.md` for workflow context.

### Environment & Tooling
- **Node 20+ / npm 10+** (matches `package-lock.json`).
- **Playwright browsers** – install via `npx playwright install`.
- **Electron Builder prerequisites** (on Windows builds: .NET framework + Visual Studio build tools).
- **BrowserStack creds** – stored via `electron-store`; never hard-code secrets.

```bash
cd /Users/zk/Desktop/RecorderApp
npm run install:all        # installs root + src/ui deps
npm run dev                # compile main/generators, build UI, start Electron
npm run dev:ui             # run Vite dev server for the React app only
npm run dev:electron       # hot-reload main process, assumes dist/ui already built
```

### Repository Tour
| Path | Purpose | Notes |
| --- | --- | --- |
| `src/core/` | Browser-side recorder, locator, registry, session helpers | Pure TypeScript targeting Playwright; avoid Node APIs. |
| `src/main/` | Electron main process (IPC bridge, config, test executor) | Services under `services/` encapsulate file/AST work (e.g., `codegen-service.ts`). |
| `src/main/services/` | Backend services (v2.0 additions) | `workspace-manager.ts`, `browserstackTmService.ts`, `jiraService.ts`, `updaterService.ts`, `rag-service.ts` |
| `src/generators/` | Pure functions that emit source files (specs, formatters) | Consumed by main process; unit-testable without Electron. Includes assertion code generation. |
| `src/ui/` | Mantine/React app running in the renderer | Uses Zustand stores, React Router 7, and Vite tooling. Includes workspace selector, assertion editor, and diagnostics screen. |
| `src/ElectronTest/` | Diagnostics and health checks (v2.0) | Environment validation, workspace health, and integration connectivity checks. |
| `workspaces/` | Workspace directories (v2.0) | Each workspace contains tests, data, locators, and workspace.json config. |
| `Recordings/` | User-generated outputs (page registry, specs, test data) | Git-ignored; treat as runtime state. Legacy location, new tests go in workspaces. |
| `dist/` | Build artifacts consumed by Electron | Never edit by hand; produced via `npm run build:all`. |

### Feature Workflow
1. **Define the contract.** Update `src/types/*.ts` first so all branches agree on new fields or enums. For v2.0, assertion types are in flow types.
2. **Implement core behavior.** Add heuristics or session plumbing inside `src/core/*` and cover with targeted unit tests (use Playwright's runner + mocked `Page` where possible).
3. **Expose via main services.** Extend `src/main/services/*` to marshal data between core logic and the UI/CLI. `codegen-service.ts` is the canonical place to orchestrate record→generate steps. For workspace features, use `workspace-manager.ts`.
4. **Surface in the UI.** Add hooks/components under `src/ui/src` and wire them through the existing bridge helpers so renderer code remains Node-free. For assertions, see `AssertionEditorModal.tsx`.
5. **Update docs/tests.** Regenerate relevant docs in `docs/` and add/adjust Playwright specs under workspace test directories or unit tests under `src/**/__tests__`.

### Coding Conventions
- **Type-driven development:** Favor explicit `type`/`interface` definitions; widen only at module boundaries.
- **Platform heuristics:** Keep them in dedicated helpers (e.g., `locator-extractor`, `page-classifier`); document assumptions near the code since they evolve quickly. For workspace-specific logic, organize under workspace directories.
- **No hidden side effects:** Services should be pure where possible. If you must touch the filesystem or process state, do it inside `src/main/services/*` and return structured results to the UI.
- **Formatting:** Rely on `code-formatter.ts` (ts-morph + Prettier) instead of ad-hoc string manipulation when generating code.
- **Workspace awareness:** When adding features, consider whether they should be workspace-agnostic (shared) or workspace-specific (platform-dependent).
- **Assertion support:** When adding new step types, consider whether they should support assertions and integrate with the assertion engine.

### Testing Matrix
| Layer | Tooling | Commands |
| --- | --- | --- |
| Unit (core/generators) | `@playwright/test` with `test.describe.configure({ mode: 'parallel' })` | `npm run test` |
| UI smoke | Playwright component/e2e tests inside `src/ui` | `cd src/ui && npm run test` |
| Manual recorder runs | Electron dev mode | `npm run dev`, start a recording, inspect `Recordings/` |
| Cross-browser / BrowserStack | `playwright.browserstack.config.ts` | `BROWSERSTACK_USERNAME=... BROWSERSTACK_ACCESS_KEY=... npm run test:ui` |

### Debugging Tips
- **Recorder instrumentation:** `RecorderEngine` logs `[Recorder]` and `[Recorder Safety Net]` messages to the main-process console; tail the terminal running `npm run dev`.
- **Page registry drift:** delete `Recordings/page-registry.json` if class names clash; it will rebuild on the next recording.
- **Codegen diffs:** `codegen-service.ts` writes formatted files + metadata. Use workspace test directories and the UI diff viewer to verify AST merges.
- **Playwright timeouts:** `src/main/services/test-runner.ts` centralizes retry/timeouts; adjust there instead of per-spec to keep behavior consistent.
- **Workspace switching:** Check `workspace-manager.ts` logs to see workspace loading and path resolution. Workspace config is in `workspaces/<id>/workspace.json`.
- **Assertion generation:** Verify assertion code generation in `spec-generator.ts`. Check that parameterized values are resolved correctly from test data.
- **BrowserStack/Jira:** Test connections via Settings UI or diagnostics screen. Check service logs in main process console for API call details.
- **Diagnostics:** Use the diagnostics screen (`src/ElectronTest/`) to verify environment health. Each check is in `src/ElectronTest/checks/` and can be run independently.
- **Auto-updates:** Test update flow using `updaterService.ts`. Ensure `package.json` has correct `publish` configuration for GitHub Releases.

### Release & Distribution
1. `npm run build:all`
2. On Windows CI: `npm run dist:win` or `npm run dist:win:portable`
3. Artifacts land in `release/` (configured in `package.json > build.directories.output`)
4. Use `scripts/create-release.ps1` for signed bundles or `scripts/package-portable.ps1` for USB-friendly builds.
5. **Auto-updates (v2.0):** Ensure `package.json` has correct `publish` configuration for GitHub Releases. Updates are handled by `updaterService.ts`.

### Contribution Checklist
- [ ] Update or add docs in `docs/` when behavior changes.
- [ ] Run `npm run test` and (if UI touched) `cd src/ui && npm run test`.
- [ ] Verify Recorder → Generator → Runner flow end-to-end at least once.
- [ ] Capture notable UX changes via screenshots/gifs for release notes.

Need more context? Start with `01-studio-architecture.md` for high-level flow, then pair with `03-user-guide.md` to understand the user-facing expectations your code must satisfy.

