import { TestMeta } from './v1.5';

/**
 * BrowserStack Test Management Types
 * Based on BrowserStack TM API v2
 */

/**
 * BrowserStack TM Configuration
 */
export interface BrowserStackTmConfig {
  username: string;
  accessKey: string;
  projectId: string;
  projectName?: string;
  suiteName: string;
  baseUrl?: string; // Default: https://test-management.browserstack.com/api/v2
}

/**
 * Test Case as returned by BrowserStack TM API
 */
export interface TestCase {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  preconditions?: string;
  status?: string;
  priority?: string;
  caseType?: string;
  owner?: string;
  tags?: string[];
  automationStatus?: string;
  template?: string;
  steps?: Array<{ step: string; result: string }>;
  issues?: string[];
  customFields?: Array<{ name: string; value: string }>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  url: string;
}

/**
 * Test Run as returned by BrowserStack TM API
 */
export interface TestRun {
  id: string;
  identifier: string;
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshots?: string[];
  videoUrl?: string;
  sessionId?: string;
  buildId?: string;
  notes?: string;
  createdAt: string;
  url: string;
}

/**
 * Bundle metadata structure
 * Represents a test bundle with its meta.json content
 */
export interface BundleMeta {
  bundleDir: string;
  metaPath: string;
  testName: string;
  meta: TestMeta;
}

/**
 * Payload for creating or updating a test case
 */
export interface CreateOrUpdateTestCasePayload {
  name: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  testCaseId?: string; // If provided, update existing test case
}

/**
 * Payload for publishing a test run
 */
export interface PublishRunPayload {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshots?: string[];
  videoUrl?: string;
  sessionId?: string;
  buildId?: string;
  dashboardUrl?: string;
  runName?: string; // Generated from bundle name + timestamp if not provided
}

/**
 * Options for listing test cases
 */
export interface ListTestCasesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tags?: string[];
}

/**
 * Options for listing test runs
 */
export interface ListTestRunsOptions {
  testCaseId?: string;
  page?: number;
  pageSize?: number;
  status?: 'passed' | 'failed' | 'skipped';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Generic paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  success: boolean;
  projectName?: string;
  error?: string;
}

/**
 * Test case history entry
 */
export interface TestCaseHistoryEntry {
  versionId: string;
  source: string;
  modifiedFields: string[];
  userId: number;
  createdAt: string;
  modified?: Record<string, any>;
}

/**
 * BrowserStack TM API Error Types
 */
export class BrowserStackTmError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: 'auth' | 'client' | 'server' | 'network'
  ) {
    super(message);
    this.name = 'BrowserStackTmError';
  }
}

export class BrowserStackTmAuthError extends BrowserStackTmError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode, 'auth');
    this.name = 'BrowserStackTmAuthError';
  }
}

export class BrowserStackTmClientError extends BrowserStackTmError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode, 'client');
    this.name = 'BrowserStackTmClientError';
  }
}

export class BrowserStackTmServerError extends BrowserStackTmError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode, 'server');
    this.name = 'BrowserStackTmServerError';
  }
}

export class BrowserStackTmNetworkError extends BrowserStackTmError {
  constructor(message: string) {
    super(message, undefined, 'network');
    this.name = 'BrowserStackTmNetworkError';
  }
}


