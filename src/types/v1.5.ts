/**
 * Type definitions for D365 QA Studio v1.5 IPC communication
 */

import { RecordedStep } from './index';

// ============================================================================
// Codegen Control
// ============================================================================

export interface CodegenStartRequest {
  envUrl: string;              // D365 URL
  workspacePath: string;       // Root of current workspace
  storageStatePath: string;    // e.g. "<workspace>/storage_state/d365.json"
}

export interface CodegenStartResponse {
  success: boolean;
  pid?: number;                // Child process id
  error?: string;
}

export interface CodegenStopResponse {
  success: boolean;
  error?: string;
  rawCode?: string;            // contents of codegen-output.ts if available
  steps?: RecordedStep[];      // Parsed steps for Step Editor UI
}

export interface CodegenCodeUpdate {
  workspacePath: string;
  content: string;              // full TypeScript codegen output
  timestamp: string;            // ISO timestamp
}

// ============================================================================
// Locator Cleanup
// ============================================================================

export interface LocatorCleanupRequest {
  rawCode: string;
}

export interface LocatorMapping {
  original: string; // original locator snippet
  upgraded: string; // cleaned locator snippet
}

export interface LocatorCleanupResponse {
  success: boolean;
  cleanedCode?: string;
  mapping?: LocatorMapping[];
  error?: string;
}

// ============================================================================
// Parameter Detection
// ============================================================================

export interface ParamDetectRequest {
  cleanedCode: string;
}

export interface ParamCandidate {
  id: string;             // stable identifier
  label: string;          // UI label / field name
  originalValue: string;
  suggestedName: string;  // camelCase variable name
}

export interface ParamDetectResponse {
  success: boolean;
  candidates?: ParamCandidate[];
  error?: string;
}

// ============================================================================
// Spec Writing
// ============================================================================

export interface SelectedParam {
  id: string;
  variableName: string;       // final variable name (camelCase)
}

export interface SpecWriteRequest {
  workspacePath: string;
  testName: string;              // e.g. "SalesOrder"
  module?: string;               // e.g. "Sales", optional
  cleanedCode: string;           // locator-cleaned codegen base
  selectedParams: SelectedParam[];
}

export interface SpecWriteResponse {
  success: boolean;
  specPath?: string;           // "/tests/SalesOrder.spec.ts"
  metaPath?: string;           // "/tests/SalesOrder.meta.json"
  error?: string;
}

// ============================================================================
// Data Writing
// ============================================================================

export interface DataRow {
  id: string;                  // dataset id
  enabled: boolean;
  name: string;                // display name in UI
  [key: string]: any;          // parameter values
}

export interface DataWriteRequest {
  workspacePath: string;
  testName: string;
  rows: DataRow[];
}

export interface DataWriteResponse {
  success: boolean;
  dataPath?: string;           // "/data/SalesOrder.json"
  error?: string;
}

// ============================================================================
// Test Library & Metadata
// ============================================================================

export interface TestListRequest {
  workspacePath: string;
}

export type TestStatus = 'never_run' | 'passed' | 'failed' | 'running';

export interface TestSummary {
  testName: string;
  module?: string;
  specPath: string;
  dataPath?: string;
  metaPath?: string;
  datasetCount: number;
  lastRunAt?: string;     // ISO timestamp
  lastStatus: TestStatus;
  tags?: string[];
}

export interface TestListResponse {
  success: boolean;
  tests?: TestSummary[];
  error?: string;
}

// ============================================================================
// Test Run Metadata
// ============================================================================

export interface TestRunMeta {
  runId: string;
  testName: string;
  specRelPath: string;        // e.g. "tests/CreateSalesOrder.spec.ts"
  status: 'passed' | 'failed' | 'skipped' | 'running';
  startedAt: string;          // ISO timestamp
  finishedAt?: string;        // ISO timestamp
  tracePaths?: string[];      // workspace-relative paths to .zip files
  reportPath?: string;        // workspace-relative path to HTML report (deprecated, use allureReportPath)
  allureReportPath?: string;  // workspace-relative path to Allure report (e.g. "allure-report/<runId>/index.html")
  source?: 'local' | 'browserstack';  // v1.6: where the run executed
  browserstack?: {            // v2.0: BrowserStack Automate metadata
    sessionId?: string;
    buildId?: string;
    dashboardUrl?: string;
  };
  assertionFailures?: Array<{  // v2.0: Assertion failure details
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
    line?: number;
  }>;
}

export interface RunIndex {
  runs: TestRunMeta[];
}

// ============================================================================
// Test Execution & Streaming
// ============================================================================

export interface TestRunRequest {
  workspacePath: string;
  specPath: string;
  datasetFilterIds?: string[];     // subset of DataRow ids to run; if empty, run all enabled
  runMode?: 'local' | 'browserstack';  // v1.6: execution mode
  target?: string;                     // v1.6: BrowserStack target (e.g., "Chrome", "Edge", "Pixel")
}

export type TestRunEventType = 'log' | 'error' | 'status' | 'finished';

export interface TestRunEvent {
  type: TestRunEventType;
  runId: string;                // generated UUID per run
  message?: string;
  status?: 'started' | 'running' | 'passed' | 'failed';
  exitCode?: number;
  timestamp: string;            // ISO
}

// ============================================================================
// Trace & Report Hosting
// ============================================================================

export interface TraceOpenRequest {
  workspacePath: string;
  traceZipPath: string;         // path to trace.zip
}

export interface TraceOpenResponse {
  success: boolean;
  url?: string;                 // e.g. "http://localhost:9333"
  error?: string;
}

export interface ReportOpenRequest {
  workspacePath: string;
  reportPath?: string;        // workspace-relative path to report (deprecated, use runId)
  runId?: string;             // use runId to find Allure report from TestRunMeta
}

export interface ReportOpenResponse {
  success: boolean;
  url?: string;                 // e.g. "http://localhost:9334"
  error?: string;
}

// ============================================================================
// v2.0: Jira Defect Creation from Run Context
// ============================================================================

export interface JiraDefectContext {
  workspacePath: string;
  workspaceId?: string;
  testName: string;
  module?: string;
  status: 'failed';
  firstFailureMessage?: string;
  browserStackSessionUrl?: string;
  browserStackTmTestCaseUrl?: string;
  browserStackTmRunUrl?: string;
  screenshotPath?: string;
  tracePath?: string;
  playwrightReportPath?: string;
}

// ============================================================================
// Workspace Metadata
// ============================================================================

export type WorkspaceType = "d365" | "salesforce" | "generic" | "web-demo";

export const CURRENT_WORKSPACE_VERSION = "1.5.0";

export interface WorkspaceMeta {
  id: string;                // stable ID, e.g. "d365-o2c-01"
  name: string;              // human-friendly name, e.g. "D365 – O2C Smoke Suite"
  type: WorkspaceType;       // "d365" now; later "salesforce", etc.
  version: string;           // workspace schema version, e.g. "1.5.0"
  createdWith: string;       // QA Studio app version that created it
  lastOpenedWith: string;    // last QA Studio version that opened it
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
  workspacePath: string;     // absolute path on disk (not stored in JSON, added when loading)
  settings?: Record<string, unknown>; // platform-specific settings (base URL, env, etc.)
}

// ============================================================================
// Workspace Management IPC
// ============================================================================

export interface WorkspaceListResponse {
  success: boolean;
  workspaces?: WorkspaceMeta[];
  error?: string;
}

export interface WorkspaceCreateRequest {
  name: string;
  type?: WorkspaceType;
}

export interface WorkspaceCreateResponse {
  success: boolean;
  workspace?: WorkspaceMeta;
  error?: string;
}

export interface WorkspaceGetCurrentResponse {
  success: boolean;
  workspace?: WorkspaceMeta | null;
  error?: string;
}

export interface WorkspaceSetCurrentRequest {
  workspaceId: string;
}

export interface WorkspaceSetCurrentResponse {
  success: boolean;
  workspace?: WorkspaceMeta;
  error?: string;
}

// ============================================================================
// Workspace Metadata
// ============================================================================

export interface WorkspaceConfig {
  name: string;
  createdAt: string;      // ISO
  lastOpenedAt?: string;
  d365Url?: string;
  environments?: string[]; // v2; current env might just be default
}

// ============================================================================
// Test Metadata (v2.0 – extended for BrowserStack TM + Jira)
// ============================================================================

export interface BrowserStackMeta {
  tmProjectId?: string;     // e.g. "PR-26"
  tmTestCaseId?: string;    // e.g. "TC-123"
  tmTestCaseUrl?: string;   // Deep link to BS TM test case
}

export interface JiraMeta {
  issueKey?: string;        // e.g. "QST-42"
  issueUrl?: string;        // Deep link to Jira issue
}

export interface TestMeta {
  /**
   * Stable internal identifier for this test.
   * Recommended format: "<workspaceId>/<slug>" where slug is derived from testName.
   */
  id?: string;

  // Human-facing identity
  testName: string;       // e.g. "SalesOrder"
  module?: string;        // "Sales", "WMS", etc.
  tags?: string[];        // e.g. ["smoke", "o2c"]

  // Workspace context
  workspaceId?: string;

  // Timestamps / status
  createdAt: string;
  updatedAt?: string;
  lastRunAt?: string;
  lastStatus?: 'never_run' | 'passed' | 'failed';

  // Integrations
  browserstack?: BrowserStackMeta;
  jira?: JiraMeta;
}

// ============================================================================
// v1.6: Test Details & Locators
// ============================================================================

export interface TestGetSpecRequest {
  workspacePath: string;
  testName: string;
}

export interface TestGetSpecResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface LocatorInfo {
  name?: string;              // optional locator name
  selector: string;          // the actual selector/API call
  type: 'role' | 'label' | 'text' | 'css' | 'xpath' | 'd365-controlname' | 'placeholder' | 'testid';
  lines: number[];          // line numbers where used
}

export interface TestParseLocatorsRequest {
  workspacePath: string;
  testName: string;
}

export interface TestParseLocatorsResponse {
  success: boolean;
  locators?: LocatorInfo[];
  error?: string;
}

export interface TestExportBundleRequest {
  workspacePath: string;
  testName: string;
}

export interface TestExportBundleResponse {
  success: boolean;
  bundlePath?: string;       // path to exported zip/JSON
  error?: string;
}

export interface DataReadRequest {
  workspacePath: string;
  testName: string;
}

export interface DataReadResponse {
  success: boolean;
  rows?: DataRow[];
  error?: string;
}

export interface DataImportExcelRequest {
  workspacePath: string;
  testName: string;
}

export interface DataImportExcelResponse {
  success: boolean;
  error?: string;
}

export type LocatorStatusState = 'healthy' | 'warning' | 'failing';

export interface LocatorStatusRecord {
  state: LocatorStatusState;
  note?: string;
  updatedAt: string;
  lastTest?: string;
}

export interface LocatorIndexEntry {
  locator: string;           // locator snippet
  type: 'role' | 'label' | 'text' | 'css' | 'xpath' | 'd365-controlname' | 'placeholder' | 'testid';
  testCount: number;         // number of tests using this locator
  usedInTests: string[];     // test names
  status?: LocatorStatusRecord;
}

export interface WorkspaceLocatorsListRequest {
  workspacePath: string;
}

export interface WorkspaceLocatorsListResponse {
  success: boolean;
  locators?: LocatorIndexEntry[];
  error?: string;
}

export interface LocatorUpdateRequest {
  workspacePath: string;
  originalLocator: string;
  updatedLocator: string;
  type: LocatorIndexEntry['type'];
  tests: string[];
}

export interface LocatorUpdateResponse {
  success: boolean;
  updatedTests?: string[];
  error?: string;
}

export interface LocatorStatusUpdateRequest {
  workspacePath: string;
  locatorKey: string; // `${type}:${locatorSnippet}`
  status: LocatorStatusState;
  note?: string;
  testName?: string;
}

export interface LocatorStatusUpdateResponse {
  success: boolean;
  status?: LocatorStatusRecord;
  error?: string;
}

// ============================================================================
// v1.6: BrowserStack Settings
// ============================================================================

export interface BrowserStackSettings {
  username: string;
  accessKey: string;
  project?: string;
  buildPrefix?: string;
}

export interface SettingsGetBrowserStackRequest {
  workspacePath: string;
}

export interface SettingsGetBrowserStackResponse {
  success: boolean;
  settings?: BrowserStackSettings;
  error?: string;
}

export interface SettingsUpdateBrowserStackRequest {
  workspacePath: string;
  settings: BrowserStackSettings;
}

export interface SettingsUpdateBrowserStackResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// Recording Engine Settings
// ============================================================================

export type RecordingEngine = 'qaStudio' | 'playwright';

export interface SettingsGetRecordingEngineRequest {
  workspacePath: string;
}

export interface SettingsGetRecordingEngineResponse {
  success: boolean;
  recordingEngine?: RecordingEngine;
  error?: string;
}

export interface SettingsUpdateRecordingEngineRequest {
  workspacePath: string;
  recordingEngine: RecordingEngine;
}

export interface SettingsUpdateRecordingEngineResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// Recorder Control (QA Studio Recorder)
// ============================================================================

export interface RecorderStartRequest {
  envUrl: string;              // D365 URL
  workspacePath: string;       // Root of current workspace
  storageStatePath: string;    // e.g. "<workspace>/storage_state/d365.json"
}

export interface RecorderStartResponse {
  success: boolean;
  error?: string;
}

export interface RecorderStopResponse {
  success: boolean;
  error?: string;
  rawCode?: string;            // Playwright code generated from recorded steps
  steps?: RecordedStep[];      // Cleaned, filtered list of steps for Step Editor UI
}

export interface RecorderCodeUpdate {
  workspacePath: string;
  content: string;              // full TypeScript code output
  timestamp: string;            // ISO timestamp
}

