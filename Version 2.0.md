Overall Goals for v2.0

On top of the existing RecorderApp:

Stabilize the bundled Playwright runtime (no more CLI missing / cmd.exe issues).

Add a universal Assertion Engine wired into flows and SpecGenerator.

Add a Web Demo Workspace alongside D365.

Integrate BrowserStack Automate as a first-class execution backend.

Integrate BrowserStack Test Management (TM) for test cases + runs.

Integrate Jira (using your field schema) for one-click defect creation.

Add Electron auto-update using GitHub Releases.

Update docs / versioning to clearly mark this as v2.0.

M0 – Harden the Base (Runtime + Logging)

Goal: Make the current app rock-solid before adding features.

0.1 Fix bundled Playwright runtime detection

Where: src/main/utils/playwrightRuntime.ts (or equivalent helper), Electron build config.

Tasks:

Verify playwright-runtime/ is included in extraResources and actually appears under process.resourcesPath in the win-unpacked build.

Log the resolved runtimeRoot, nodePath, and browsersPath in packaged build.

Ensure all Playwright invocations (env check, install, codegen, run) go through a single runPlaywright(...) helper that:

Prefers bundled runtime.

Only falls back to system Node/npx if absolutely necessary (and logs it).

0.2 Remove hard dependency on C:\WINDOWS\system32\cmd.exe

Where: Playwright “Install / Repair” code in main process.

Tasks:

Replace direct spawn('C:\\WINDOWS\\system32\\cmd.exe', ...) with:

Bundled runtime call: runPlaywright(['install']).

Optional fallback using spawn('npx', ['playwright', 'install'], { shell: true }), guarded with try/catch.

Update the Environment panel to:

Show “Bundled runtime OK / missing”.

Show clear error messages instead of raw ENOENT.

0.3 Fix ERR_STREAM_WRITE_AFTER_END logger

Where: main-process logging module.

Tasks:

Guard all writes with if (!stream.writableEnded && !stream.destroyed).

Only call .end() when app is actually quitting.

Wrap logger writes in try/catch to avoid uncaught exceptions in main.

M1 – Assertion Engine

Goal: Make assertions a first-class, workspace-agnostic feature.

1.1 Extend Flow model

Where: shared flow types (where steps are defined, e.g. src/core/types/flows.ts).

Tasks:

Add an AssertStep type:

type AssertionKind =
  | 'toHaveText' | 'toContainText' | 'toBeVisible'
  | 'toHaveURL' | 'toHaveTitle'
  | 'toBeChecked' | 'toHaveValue' | 'toHaveAttribute'
  // keep it small to start

interface AssertStep extends BaseStep {
  type: 'assert';
  assertion: AssertionKind;
  targetKind: 'locator' | 'page';
  target: string;      // POM locator name or 'page'
  expected?: string;   // literal or {{param}}
  customMessage?: string;
}


Update Flow schema / validator to allow type: 'assert'.

1.2 Step Editor UI

Where: src/ui/components/StepEditor (or equivalent).

Tasks:

Add an “Add Assertion” button that inserts an AssertStep after the selected step.

Assertion editor:

Dropdown for assertion (only auto-retrying locators + page matchers).

Target picker (existing locator list or a special “Page” option).

Expected value text input (supports {{param}} syntax).

Optional custom message.

1.3 SpecGenerator integration

Where: src/generators/SpecGenerator.ts.

Tasks:

When iterating over steps:

For normal steps → existing behavior.

For AssertStep:

Resolve locator from POM if targetKind === 'locator'.

Emit Playwright expect call:

await expect(page.locator(pom.orderStatus)).toHaveText('Submitted');


If expected is parameterized, use row.<field> from data file.

Inject custom message if present:

await expect(page.locator(...), 'should show submitted status').toHaveText(...);

1.4 Run metadata

Where: test result collector in main process.

Tasks:

When a test fails, parse the Playwright error message and map back to:

step id

assertion type

expected vs actual (if available)

Store in run summary JSON:

assertions: [
  {
    stepId,
    assertion,
    expected,
    actual,
    passed: boolean,
    message
  }
]


This will be used later by BrowserStack TM and Jira.

Goal

Add a second workspace to demonstrate multi-workspace support using the same tech stack as D365:

Steps stored as JSON

Each step has a selector

SpecGenerator emits pure .spec.ts files

Assertions and parameters work

No POM, no page classifier, no page mapping

2.1 Create web-demo workspace

Where: workspaces/web-demo/

Tasks:

Add workspace.json:

{
  "id": "web-demo",
  "label": "Web Demo Store",
  "type": "web",
  "baseUrl": "http://localhost:3000/demo/index.html",
  "runner": {
    "configFile": "playwright.web-demo.config.ts"
  },
  "generation": {
    "mode": "spec"     // <— same as D365
  },
  "integrations": {
    "browserstack": { "project": "Web Demo", "buildPrefix": "WEB-" },
    "jira": { "labels": ["qa-studio", "web"] }
  }
}



Identical model as D365:
You only change selectors, not architecture.

2.2 Workspace Selector

Where: UI Shell / Sidebar Component.

Tasks:

Add a Workspace Switcher (dropdown or sidebar list):

Displays all folders under workspaces/

List:

QA Studio (D365)

Web Demo

When user selects a workspace:

Load flows from /workspaces/<id>/flows/

Load data files from /workspaces/<id>/data/

Runner uses the workspace's:

baseUrl

playwright.<workspace>.config.ts

UI updates to reflect the current workspace name

After switching to “Web Demo”,
recorder, step editor, spec generator, BrowserStack, Jira →
all behave identically to D365.

M3 – BrowserStack Integrations
3.1 Automate execution

Goal: Add BS as an execution backend to TestExecutor.

Where: src/main/TestExecutor.ts + config.

Tasks:

Add execution mode "browserstack" alongside local.

Add BS credentials to settings:

BROWSERSTACK_USERNAME

BROWSERSTACK_ACCESS_KEY

Add playwright.browserstack.[workspace].config.ts templates that:

Use use.connectOptions / use.projects for Automate.

Set build/project based on workspace and timestamp.

In TestExecutor, when mode === 'browserstack':

Spawn Playwright with the BS config using runPlaywright(...).

Collect:

session ID (buildId, sessionId)

Automate dashboard URL

Attach this to run summary.

3.2 Test Management (TM) service

Goal: POST results to TM via REST.

Where: src/main/services/browserstackTmService.ts.

Tasks:

Add TM config in settings:

tmProjectId

tmBaseUrl = https://test-management.browserstack.com/api/v2

Implement:

createOrUpdateTestCase(flowMeta)

publishTestRun(flowMeta, runSummary, automateInfo)

Auth: HTTP basic with username:accessKey, base64 in Authorization: Basic.

Use the project_id and endpoints you already pasted.

M4 – Jira Integration (using your field schema)

Goal: One-click Jira defect creation populated from flows + runs.

4.1 Jira settings + field mapping

Where: src/ui/settings/JiraSettings, src/main/services/jiraService.ts.

Tasks:

Settings to store:

baseUrl (e.g., https://fourhands.atlassian.net)

email

apiToken

projectKey (e.g., QST)

default labels

Jira service:

testConnection() → GET /rest/api/3/project/{projectKey}

getFields() → GET /rest/api/3/field (optional for dynamic mapping)

createIssue(payload) → POST /rest/api/3/issue

Hard-map key custom fields initially based on your JSON:

customfield_11160 → Repro Steps

customfield_11161 → Impact Description

customfield_11127 → Dynamics Environment

etc.

4.2 “Create Defect” UX

Where: Run details UI.

Tasks:

For a failed test, show “Create Jira Defect” button.

Pre-fill modal with:

Summary: [D365] <Flow name> failed at step X – <assertion>.

Description:

Workspace, flow, run id.

Steps leading to failure.

Assertion expected vs actual.

BrowserStack session URL.

Custom fields:

Repro steps → steps text.

Impact → placeholder text editable by user.

Environment → workspace / D365 env.

On submit:

Call jiraService.createIssue.

Save issueKey into run metadata.

Show link in run view.

M5 – Auto-Updates via GitHub Releases

Goal: Ship updates without sending new installers manually.

5.1 electron-builder publish config

Where: electron-builder.yml / package.json build section.

Tasks:

Add publish: { provider: "github" }.

Ensure builds upload:

.exe (and others)

latest.yml, blockmaps.

5.2 Updater service in main

Where: src/main/services/updaterService.ts.

Tasks:

Use electron-updater:

autoUpdater.checkForUpdatesAndNotify().

On events:

Send IPC to renderer:

update-available

download-progress

update-downloaded

error

5.3 Update UI

Where: top-level React shell.

Tasks:

Show toast / dialog:

“Downloading update… XX%”

“Update downloaded – Restart to install?”

Call back via IPC → autoUpdater.quitAndInstall().

M6 – Docs & Versioning

Goal: Make this all understandable for your team + future you.

Tasks:

Update README.md with:

v2.0 features list.

How to configure:

D365 workspace

Web demo workspace

BrowserStack creds

TM project id

Jira project + token

Add CHANGELOG.md entry:

## 2.0.0 – Multi-workspace, BrowserStack & Jira integration