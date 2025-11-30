🌐 Web Demo Mode (Browser Edition)

Interactive, browser-based version of QA Studio using shared UI + mock backend.

📖 What Is Web Demo Mode?

Web Demo Mode is an interactive, browser-based edition of RecorderApp QA Studio.
It looks exactly like the real desktop app, but runs entirely on the web using:

The same React UI components as the Electron app

A mock backend adapter (instead of Playwright/Electron APIs)

Realistic fake locators, fake steps, fake run logs, fake AI explanations, and fake datasets

This allows anyone to try QA Studio directly on the website — no installation, no Playwright, no D365 environment, no Node.js required.

🔥 Perfect for demos, onboarding, recruiters, and stakeholders.

🎯 Goals
✔ Provide a fully interactive preview of QA Studio

Users get the same UI, dark theme, layout, sidebar, panels, and flows as the actual app.

✔ Let users “play” with the platform

Build tests visually

Inspect locators

Edit steps

View mock run results

See AI explanations

All without installing anything.

✔ Integrate seamlessly into the existing website

The web demo is available at:

/demo


Or:

https://zkyko.github.io/RecorderApp/demo

✔ Clearly separate desktop-only functionality

Execution-heavy features will show a modal prompting users to download the desktop app.

🧩 Architecture

The Web Demo uses the shared UI + adapter architecture:

/packages
  /ui            ← Shared React components (used in Desktop + Web Demo)
  /core          ← Types, models, helper logic
  /adapters
      electron-backend   ← Real Playwright backend for desktop
      web-mock-backend   ← Mock backend for browser demo

/apps
  /desktop        ← Electron app (real backend)
  /web-demo       ← Browser app (mock backend)

What stays the same (shared with Desktop)

Recorder panel UI

Steps editor

Locator Library UI

BrowseLocator UI

Visual Test Builder

Data-driven UI

AI Forensics layout

Code preview

Navigation / Sidebar

What changes (Web Demo only)

Backend replaced by mock data

No real Playwright execution

No BrowserStack integration

No filesystem or workspace access

“Desktop only” modal for restricted actions

🛠 Backend Adapter Interface

All backend-powered features use the same interface:

export interface AutomationBackend {
  listTests(): Promise<TestSummary[]>;
  getTest(id: string): Promise<TestDetail>;
  runTest(id: string): Promise<RunResult>;
  analyzeFailure(id: string): Promise<AIInsight>;
  getLocators(): Promise<LocatorLibrarySnapshot>;
  simulateRecording(): Promise<RecordedSteps>;
  loadDataset(): Promise<DataSetPayload>;
  generateCode(steps: StepDefinition[]): Promise<string>;
}

Desktop App

Uses real implementation (Playwright, filesystem, BrowserStack, JIRA, etc.)

Web Demo

Uses mock implementation via static JSON:

/web-demo/mock-data
  steps.json
  locators.json
  run-log.json
  ai-explanation.json
  dataset.json
  code-snippets.json

🚀 Features Fully Available in Web Demo
🎥 Smart Recorder (Simulated)

Fake UI canvas with inspectable elements

Hover highlights

Locator selection

Platform-aware locator scoring

🧱 Visual Test Builder

Drag-and-drop steps

Choose actions

Edit locators

Real-time code preview

📝 Steps Editor

Add, delete, modify steps

Reorder by drag

Syncs with code panel

🔍 BrowseLocator Tool

Click fake UI → capture mock DOM metadata

Shows unique locator candidates

Displays locator health & quality score

📚 Locator Library

Mock locators

Fake statuses: Healthy / Warning / Failing

View/edit metadata

🧪 Data-Driven Testing (Simulated)

Load mock dataset

Expand rows → mock scenarios

Preview test generation

🤖 AI Forensics (Simulated)

Fake failed test

AI explanation

Suggested fix

📊 Run Logs (Simulated)

Fake execution logs

Fake pass/fail states

Fake durations

Fake BrowserStack job URLs

🔒 Desktop-Only Features (Disabled in Demo)

These features remain visible but show a modal:

Running real Playwright tests

BrowserStack Automate

Opening real Playwright trace viewer

Connecting to JIRA

Using local workspaces

File system operations

Script export / writer

Real Smart Recorder (Electron-level hooking)

A dialog appears:

“This action is available only in the Desktop App.
Download QA Studio to run real tests.”

🌐 Website Integration

The demo is embedded directly into the existing GitHub Pages site:

/docs
  index.md          ← homepage (landing page)
  /demo
    index.html      ← web demo entry point


Or if using Next.js / Vite in /apps/web-demo, build output is placed here:

/RecorderApp/demo/


This lets visitors click:

Try Web Demo → launches the live in-browser version

Download for Windows → installs the full desktop Electron app

📦 Running the Web Demo Locally
cd apps/web-demo
npm install
npm run dev


Build for GitHub Pages:

npm run build
npm run export


Output goes to /docs/demo/ or /dist/demo/ depending on setup.

🧪 Mock Data

Store mock data in:

/web-demo/mock-data
  steps.json
  locators.json
  ui-tree.json
  ai-explanation.json
  dataset.json
  runs.json
  code.json


Update these to customize the demo experience.

🎨 UI Parity With Desktop App

The web demo uses the exact same components as the Electron app:

Same dark theme

Same sidebar

Same dashboard layout

Same tabs (“Recorder”, “Test Library”, “Locators”, etc.)

Same animation + transitions

Same code preview styling

Same icons and colors

This ensures the browser demo feels identical to the real app.

🏁 Status

Web Demo Mode – Ready for Integration

What’s done:

Shared UI package

Mock backend adapter

Demo routes

Feature gating

Mock data seeds

Website integration support

Next steps:

Polish mock Recorder canvas

Add more example flows

Host on GitHub Pages

🧩 Contributing

To extend the demo:

Add new mock UI pages

Add new components in /packages/ui

Update mock backend responses

Keep visual parity with desktop

📣 Credits

Developed by Nischal Bhandari
RecorderApp QA Studio – Automation Platform