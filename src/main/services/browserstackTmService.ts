import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { app } from 'electron';
import { ConfigManager } from '../config-manager';
import {
  BrowserStackTmConfig,
  TestCase,
  TestRun,
  BundleMeta,
  CreateOrUpdateTestCasePayload,
  PublishRunPayload,
  ListTestCasesOptions,
  ListTestRunsOptions,
  PaginatedResult,
  TestConnectionResult,
  TestCaseHistoryEntry,
  BrowserStackTmError,
  BrowserStackTmAuthError,
  BrowserStackTmClientError,
  BrowserStackTmServerError,
  BrowserStackTmNetworkError,
} from '../../types/browserstack-tm';
import { TestMeta } from '../../types/v1.5';

/**
 * BrowserStack Test Management Service
 * 
 * Provides a clean service layer for BrowserStack TM integration.
 * Handles test case creation, test run publishing, and bundle integration.
 * 
 * @example
 * ```typescript
 * const service = new BrowserStackTmService(configManager);
 * const testCase = await service.createOrUpdateTestCase({ name: 'My Test' });
 * ```
 */
export class BrowserStackTmService {
  private configManager: ConfigManager;
  private baseUrl = 'https://test-management.browserstack.com/api/v2';
  private defaultConfigPath: string;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    // Path to default config file
    this.defaultConfigPath = path.join(app.getAppPath(), 'config', 'browserstack-tm.defaults.json');
  }

  /**
   * Get BrowserStack TM configuration
   * 
   * Merges configuration from:
   * 1. Default config file (config/browserstack-tm.defaults.json)
   * 2. Settings UI / persisted config (via ConfigManager)
   * 3. Environment variables (final override)
   * 
   * @returns BrowserStack TM configuration with credentials
   */
  getConfig(): BrowserStackTmConfig {
    // Load defaults from config file
    let defaults: Partial<BrowserStackTmConfig> = {};
    try {
      if (fs.existsSync(this.defaultConfigPath)) {
        const configContent = fs.readFileSync(this.defaultConfigPath, 'utf-8');
        defaults = JSON.parse(configContent);
      }
    } catch (error: any) {
      console.warn('[BrowserStackTm] Failed to load default config file:', error.message);
    }

    // Get BrowserStack Automate credentials (primary source - same as Automate)
    const browserStackCreds = this.configManager.getBrowserStackCredentials();
    
    // Get TM-specific settings (only for projectId, suiteName - not credentials)
    const settings = this.configManager.getBrowserStackTmConfig();

    // Check environment variables (final override)
    const envUsername = process.env.BROWSERSTACK_TM_USERNAME;
    const envAccessKey = process.env.BROWSERSTACK_TM_ACCESS_KEY;
    const envProjectId = process.env.BROWSERSTACK_TM_PROJECT_ID;
    const envSuiteName = process.env.BROWSERSTACK_TM_SUITE_NAME;

    // Credentials: Always use BrowserStack Automate credentials (same as Automate)
    // Priority: Environment variables > BrowserStack Automate credentials > defaults
    const username = envUsername || browserStackCreds.username || defaults.username || '';
    const accessKey = envAccessKey || browserStackCreds.accessKey || defaults.accessKey || '';
    
    // TM-specific settings (projectId, suiteName)
    const projectId = envProjectId || settings.projectId || defaults.projectId || 'PR-25';
    const suiteName = envSuiteName || settings.suiteName || defaults.suiteName || 'TestManagement For StudioAPP';
    const baseUrl = defaults.baseUrl || this.baseUrl;

    // Final credentials (always from Automate credentials, not from TM apiToken)
    let finalUsername = username;
    let finalAccessKey = accessKey;
    
    // Note: apiToken in TM settings is deprecated - always use Automate credentials
    // If apiToken exists, log a warning but don't use it (use Automate credentials instead)
    if (settings.apiToken) {
      console.warn('[BrowserStackTm] apiToken in TM settings is deprecated. Using BrowserStack Automate credentials instead.');
    }

    if (!finalUsername || !finalAccessKey) {
      throw new BrowserStackTmError(
        'BrowserStack credentials not configured. BrowserStack Test Management uses the same credentials as BrowserStack Automate. Please set username and access key in Settings → BrowserStack.',
        undefined,
        'client'
      );
    }

    return {
      username: finalUsername,
      accessKey: finalAccessKey,
      projectId,
      projectName: defaults.projectName,
      suiteName,
      baseUrl,
    };
  }

  /**
   * Test connection to BrowserStack TM
   * 
   * Verifies that credentials are valid and the project is accessible.
   * 
   * @returns Connection test result with success status and optional error message
   */
  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { projectId, apiToken } = this.getConfigWithToken();
      // Try to get a single test case to verify connection (lightweight request)
      const url = `${this.baseUrl}/projects/${projectId}/test-cases?minify=true&p=1&page_size=1`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      if (response.success !== false) {
        return {
          success: true,
          projectName: `Project ${projectId}`,
        };
      } else {
        return {
          success: false,
          error: 'Failed to connect to BrowserStack TM',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to BrowserStack TM',
      };
    }
  }

  /**
   * Create or update a test case in BrowserStack TM
   * 
   * If payload.testCaseId is provided, updates the existing test case.
   * Otherwise, creates a new test case in the default project and suite.
   * 
   * @param payload - Test case creation/update payload
   * @returns Created or updated test case with ID and URL
   */
  async createOrUpdateTestCase(payload: CreateOrUpdateTestCasePayload): Promise<TestCase> {
    const { projectId, apiToken } = this.getConfigWithToken();
    
    let url: string;
    let method: 'POST' | 'PUT' = 'POST';
    
    if (payload.testCaseId) {
      // Update existing test case
      url = `${this.baseUrl}/projects/${projectId}/test-cases/${payload.testCaseId}`;
      method = 'PUT';
    } else {
      // Create new test case
      url = `${this.baseUrl}/projects/${projectId}/test-cases`;
      method = 'POST';
    }

    const apiPayload: any = {
      name: payload.name,
      description: payload.description || '',
      tags: payload.tags || [],
      ...payload.customFields,
    };

    const response = await this.makeRequest(method, url, apiToken, apiPayload);
    
    // Transform API response to TestCase
    const testCaseId = response.testCaseId || response.identifier || payload.testCaseId || '';
    return this.getTestCase(testCaseId);
  }

  /**
   * Get a single test case by ID
   * 
   * @param testCaseId - Test case identifier (e.g., "TC-123")
   * @returns Full test case details
   */
  async getTestCase(testCaseId: string): Promise<TestCase> {
    const { projectId, apiToken } = this.getConfigWithToken();
    // BrowserStack TM API uses query parameter ?id=TC-xxx to get specific test case
    const url = `${this.baseUrl}/projects/${projectId}/test-cases?id=${testCaseId}`;
    
    const response = await this.makeRequest('GET', url, apiToken);
    
    // Response contains test_cases array, get the first one
    const tc = (response.test_cases || [])[0];
    if (!tc) {
      throw new BrowserStackTmClientError(`Test case ${testCaseId} not found`, 404);
    }
    
    return this.mapApiTestCaseToTestCase(tc, projectId);
  }

  /**
   * List test cases for the project
   * 
   * @param opts - Optional pagination and filter options
   * @returns Paginated list of test cases
   */
  async listTestCases(opts?: ListTestCasesOptions): Promise<PaginatedResult<TestCase>> {
    const { projectId, apiToken } = this.getConfigWithToken();
    const page = opts?.page || 1;
    const pageSize = opts?.pageSize || 30;
    
    let url = `${this.baseUrl}/projects/${projectId}/test-cases?p=${page}&page_size=${pageSize}`;
    
    // Add optional filters
    if (opts?.search) {
      url += `&search=${encodeURIComponent(opts.search)}`;
    }
    if (opts?.status) {
      url += `&status=${encodeURIComponent(opts.status)}`;
    }
    if (opts?.tags && opts.tags.length > 0) {
      url += `&tags=${opts.tags.map(t => encodeURIComponent(t)).join(',')}`;
    }
    
    const response = await this.makeRequest('GET', url, apiToken);
    
    // BrowserStack TM API returns { success: true, test_cases: [...], info: {...} }
    const testCases = (response.test_cases || []).map((tc: any) => 
      this.mapApiTestCaseToTestCase(tc, projectId)
    );
    
    const info = response.info || {};
    
    return {
      items: testCases,
      total: info.count || testCases.length,
      page: info.page || page,
      pageSize: info.page_size || pageSize,
      hasMore: !!info.next,
    };
  }

  /**
   * Get test case history
   * 
   * @param testCaseId - Test case identifier
   * @returns Array of history entries showing changes over time
   */
  async getTestCaseHistory(testCaseId: string): Promise<TestCaseHistoryEntry[]> {
    const { projectId, apiToken } = this.getConfigWithToken();
    const url = `${this.baseUrl}/projects/${projectId}/test-cases/${testCaseId}/history?p=1&page_size=100`;
    
    const response = await this.makeRequest('GET', url, apiToken);
    
    return (response.history || []).map((h: any) => ({
      versionId: h.version_id || '',
      source: h.source || '',
      modifiedFields: h.modified_fields || [],
      userId: h.user_id || 0,
      createdAt: h.created_at || '',
      modified: h.modified || {},
    }));
  }

  /**
   * Publish a test run to BrowserStack TM
   * 
   * Creates a test run record associated with a test case, including
   * status, duration, error messages, and BrowserStack Automate session links.
   * 
   * @param payload - Test run publishing payload
   * @returns Published test run with ID and URL
   */
  async publishTestRun(payload: PublishRunPayload): Promise<TestRun> {
    const { projectId, apiToken } = this.getConfigWithToken();
    const url = `${this.baseUrl}/projects/${projectId}/test-runs`;

    const runName = payload.runName || `${payload.testCaseId}-${new Date().toISOString()}`;
    
    const apiPayload: any = {
      test_case_id: payload.testCaseId,
      status: payload.status,
      duration: payload.duration || 0,
      error: payload.error || null,
      screenshots: payload.screenshots || [],
      video_url: payload.videoUrl || null,
      session_id: payload.sessionId || null,
      build_id: payload.buildId || null,
      notes: payload.dashboardUrl
        ? `BrowserStack Automate Session: ${payload.dashboardUrl}`
        : null,
      name: runName,
    };

    const response = await this.makeRequest('POST', url, apiToken, apiPayload);
    
    // Transform API response to TestRun
    const testRunId = response.testRunId || response.identifier || '';
    return this.mapApiTestRunToTestRun(response, projectId, payload.testCaseId);
  }

  /**
   * List test runs
   * 
   * @param opts - Optional filters (test case ID, status, date range) and pagination
   * @returns Paginated list of test runs
   */
  async listTestRuns(opts?: ListTestRunsOptions): Promise<PaginatedResult<TestRun>> {
    const { projectId, apiToken } = this.getConfigWithToken();
    const page = opts?.page || 1;
    const pageSize = opts?.pageSize || 30;
    
    let url = `${this.baseUrl}/projects/${projectId}/test-runs?p=${page}&page_size=${pageSize}`;
    
    if (opts?.testCaseId) {
      url += `&test_case_id=${opts.testCaseId}`;
    }
    if (opts?.status) {
      url += `&status=${opts.status}`;
    }
    if (opts?.dateFrom) {
      url += `&date_from=${opts.dateFrom}`;
    }
    if (opts?.dateTo) {
      url += `&date_to=${opts.dateTo}`;
    }
    
    const response = await this.makeRequest('GET', url, apiToken);
    
    // BrowserStack TM API returns { success: true, test_runs: [...], info: {...} }
    const testRuns = (response.test_runs || []).map((tr: any) => 
      this.mapApiTestRunToTestRun(tr, projectId, tr.test_case_id || opts?.testCaseId || '')
    );
    
    const info = response.info || {};
    
    return {
      items: testRuns,
      total: info.count || testRuns.length,
      page: info.page || page,
      pageSize: info.page_size || pageSize,
      hasMore: !!info.next,
    };
  }

  /**
   * Publish a test run from a bundle
   * 
   * Reads the bundle's meta.json, ensures the test case is linked,
   * and publishes a test run with results tied to that test case.
   * 
   * @param bundleMeta - Bundle metadata structure
   * @returns Published test run
   */
  async publishRunFromBundle(bundleMeta: BundleMeta): Promise<TestRun> {
    const browserstack = bundleMeta.meta.browserstack || {};

    if (!browserstack.tmTestCaseId) {
      // Ensure test case exists first
      await this.ensureTestCaseForBundle(bundleMeta);
    }

    const finalBrowserstack = bundleMeta.meta.browserstack || {};
    if (!finalBrowserstack.tmTestCaseId) {
      throw new BrowserStackTmClientError(
        'Test case not linked to bundle. Cannot publish test run.',
        400
      );
    }

    // Read run result from bundle (if available)
    // For now, we'll need to get this from the caller or bundle structure
    // This is a placeholder - actual implementation depends on how run results are stored
    const payload: PublishRunPayload = {
      testCaseId: finalBrowserstack.tmTestCaseId,
      status: 'passed', // Default - should come from actual run result
      runName: `${bundleMeta.testName}-${new Date().toISOString()}`,
    };

    return this.publishTestRun(payload);
  }

  /**
   * Ensure a test case exists for a bundle
   * 
   * If the bundle already has a tmTestCaseId, verifies it exists and returns it.
   * Otherwise, creates a new test case from bundle metadata and writes the ID/URL back to meta.json.
   * 
   * @param bundleMeta - Bundle metadata structure
   * @returns Test case (existing or newly created)
   */
  async ensureTestCaseForBundle(bundleMeta: BundleMeta): Promise<TestCase> {
    const browserstack = bundleMeta.meta.browserstack || {};

    // If already linked, verify it exists and return it
    if (browserstack.tmTestCaseId) {
      try {
        const existingCase = await this.getTestCase(browserstack.tmTestCaseId);
        return existingCase;
      } catch (error: any) {
        // Test case doesn't exist, create a new one
        console.warn('[BrowserStackTm] Linked test case not found, creating new one:', error.message);
      }
    }

    // Create new test case from bundle metadata
    const { projectName, suiteName } = this.getConfig();
    const testName = bundleMeta.testName;
    const meta = bundleMeta.meta;

    // Extract parameters and assertions from meta (if available)
    const metaAny = meta as any;
    const parameters: string[] =
      Array.isArray(metaAny.parameters) ? metaAny.parameters.map((p: any) => p.name || p) : [];
    const assertions: string[] =
      Array.isArray(metaAny.assertions) ? metaAny.assertions.map((a: any) => a.description || a) : [];

    const descriptionParts: string[] = [];
    if (metaAny.intent || metaAny.description) {
      descriptionParts.push(metaAny.intent || metaAny.description);
      descriptionParts.push('');
    }
    descriptionParts.push(`Project: ${projectName || 'QA Studio'}`);
    descriptionParts.push(`Suite: ${suiteName}`);
    if (meta.module) {
      descriptionParts.push(`Module: ${meta.module}`);
    }
    if (parameters.length) {
      descriptionParts.push(`Parameters: ${parameters.join(', ')}`);
    }
    if (assertions.length) {
      descriptionParts.push(`Assertions: ${assertions.join('; ')}`);
    }

    const payload: CreateOrUpdateTestCasePayload = {
      name: testName,
      description: descriptionParts.join('\n'),
      tags: [
        'qa-studio',
        meta.workspaceId || '',
        meta.module || '',
      ].filter(Boolean),
      customFields: {
        internal_id: meta.id,
      },
      testCaseId: browserstack.tmTestCaseId, // If provided, will update instead of create
    };

    const testCase = await this.createOrUpdateTestCase(payload);
    const { projectId } = this.getConfig();

    // Write back to meta.json
    bundleMeta.meta.browserstack = {
      ...browserstack,
      tmProjectId: projectId,
      tmTestCaseId: testCase.identifier,
      tmTestCaseUrl: testCase.url,
    };

    this.writeBundleMeta(bundleMeta);

    return testCase;
  }

  /**
   * Link an existing BrowserStack TM test case to a bundle
   * 
   * Manually associates an existing test case with this bundle by updating meta.json.
   * 
   * @param bundleMeta - Bundle metadata structure
   * @param testCaseId - Test case identifier to link
   */
  async linkTestCaseToBundle(bundleMeta: BundleMeta, testCaseId: string): Promise<void> {
    // Verify test case exists
    const testCase = await this.getTestCase(testCaseId);
    const { projectId } = this.getConfig();

    // Update bundle meta
    bundleMeta.meta.browserstack = {
      ...(bundleMeta.meta.browserstack || {}),
      tmProjectId: projectId,
      tmTestCaseId: testCase.identifier,
      tmTestCaseUrl: testCase.url,
    };

    this.writeBundleMeta(bundleMeta);
  }

  /**
   * Sync test case fields in BrowserStack TM to match current bundle metadata
   * 
   * Updates the test case in BrowserStack TM with current bundle information.
   * 
   * @param bundleMeta - Bundle metadata structure
   * @returns Updated test case
   */
  async syncTestCaseForBundle(bundleMeta: BundleMeta): Promise<TestCase> {
    const browserstack = bundleMeta.meta.browserstack || {};

    // If no existing TM id, create/link a new test case
    if (!browserstack.tmTestCaseId) {
      return this.ensureTestCaseForBundle(bundleMeta);
    }

    // Update existing test case
    const { projectName, suiteName } = this.getConfig();
    const testName = bundleMeta.testName;
    const meta = bundleMeta.meta;

    // Extract parameters and assertions from meta (if available)
    const metaAny = meta as any;
    const parameters: string[] =
      Array.isArray(metaAny.parameters) ? metaAny.parameters.map((p: any) => p.name || p) : [];
    const assertions: string[] =
      Array.isArray(metaAny.assertions) ? metaAny.assertions.map((a: any) => a.description || a) : [];

    const descriptionParts: string[] = [];
    if (metaAny.intent || metaAny.description) {
      descriptionParts.push(metaAny.intent || metaAny.description);
      descriptionParts.push('');
    }
    descriptionParts.push(`Project: ${projectName || 'QA Studio'}`);
    descriptionParts.push(`Suite: ${suiteName}`);
    if (meta.module) {
      descriptionParts.push(`Module: ${meta.module}`);
    }
    if (parameters.length) {
      descriptionParts.push(`Parameters: ${parameters.join(', ')}`);
    }
    if (assertions.length) {
      descriptionParts.push(`Assertions: ${assertions.join('; ')}`);
    }

    const payload: CreateOrUpdateTestCasePayload = {
      name: testName,
      description: descriptionParts.join('\n'),
      tags: [
        'qa-studio',
        meta.workspaceId || '',
        meta.module || '',
      ].filter(Boolean),
      customFields: {
        internal_id: meta.id,
      },
      testCaseId: browserstack.tmTestCaseId, // Update existing
    };

    return this.createOrUpdateTestCase(payload);
  }

  /**
   * Read bundle metadata from a bundle directory
   * 
   * @param bundleDir - Path to bundle directory
   * @returns Bundle metadata structure
   */
  readBundleMeta(bundleDir: string): BundleMeta {
    const metaFile = fs.readdirSync(bundleDir).find(f => f.endsWith('.meta.json'));
    if (!metaFile) {
      throw new BrowserStackTmClientError(`No meta.json found in bundle: ${bundleDir}`, 404);
    }

    const metaPath = path.join(bundleDir, metaFile);
    let meta: TestMeta;
    
    try {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      meta = JSON.parse(metaContent);
    } catch (error: any) {
      throw new BrowserStackTmClientError(
        `Failed to parse meta.json: ${error.message}`,
        400
      );
    }

    const metaAny = meta as any;
    const testName = meta.testName || metaAny.name || path.basename(bundleDir);

    return {
      bundleDir,
      metaPath,
      testName,
      meta,
    };
  }

  /**
   * Write bundle metadata to disk
   * 
   * Safely writes the updated meta.json file with error handling.
   * 
   * @param bundleMeta - Bundle metadata structure to write
   */
  writeBundleMeta(bundleMeta: BundleMeta): void {
    try {
      // Write atomically: write to temp file, then rename
      const tempPath = `${bundleMeta.metaPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(bundleMeta.meta, null, 2), 'utf-8');
      fs.renameSync(tempPath, bundleMeta.metaPath);
    } catch (error: any) {
      throw new BrowserStackTmError(
        `Failed to write meta.json: ${error.message}`,
        undefined,
        'client'
      );
    }
  }

  /**
   * Get config with API token formatted for Basic Auth
   * 
   * @private
   */
  private getConfigWithToken(): { projectId: string; apiToken: string; [key: string]: any } {
    const config = this.getConfig();
    const apiToken = `${config.username}:${config.accessKey}`;
    return {
      ...config,
      apiToken,
    };
  }

  /**
   * Map API test case response to TestCase type
   * 
   * @private
   */
  private mapApiTestCaseToTestCase(tc: any, projectId: string): TestCase {
    return {
      id: tc.identifier || tc.id || '',
      identifier: tc.identifier || tc.id || '',
      name: tc.title || tc.name || 'Unnamed',
      description: tc.description || '',
      preconditions: tc.preconditions || '',
      status: tc.status || '',
      priority: tc.priority || '',
      caseType: tc.case_type || '',
      owner: tc.owner || null,
      tags: tc.tags || [],
      automationStatus: tc.automation_status || '',
      template: tc.template || '',
      steps: tc.steps || [],
      issues: tc.issues || [],
      customFields: tc.custom_fields || [],
      createdAt: tc.created_at || '',
      updatedAt: tc.last_updated_at || tc.updated_at || '',
      createdBy: tc.created_by || '',
      updatedBy: tc.last_updated_by || tc.updated_by || '',
      url: `https://test-management.browserstack.com/projects/${projectId}/test-cases/${tc.identifier || tc.id}`,
    };
  }

  /**
   * Map API test run response to TestRun type
   * 
   * @private
   */
  private mapApiTestRunToTestRun(tr: any, projectId: string, testCaseId: string): TestRun {
    return {
      id: tr.identifier || tr.id || '',
      identifier: tr.identifier || tr.id || '',
      testCaseId: tr.test_case_id || testCaseId,
      status: tr.status || 'unknown',
      duration: tr.duration || 0,
      error: tr.error || null,
      screenshots: tr.screenshots || [],
      videoUrl: tr.video_url || null,
      sessionId: tr.session_id || null,
      buildId: tr.build_id || null,
      notes: tr.notes || null,
      createdAt: tr.created_at || '',
      url: `https://test-management.browserstack.com/projects/${projectId}/test-runs/${tr.identifier || tr.id}`,
    };
  }

  /**
   * Make HTTP request to BrowserStack TM API
   * 
   * Handles authentication, error parsing, and proper error type classification.
   * Credentials are redacted from logs.
   * 
   * @private
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    urlString: string,
    apiToken: string,
    payload?: any
  ): Promise<any> {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // BrowserStack TM uses HTTP Basic Auth with username:accessKey format
    const auth = Buffer.from(apiToken).toString('base64');

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      };

      const options: {
        hostname: string;
        port: string | number;
        path: string;
        method: string;
        headers: Record<string, string>;
      } = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers,
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const response = data ? JSON.parse(data) : {};
              resolve(response);
            } else {
              // Parse error response
              let errorMessage = res.statusMessage || 'Unknown error';
              try {
                const errorData = data ? JSON.parse(data) : {};
                if (errorData.message) {
                  errorMessage = errorData.message;
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                  errorMessage = errorData;
                }
              } catch {
                // Use raw data if JSON parsing fails
                if (data) {
                  errorMessage = data.substring(0, 200); // Limit error message length
                }
              }
              
              // Classify error type
              let error: BrowserStackTmError;
              if (res.statusCode === 401 || res.statusCode === 403) {
                error = new BrowserStackTmAuthError(
                  `Authentication failed: ${errorMessage}`,
                  res.statusCode
                );
              } else if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
                error = new BrowserStackTmClientError(
                  `Client error: ${errorMessage}`,
                  res.statusCode
                );
              } else if (res.statusCode && res.statusCode >= 500) {
                error = new BrowserStackTmServerError(
                  `Server error: ${errorMessage}`,
                  res.statusCode
                );
              } else {
                error = new BrowserStackTmError(
                  `API error: ${res.statusCode} - ${errorMessage}`,
                  res.statusCode
                );
              }

              // Log error (redact credentials)
              const redactedUrl = urlString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
              console.error('[BrowserStackTm] API error:', {
                method,
                url: redactedUrl,
                statusCode: res.statusCode,
                error: errorMessage,
              });
              
              reject(error);
            }
          } catch (error: any) {
            reject(new BrowserStackTmError(`Failed to parse BrowserStack TM response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new BrowserStackTmNetworkError(`Network error: ${error.message}`));
      });

      if (payload && (method === 'POST' || method === 'PUT')) {
        const payloadString = JSON.stringify(payload);
        headers['Content-Length'] = Buffer.byteLength(payloadString).toString();
        req.write(payloadString);
      }

      req.end();
    });
  }
}
