1. High-level design

We’ll add a Self Test / Diagnostics system with three pieces:

ElectronTest/ module

Pure logic: defines checks, runs them, returns results.

Main process service

IPC handler: electronTest:runAll

Calls into ElectronTest, returns list of check results.

Renderer UI (Diagnostics screen)

New tab/page under Settings (or a dedicated “Diagnostics” section).

Shows all checks with ✅ / ❌ / ⏭ (skipped).

“Run All Tests” button, maybe “Run single test” actions.

Goal: it works in dev and in the compiled .exe.

2. Folder structure for ElectronTest/

You said you’ll create ElectronTest/, so let’s structure it like:

ElectronTest/
  index.ts                // orchestrator (run all tests)
  types.ts                // TestResult / TestStatus types
  checks/
    runtimeCheck.ts
    workspaceCheck.ts
    flowLocalRunCheck.ts
    browserstackCheck.ts
    browserstackTmCheck.ts
    jiraCheck.ts
    updaterCheck.ts
    ragCheck.ts           // optional, if AI configured

3. Core types

In ElectronTest/types.ts:

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface ElectronTestResult {
  id: string;                 // "runtime", "jira", etc.
  label: string;              // human readable
  status: TestStatus;
  details?: string;           // small message / error
  durationMs: number;
}

4. Orchestrator

In ElectronTest/index.ts:

Import all checks.

Run them sequentially.

Wrap timing + errors.

Pseudo:

import { ElectronTestResult } from './types';
import { runtimeCheck } from './checks/runtimeCheck';
import { workspaceCheck } from './checks/workspaceCheck';
import { flowLocalRunCheck } from './checks/flowLocalRunCheck';
import { browserstackCheck } from './checks/browserstackCheck';
import { browserstackTmCheck } from './checks/browserstackTmCheck';
import { jiraCheck } from './checks/jiraCheck';
import { updaterCheck } from './checks/updaterCheck';
import { ragCheck } from './checks/ragCheck';

const CHECKS = [
  runtimeCheck,
  workspaceCheck,
  flowLocalRunCheck,
  browserstackCheck,
  browserstackTmCheck,
  jiraCheck,
  updaterCheck,
  ragCheck,
];

export async function runAllElectronTests(): Promise<ElectronTestResult[]> {
  const results: ElectronTestResult[] = [];

  for (const check of CHECKS) {
    const start = Date.now();
    try {
      const result = await check();
      results.push({
        ...result,
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        id: check.id,
        label: check.label,
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err?.message || String(err),
      });
    }
  }

  return results;
}


Each check is just a function returning { id, label, status, details? }.

5. Individual checks (what each one should do)
5.1 runtimeCheck

Goal: bundled Playwright runtime is healthy.

Use whatever you already use for the Environment panel (runtime detection helper).

Assert:

Bundled runtime path exists.

No critical error flags.

Behavior:

On success → PASS

On failure → FAIL with details.

5.2 workspaceCheck

Goal: workspaces are loadable.

Use WorkspaceManager / config loader.

Ensure:

At least D365 workspace loads.

If Web Demo workspace exists, it also loads (optional).

Status:

If no workspaces found → FAIL.

If at least one valid workspace → PASS.

5.3 flowLocalRunCheck

Goal: Flow → Spec → Run (local) works.

Hard-code or configure one small smoke flow id (D365 or Web demo).

Steps:

Load that flow JSON.

Call existing SpecGenerator to emit .spec.ts into the workspace tests folder.

Call TestExecutor in local mode to run it.

If test passes / completes without crash → PASS.

If generator or runner throws → FAIL with message.

5.4 browserstackCheck

Goal: check BS Automate integration.

Read BS username + access key from ConfigManager/env.

If missing:

Return { status: 'SKIP', details: 'BrowserStack not configured' }.

Else:

Run a tiny BS test (or existing simple BS smoke flow).

Assert no crash and some session metadata is returned.

On success → PASS.

On error → FAIL with details.

5.5 browserstackTmCheck

Goal: check Test Management API.

If TM project id or TM is not configured → SKIP.

Else:

Use your browserstackTmService to:

Either do a “ping” call (if there’s a get endpoint).

Or create a minimal test case / run in a dedicated TM project.

On success → PASS.

On error → FAIL.

(You can later clean up / ignore those “smoke” entries in the TM UI.)

5.6 jiraCheck

Goal: Jira connection with QST project works.

Read Jira base URL, email, token, projectKey from config.

If any missing → SKIP (Jira not configured).

Else:

Call jiraService.testConnection() (per our earlier plan).

That should hit GET /rest/api/3/project/{projectKey}.

On 200 OK → PASS.

On error → FAIL with reason.

Optional: in the future add a “Create temporary smoke issue in QST” flag.

5.7 updaterCheck

Goal: updater code path doesn’t blow up.

Initialize your updaterService.

Call a dry-run check:

e.g. updater.checkForUpdates({ dryRun: true }).

If function returns / resolves without throwing → PASS.

If throws → FAIL.

No need to actually download or install anything.

5.8 ragCheck (optional)

Goal: RAG/AI pipeline is wired.

If AI config is missing → SKIP.

Else:

Have RAGService:

Load one known bundle (spec + meta + failure file).

Create a minimal prompt.

Call the LLM provider with a small test query.

If request succeeds (200) → PASS.

On error → FAIL.

6. Main process IPC wiring

In src/main (or wherever you handle IPC):

Import runAllElectronTests from ElectronTest/index.ts.

Register a handler:

ipcMain.handle('electronTest:runAll', async () => {
  return await runAllElectronTests();
});


This is what the renderer UI will call.

7. Renderer UI: Diagnostics / Self Test screen

Somewhere in your React UI (likely under Settings):

Add a “Diagnostics / Self Test” page.

UI behavior:

“Run All Tests” button:

Calls window.api.invoke('electronTest:runAll') (or whatever IPC bridge you use).

Disables button + shows spinner while running.

Renders a table:

Test	Status	Time	Details
Runtime	✅	120ms	
Workspace	✅	30ms	
Sample flow	✅	3.4s	
BrowserStack	⚠️ SKIP	0ms	Not configured
BS TM	✅	500ms	Project OK
Jira	✅	180ms	Project QST reachable
Updater	✅	40ms	
RAG	⚠️ SKIP	0ms	AI not configured

Color rules:

PASS = green.

FAIL = red (and maybe show error in tooltip).

SKIP = grey/yellow with reason.

You can also show an overall summary at the top:

✅ 5 passed · ⚠️ 2 skipped · ❌ 0 failed

8. Cursor instruction you can paste

Here’s a ready-made spec you can drop into Cursor:

Task: Add an in-app “Self Test / Diagnostics” system (ElectronTest).

Create a new ElectronTest/ folder at the repo root with:

ElectronTest/index.ts – orchestrates running a set of backend checks and returns an array of { id, label, status, details?, durationMs }.

ElectronTest/types.ts – defines TestStatus = 'PASS' | 'FAIL' | 'SKIP' and ElectronTestResult.

ElectronTest/checks/*.ts – individual checks:

runtimeCheck.ts

workspaceCheck.ts

flowLocalRunCheck.ts

browserstackCheck.ts

browserstackTmCheck.ts

jiraCheck.ts

updaterCheck.ts

ragCheck.ts (optional)

Each check module should export a function that returns a ElectronTestResult (without durationMs; the orchestrator will add timing) and static properties for id and label, or just encode those inside the result.

runtimeCheck should reuse the same logic used by the Environment/Runtime diagnostics card to verify the bundled Playwright runtime is present and healthy.

workspaceCheck should use the existing workspace manager / config loader to ensure at least the primary workspace (D365) is loadable, and optionally the web demo workspace if present.

flowLocalRunCheck should:

Load a small, known-good smoke flow from the existing workspace.

Invoke the existing code generation pipeline to generate a spec for that flow.

Invoke the existing test runner in local mode to run that spec.

Return PASS if the run completes successfully; FAIL otherwise.

browserstackCheck should:

Read BrowserStack credentials from the same config/env the app uses.

If missing, return SKIP with a message like “BrowserStack not configured”.

If present, trigger a minimal BrowserStack run (or reuse a simple BS smoke flow) and return PASS/FAIL based on success.

browserstackTmCheck should:

If TM config is missing, return SKIP.

Otherwise, use the existing BrowserStack TM service to perform a minimal API call (e.g., verify the project ID and auth) and return PASS/FAIL.

jiraCheck should:

If Jira baseUrl/email/token/projectKey are missing, return SKIP.

Otherwise, call into jiraService to test connection to the configured project (e.g., GET /rest/api/3/project/{projectKey}) and return PASS/FAIL.

updaterCheck should:

Initialize the existing updater service.

Call a dry-run version of checkForUpdates() (no actual install), and return PASS if no exception is thrown; FAIL otherwise.

ragCheck (optional) should:

If AI config is missing, return SKIP.

Otherwise, use the existing RAG service to perform a minimal AI request using one of the existing test bundles and return PASS/FAIL.

In the Electron main process, register an IPC handler:

ipcMain.handle('electronTest:runAll', async () => runAllElectronTests());

In the renderer UI, add a new “Diagnostics” / “Self Test” screen (e.g., under Settings) that:

Has a “Run All Tests” button which calls window.api.invoke('electronTest:runAll').

Displays results in a table with status icons/colors for PASS/FAIL/SKIP, duration, and any details message.

The self-test feature must work in both dev and packaged builds and must reuse existing services (runtime detection, workspace manager, codegen, test executor, BrowserStack services, Jira service, updater, RAG) instead of duplicating logic.