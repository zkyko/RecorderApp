# Changelog

All notable changes to QA Studio will be documented in this file.

## 2.0.0 – Multi-workspace, BrowserStack & Jira integration

### Added

#### Assertion Engine
- Universal assertion support with `assert` action type
- Support for 8 assertion types: toHaveText, toContainText, toBeVisible, toHaveURL, toHaveTitle, toBeChecked, toHaveValue, toHaveAttribute
- Parameterized expected values using `{{param}}` syntax
- Custom assertion messages for better failure reporting
- Automatic code generation for Playwright `expect()` calls

#### Multi-Workspace Support
- Workspace-based architecture for platform-agnostic testing
- Support for D365 and Web Demo workspaces
- Unified recorder, step editor, and spec generator across workspaces

#### BrowserStack Integrations
- BrowserStack Automate execution backend
- BrowserStack Test Management (TM) service for syncing test cases and runs
- Default project ID 2775792 for QA Studio
- HTTP Basic Auth support with username:password token format

#### Jira Integration
- One-click defect creation from failed test runs
- Connection verification in Settings UI
- Field schema support using JiraRestAPI.json
- Default project QST (QA Studio Test Project)
- Pre-filled defect details including:
  - Test failure summary
  - Reproduction steps
  - Impact description
  - Dynamics environment
  - BrowserStack session links

#### Runtime Improvements
- Enhanced bundled Playwright runtime detection with detailed logging
- Removed hard dependency on cmd.exe
- Fixed ERR_STREAM_WRITE_AFTER_END logger errors with safe write guards

### Changed

- Version bumped to 2.0.0
- All Playwright invocations now use unified `runPlaywright()` helper
- Improved error messages for runtime detection failures

### Technical Details

- **New Services**: `browserstackTmService.ts`, `jiraService.ts`
- **Extended Types**: `RecordedStep` now supports `assert` action with assertion-specific fields
- **Code Generation**: `SpecGenerator` emits Playwright `expect()` calls for assertions
- **Field Mapping**: Jira custom fields (customfield_11160, customfield_11161, customfield_11127) properly formatted based on schema types

---

## 1.7.0

Previous version features and improvements.

