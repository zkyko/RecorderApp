# QA Studio - D365 Test Automation Platform

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A comprehensive Electron desktop application for Dynamics 365 Finance & Operations test automation. QA Studio combines intelligent recording, code generation, test execution, and AI-powered debugging into a single unified platform.

## 🎯 Overview

QA Studio transforms the D365 test automation workflow by providing:

- **🎬 Intelligent Recording** - Captures user interactions with D365-aware heuristics
- **🤖 AI-Powered Debugging** - RAG-based test failure diagnosis and fix suggestions
- **📦 Test Bundle Architecture** - Self-contained test artifacts with rich metadata
- **🔍 Smart Locator Extraction** - Automatically generates stable, maintainable selectors
- **📄 Code Generation** - Produces production-ready Playwright specs and Page Object Models
- **▶️ Test Execution** - Built-in test runner with BrowserStack Automate integration
- **📊 Analytics & Reporting** - Performance metrics, trace viewing, and run history
- **✅ Assertion Engine** - First-class assertion support with parameterized expected values
- **🌐 Multi-Workspace Support** - D365 and Web Demo workspaces with unified architecture
- **🔗 BrowserStack Test Management** - Sync test cases and runs to BrowserStack TM
- **🎫 Jira Integration** - One-click defect creation with pre-filled test failure details

## ✨ Key Features

### Recording & Code Generation

- **Interactive Recording** - Records clicks, form inputs, navigation, and user interactions in real-time
- **D365-Aware Heuristics** - Spatial safety nets, navigation pane rules, and page classification
- **Smart Locator Extraction** - Combines `data-dyn-controlname`, roles, and spatial hints for stable selectors
- **Page Object Model Generation** - Generates TypeScript POM classes with proper structure
- **Test Specification Generation** - Creates data-driven Playwright test files ready for execution
- **Parameter Detection** - Automatically identifies and parameterizes test data

### Assertion Engine (v2.0)

- **Universal Assertions** - Add assertions to any step with support for locator and page-level checks
- **Assertion Types** - toHaveText, toContainText, toBeVisible, toHaveURL, toHaveTitle, toBeChecked, toHaveValue, toHaveAttribute
- **Parameterized Expected Values** - Use `{{param}}` syntax to drive assertions from test data
- **Custom Messages** - Add descriptive messages to assertions for better failure reporting

### AI-Powered Debugging (v1.5)

- **RAG-Based Diagnosis** - Retrieval-Augmented Generation system for intelligent test failure analysis
- **Test Bundle Architecture** - Each test contains executable code, metadata, and AI-readable context
- **Forensics Engine** - Custom Playwright reporter captures detailed failure information
- **Context-Aware Suggestions** - AI provides fix suggestions based on test code, locators, and failure logs
- **Multi-Provider Support** - Configure OpenAI, DeepSeek, or custom LLM endpoints
- **Chat Interface** - Interactive debugging assistant with modern messaging UI

### Test Execution & Management

- **Local Test Runner** - Execute tests directly from the application
- **BrowserStack Automate** - Run tests on cloud browsers with parallel execution (v2.0)
- **BrowserStack Test Management** - Sync test cases and runs to BrowserStack TM project (v2.0)
- **Test Library** - Centralized view of all tests with status tracking
- **Run History** - Detailed execution logs, traces, and performance metrics
- **Data-Driven Testing** - Manage test data sets with Excel import/export
- **Locator Maintenance** - Update and validate locators across multiple tests

### Integrations (v2.0)

- **Jira Defect Creation** - One-click defect creation from failed test runs
- **Connection Verification** - Test Jira and BrowserStack connections in Settings
- **Field Schema Support** - Uses JiraRestAPI.json for proper field formatting
- **Project QST** - Default Jira project for QA Studio test defects

### Developer Experience

- **Step Editor** - Review and refine recorded steps before code generation
- **Smart Cleanup** - Automatically detects and removes redundant navigation steps
- **Step Injection** - Manually add waits, custom actions, and comments
- **Regenerate Specs** - Re-run code generation with latest improvements
- **Live Code Preview** - See generated code in real-time during recording

## 🏗️ Architecture

QA Studio is built on a modular architecture with four collaborating branches:

### 1. Core Runtime (`src/core/`)

Playwright-powered components that run inside the browser context during recording:

- **Recorder Engine** - Captures user interactions with DOM listeners and CDP hooks
- **Locator Extractor** - D365-specific selector extraction with multiple strategies
- **Page Classifier** - Identifies pages using MI (Menu Item), captions, and module tags
- **Page Registry** - Central knowledge base mapping page identities to metadata
- **Session Manager** - Handles recording session lifecycle and state

### 2. Main Process (`src/main/`)

Electron orchestration layer that manages system resources and IPC:

- **Bridge** - IPC handlers connecting UI to backend services
- **Config Manager** - Persistent configuration using `electron-store`
- **Test Runner** - Executes Playwright tests with streaming output (local and BrowserStack)
- **Workspace Manager** - Manages multi-workspace architecture and switching
- **RAG Service** - AI-powered debugging service with LLM integration
- **BrowserStack TM Service** - Syncs test cases and runs to BrowserStack Test Management
- **Jira Service** - Creates defects from failed test runs with pre-filled context
- **Updater Service** - Handles automatic updates via GitHub Releases
- **Spec Writer** - Generates test bundles with metadata and context files
- **Path Resolver** - Handles file paths for both development and production

### 3. Code Generation (`src/generators/`)

Pure functions that translate recorded steps into executable code:

- **Spec Generator** - Creates Playwright test specifications with assertion support
- **POM Generator** - Generates Page Object Model classes (D365 workspace)
- **Code Formatter** - Ensures consistent code style and structure
- **Assertion Code Generation** - Emits Playwright `expect()` calls for assertion steps

### 4. Studio UI (`src/ui/`)

Mantine/React frontend providing the user interface:

- **Recording Interface** - Live recording with step timeline
- **Workspace Selector** - Switch between D365, Web Demo, and other workspaces
- **Step Editor** - Review and refine steps with assertion editor integration
- **Test Library** - Browse and manage test collection
- **Test Details** - View specs, data, locators, and run history
- **Settings** - Configure environments, integrations (BrowserStack, Jira), and AI providers
- **Debug Chat** - AI-powered debugging assistant interface
- **Jira Integration UI** - One-click defect creation from failed test runs

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm 10+
- **Windows 10/11** (for building Windows executables)
- **Playwright browsers** (installed automatically)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zkyko/RecorderApp.git
   cd RecorderApp
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Build the application:**
   ```bash
   npm run build:app
   ```

4. **Run in development:**
   ```bash
   npm run dev
   ```

### First Run Setup

1. Launch the application
2. **Select or Create Workspace** - Choose D365 or Web Demo workspace, or create a new one
3. Open **Settings** and configure:
   - **Platform URL** - Your target environment URL (D365 tenant or web app)
   - **Authentication** - Sign in to your platform (authentication state is saved)
   - **Default Module** - Choose your primary module (e.g., `Sales`, `Warehouse`) for D365
   - **BrowserStack** (Optional) - Configure credentials for cloud test execution
   - **Jira** (Optional) - Configure for defect creation from failed tests
   - **AI Provider** (Optional) - Configure LLM for debugging features
4. Start recording your first test flow

## 📖 Usage Guide

### Recording a Test Flow

1. Click **Start Recording** from the main screen
2. Enter flow name and module (e.g., `Create Sales Order`, `Sales`)
3. Interact with D365 in the embedded browser
4. The recorder automatically captures:
   - Clicks, form fills, selections
   - Navigation events
   - Page transitions
5. Click **Stop Recording** when done
6. Review and refine steps in the **Step Editor**
7. Generate code and save the test

### Managing Tests

- **Test Library** - View all tests with status badges (Never Run, Passed, Failed)
- **Test Details** - Inspect spec code, edit test data, manage locators
- **Add Assertions** - Use the assertion editor to add validation steps with parameterized expected values
- **Run Tests** - Execute locally or on BrowserStack Automate
- **View Results** - Check run history, traces, and performance metrics
- **Create Jira Defects** - One-click defect creation from failed test runs (v2.0)

### AI-Powered Debugging

When a test fails:

1. Navigate to **Test Details** for the failed test
2. Click **✨ Diagnose with AI** button
3. The AI assistant provides:
   - Failure analysis based on error logs
   - Context-aware fix suggestions
   - Code snippets for common issues
4. Chat with the assistant to explore solutions

### Configuring AI Provider

1. Open **Settings** → **AI Debugging** tab
2. Select provider: **OpenAI**, **DeepSeek**, or **Custom**
3. Enter API key and model name
4. (Optional) Set custom base URL for local LLMs
5. Save configuration

## 🛠️ Development

### Development Modes

**Option 1: Full Development (Recommended)**
```bash
# Terminal 1: Build and run Electron
npm run dev

# Terminal 2: UI Dev Server (optional, for hot reload)
npm run dev:ui
```

**Option 2: Separate Processes**
```bash
# Build everything first
npm run build:app

# Run Electron only
npm run dev:electron

# Run UI dev server separately
npm run dev:ui
```

### Project Structure

```
RecorderApp/
├── src/
│   ├── core/              # Browser-side recorder, locators, registry
│   │   ├── recorder/      # Recording engine and event listeners
│   │   ├── locators/      # Locator extraction strategies
│   │   ├── classification/# Page classification logic
│   │   └── registry/      # Page registry management
│   ├── main/              # Electron main process
│   │   ├── services/      # Backend services (test runner, RAG, etc.)
│   │   ├── utils/         # Utilities (path resolver, etc.)
│   │   ├── bridge.ts      # IPC handlers
│   │   └── index.ts       # Main entry point
│   ├── generators/        # Code generation (specs, POMs)
│   ├── types/             # TypeScript type definitions
│   └── ui/                # React frontend
│       └── src/
│           ├── components/# UI components
│           ├── store/      # Zustand state management
│           └── App.tsx     # Main app component
├── docs/                  # Documentation
│   ├── specs/             # Technical specifications
│   └── *.md               # User and developer guides
├── dist/                  # Compiled output
├── Recordings/            # User-generated test files (git-ignored)
└── package.json
```

### Key Scripts

```bash
# Build
npm run build              # Compile TypeScript
npm run build:ui           # Build React UI
npm run build:app          # Build everything

# Development
npm run dev               # Full dev mode (build + run)
npm run dev:electron      # Run Electron only
npm run dev:ui            # Run UI dev server
npm run dev:watch         # Watch TypeScript files

# Production
npm run build:win         # Build Windows installer (x64)
npm run dist:win          # Create Windows distribution
```

## 📦 Building for Production

### Windows Build

1. **Build the application:**
   ```bash
   npm run build:app
   ```

2. **Create Windows installer:**
   ```bash
   npm run build:win
   ```

   This will:
   - Compile all TypeScript
   - Build the React UI
   - Copy ErrorGrabber reporter to `runtime/`
   - Create NSIS installer in `release/` directory

3. **Output:**
   - Installer: `release/QA Studio Setup 1.5.0.exe`
   - Portable: Use `npm run dist:win:portable` for portable ZIP

### Build Configuration

The Windows build is configured in `package.json`:

- **Target:** NSIS installer (allows custom installation directory)
- **Architecture:** x64 (Intel/AMD Windows PCs)
- **Extra Resources:** `runtime/` folder (contains ErrorGrabber reporter)
- **Icon:** Uses default Electron icon (custom icon can be added to `build/icon.ico`)

## 🧪 Workspace & Test Bundle Architecture

QA Studio v2.0 uses a **workspace-based architecture** that makes it platform-agnostic:

### Workspace Structure

```
workspaces/
├── d365/                    # D365 workspace
│   ├── workspace.json       # Workspace configuration
│   ├── tests/               # Test bundles
│   │   └── specs/
│   │       └── <TestName>/
│   │           ├── <TestName>.spec.ts
│   │           ├── <TestName>.meta.json
│   │           └── <TestName>.meta.md
│   ├── data/                # Test data files
│   └── locators/            # Locator status tracking
└── web-demo/                # Web Demo workspace
    └── ... (same structure)
```

### Test Bundle Structure

Starting with v1.5, tests are organized into "bundles" containing:

```
<workspace>/tests/specs/<TestName>/
├── <TestName>.spec.ts      # Executable Playwright code
├── <TestName>.meta.json    # Metadata (status, run history, data path)
└── <TestName>.meta.md      # AI-readable context (locators, fixtures, code preview)
```

### Benefits

- **Self-Contained** - All test artifacts in one place
- **AI-Ready** - Rich metadata for intelligent debugging
- **Versioned** - Easy to track test evolution
- **Portable** - Easy to share or archive tests
- **Multi-Platform** - Workspace architecture supports D365, Web Demo, and future platforms

## 🔧 Configuration

### Settings Storage

Settings are stored using `electron-store`:

- **Windows:** `%APPDATA%\qa-studio\config.json`
- **macOS:** `~/Library/Application Support/qa-studio/config.json`
- **Linux:** `~/.config/qa-studio/config.json`

### Configuration Options

- **Workspace Selection** - Choose active workspace (D365, Web Demo, etc.)
- **Platform URL** - Target environment URL (D365 tenant or web app)
- **Authentication State** - Saved browser storage state
- **Recording Engine** - QA Studio Recorder or Playwright Codegen
- **AI Provider** - LLM configuration for debugging
- **BrowserStack Automate** - Cloud testing credentials and project settings
- **BrowserStack Test Management** - TM project ID and sync configuration
- **Jira Integration** - Base URL, credentials, project key, and field mappings
- **Auto-Updates** - GitHub Releases update channel configuration

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Product Vision](docs/00-product-vision.md)** - Project goals and principles
- **[Architecture Guide](docs/01-studio-architecture.md)** - System design and components
- **[Developer Guide](docs/02-developer-guide.md)** - Contributing and extending QA Studio
- **[User Guide](docs/03-user-guide.md)** - End-user workflows and features
- **[RAG Architecture](docs/specs/04-rag-architecture.md)** - AI debugging system specification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style
4. Test thoroughly (dev and production builds)
5. Commit with descriptive messages
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow existing patterns in the codebase

## 🐛 Troubleshooting

### Application Won't Start

- Ensure all dependencies are installed: `npm run install:all`
- Check Node.js version: `node --version` (should be 18+)
- Review console output for errors

### Browser Doesn't Launch

- Verify D365 URL is correct in Settings
- Check Windows Firewall settings
- Ensure Playwright browsers are installed: `npx playwright install`

### Tests Not Executing

- Verify workspace is selected and active
- Verify test bundle structure exists: `<workspace>/tests/specs/<TestName>/`
- Check that spec file exists: `<TestName>.spec.ts`
- Review test runner logs in the application console
- For BrowserStack: Verify credentials and network connectivity

### AI Debugging Not Working

- Verify AI provider settings in Settings → AI Debugging
- Check API key is valid and has sufficient credits
- Ensure base URL is correct (for custom providers)
- Review RAG service logs for errors

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- **Repository:** [https://github.com/zkyko/RecorderApp](https://github.com/zkyko/RecorderApp)
- **Issues:** [GitHub Issues](https://github.com/zkyko/RecorderApp/issues)

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/) - Desktop application framework
- [Playwright](https://playwright.dev/) - Browser automation
- [React](https://react.dev/) - UI library
- [Mantine](https://mantine.dev/) - UI components
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 🔄 Auto-Updates (v2.0)

QA Studio v2.0 includes automatic update functionality via GitHub Releases:

- **Automatic Check** - App checks for updates on startup
- **Download Progress** - Shows download progress in UI
- **One-Click Install** - Restart to install updates
- **Release Notes** - View what's new in each update

Updates are delivered through GitHub Releases and use electron-updater for seamless installation.

---

**Version:** 2.0.0  
**Last Updated:** December 2025

