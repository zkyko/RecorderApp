# QA Studio v1.7.0

## BrowserStack Integration & Enhanced Recorder Logic

Major update adding full BrowserStack cloud testing integration and improved context-aware recording logic for more reliable test generation.

### What's New

- **BrowserStack Test Management** - Embedded BrowserStack TM interface directly in QA Studio sidebar with persistent login sessions
- **BrowserStack Test Execution** - Full cloud test execution support with automatic config generation, credential management, and environment variable handling
- **Context-Aware Recorder** - Smart navigation step preservation for workspace context (e.g., 'All sales orders' clicks now preserve navigation steps)
- **Toolbar Button Context Tracking** - Recorder now tracks workspace context and warns when toolbar buttons are used without proper navigation
- **DOM-Aware Locator Detection** - Enhanced heuristics using D365-specific attributes (data-dyn-controlname, data-dyn-menutext) for better context-setting click detection
- **Windows Filesystem Lock Fix** - Robust file deletion with fs-extra and automatic retry logic for EBUSY errors on Windows
- **Improved Test Execution Logging** - Better visibility into test runs with streaming output and error handling

### Technical Improvements

- Added `fs-extra` dependency for cross-platform file operations
- Implemented context state machine for recorder logic (None → PendingNav → Ready)
- Enhanced BrowserStack config generation with dynamic browser/OS selection
- Added persistent session partition for BrowserStack TM webview
- Improved error handling and retry logic for Windows filesystem operations

## Downloads

- **Windows x64:** [QA-Studio-Windows-x64-v1.7.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-x64-v1.7.0.zip)
- **Windows ARM64:** [QA-Studio-Windows-ARM64-v1.7.0.zip](https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-ARM64-v1.7.0.zip)
- **Mac ARM64:** (Coming soon - needs to be built on Mac)

## Installation

1. Download the appropriate zip file for your platform
2. Extract the zip file to your desired location
3. Run `QA Studio.exe` (Windows) or `QA Studio.app` (Mac) from the extracted folder

## Full Changelog

See the [Updates page](https://zkyko.github.io/RecorderApp/updates) for the complete changelog.

## Breaking Changes

None - this is a backward-compatible update.

## Migration Notes

- BrowserStack credentials can now be configured in Settings → BrowserStack → Configuration
- BrowserStack Test Management is accessible from the main sidebar under Tools
- No migration required for existing workspaces or tests


