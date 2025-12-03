## QA Studio Vision & Narrative

### Why QA Studio Exists
QA Studio is the internal “recorder-to-runner” workbench for Dynamics 365 (D365) test automation. It turns exploratory clicks in the Finance & Operations UI into high-signal Playwright assets—locators, Page Object Models (POMs), and executable specs—so feature teams can keep pace with rapid product changes without drowning in brittle tests.

- **Bridge the gap between SMEs and coders.** Business analysts capture flows in the desktop recorder while automation engineers receive structured, reviewable code.
- **Codify tribal D365 knowledge.** Every recorded session enriches the page registry and locator heuristics, so the next engineer benefits automatically.
- **Keep quality close to shipping.** Tight integration with Playwright and BrowserStack makes it feasible to validate complex D365 scenarios on every branch before release.

### Guiding Principles
1. **“Recorder-first” UX.** Recording must be fast, forgiving, and composable; the code is a by-product, not a burden.
2. **Deterministic automation.** Page classification, locator extraction, and registry lookups collaborate to produce stable selectors even in heavily customized tenants.
3. **Guardrails over guesswork.** Electron main services enforce environment checks, credential handling, and branch-aware config so teams cannot accidentally point at the wrong tenant.
4. **Pluggable evolution.** Each major surface—core recorder, generators, runner, UI—is a versioned module so we can swap heuristics or delivery channels without rewriting the stack.

### Outcomes We Optimize For
- **Authoring speed:** <5 minutes from “start recording” to committed spec for the 80% path.
- **Regression resilience:** Automated locator normalization + registry enrichment eliminate flaky selectors.
- **Cross-team reuse:** Generated POMs share a consistent taxonomy (`d365/<module>/<page>.page.ts`) so scripts compose cleanly across squads.
- **Operational confidence:** Built-in test executor, log streaming, and performance reports tighten the feedback loop from local reproduction to CI runs.

### Product Pillars
| Pillar | Description | Key Modules |
| --- | --- | --- |
| Recorder Intelligence | Captures user intent with platform-aware heuristics (navigation pane rules, spatial safety nets). Works across D365, Web Demo, and future workspaces. | `src/core/recorder`, `src/core/classification`, `src/core/locators` |
| Workspace Architecture | Platform-agnostic architecture enabling multi-workspace support with unified recorder, generators, and execution. | `src/main/services/workspace-manager.ts`, `workspaces/` |
| Knowledge Graph | Central registry that maps identities (module, MI, caption) to reusable page metadata. | `src/core/registry`, `Recordings/page-registry.json` |
| Code Generation | Deterministic Playwright spec generation with assertion support, leveraging `ts-morph` for safe merges. | `src/generators`, `src/main/services/codegen-service.ts` |
| Assertion Engine | First-class assertion support with parameterized expected values, integrated into flow model and code generation. | `src/generators/spec-generator.ts`, `src/ui/src/components/AssertionEditorModal.tsx` |
| Execution & Feedback | Local and BrowserStack Automate execution with Test Management sync, log/perf telemetry, and Jira defect creation. | `src/main/services/test-runner.ts`, `src/main/services/browserstackTmService.ts`, `playwright*.config.ts` |
| Enterprise Integrations | BrowserStack Test Management and Jira integration for centralized tracking and defect management. | `src/main/services/browserstackTmService.ts`, `src/main/services/jiraService.ts` |
| Experience Layer | Mantine/React-based "Studio" UX for workspace switching, settings, session orchestration, and artifact review. | `src/ui/src` |

### Version 2.0 Achievements
1. **Universal Assertion Engine:** First-class assertion support integrated into flows and code generation, enabling data-driven validation with parameterized expected values.
2. **Multi-Workspace Architecture:** Web Demo workspace alongside D365, demonstrating unified architecture with workspace switching and platform-agnostic design.
3. **BrowserStack Integration:** BrowserStack Automate execution backend and Test Management sync for centralized test tracking and reporting.
4. **Jira Integration:** One-click defect creation from failed test runs with pre-filled context, repro steps, and BrowserStack session links.
5. **Stabilized Runtime:** Fixed bundled Playwright runtime detection, removed hard dependency on cmd.exe, and improved error handling.
6. **Auto-Updates:** Automatic updates via GitHub Releases using electron-updater with download progress and one-click installation.

### Near-Term Narrative
1. **Precision Recording:** Continue refining spatial heuristics and MI-based registry updates to reduce manual locator edits by >60%.
2. **Workspace Expansion:** Add Koerber and Salesforce workspaces with platform-specific locator algorithms while maintaining unified infrastructure.
3. **Team-ready workflows:** Expand Settings screen to pull module templates, environment secrets, and execution profiles so squads can standardize their pipelines without editing JSON.
4. **Enhanced Integrations:** Expand BrowserStack TM and Jira integration capabilities with more field mappings and workflow automation.

### North-Star Experience
> “Open Studio, record a scenario, review autogenerated POMs/specs, hit Run, and publish the ready-to-merge branch—all within one desktop session.”

The documentation in this `docs/` directory breaks that vision into actionable guides for architects, engineers, and end-users without repeating the same content. Refer to:
- `01-studio-architecture.md` for the system map and cross-branch data flow.
- `02-developer-guide.md` for contributor practices, build/run recipes, and extension points.
- `03-user-guide.md` for day-to-day workflows inside the Studio UI.

