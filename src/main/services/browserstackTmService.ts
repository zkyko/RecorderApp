import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';

// Demo configuration for v2.0 – hardcoded project + suite
const TM_DEMO_CONFIG = {
  tmProjectId: 'PR-25',
  tmProjectName: 'ZZ Archive - QA & Test Automation 1',
  tmSuiteName: 'TestManagement For StudioAPP',
};

interface TestCase {
  name: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface TestRun {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshots?: string[];
  videoUrl?: string;
  sessionId?: string;
  buildId?: string;
}

/**
 * BrowserStack Test Management Service
 * Handles test case creation and test run publishing
 */
export class BrowserStackTMService {
  private configManager: ConfigManager;
  private baseUrl = 'https://test-management.browserstack.com/api/v2';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Get BrowserStack TM configuration from settings
   * Hardcoded defaults for organization credentials
   */
  private getConfig(): {
    projectId: string;
    apiToken: string;
    username: string;
    accessKey: string;
    projectName: string;
    suiteName: string;
  } {
    // Read BrowserStack TM config from settings (if available)
    const config = this.configManager.getConfig();
    const tmApiToken = (config as any).browserstackTmApiToken || '';
    const username = (config as any).browserstackUsername || '';
    const accessKey = (config as any).browserstackAccessKey || '';

    // Hardcoded defaults for BrowserStack TM
    // SECURITY WARNING: Credentials are hardcoded here as organization defaults.
    // These values will be visible in source control. Settings can override these values.
    const defaultUsername = 'nbhandari_KMkNq9';
    const defaultAccessKey = '1tnaMGT6bqxfiTNX9zd7';
    
    // Use provided values or fall back to hardcoded defaults
    const finalUsername = username || defaultUsername;
    const finalAccessKey = accessKey || (tmApiToken && !tmApiToken.includes(':') ? tmApiToken : defaultAccessKey);
    
    // BrowserStack TM uses username:accessKey for Basic Auth
    let finalToken = '';
    if (tmApiToken && tmApiToken.includes(':')) {
      // Token is in format "username:accessKey"
      finalToken = tmApiToken;
    } else if (username && accessKey) {
      // We have separate username and access key
      finalToken = `${username}:${accessKey}`;
    } else {
      // Use hardcoded defaults
      finalToken = `${finalUsername}:${finalAccessKey}`;
    }

    return {
      projectId: TM_DEMO_CONFIG.tmProjectId,
      apiToken: finalToken,
      username: finalUsername,
      accessKey: finalAccessKey,
      projectName: TM_DEMO_CONFIG.tmProjectName,
      suiteName: TM_DEMO_CONFIG.tmSuiteName,
    };
  }

  /**
   * Create or update a test case in BrowserStack TM
   */
  async createOrUpdateTestCase(testCase: TestCase): Promise<{ testCaseId: string }> {
    const { projectId, apiToken } = this.getConfig();
    const url = `${this.baseUrl}/projects/${projectId}/test-cases`;

    const payload = {
      name: testCase.name,
      description: testCase.description || '',
      tags: testCase.tags || [],
      ...testCase.customFields,
    };

    return this.makeRequest('POST', url, apiToken, payload);
  }

  /**
   * Publish a test run to BrowserStack TM
   */
  async publishTestRun(
    testCaseId: string,
    testRun: TestRun,
    automateInfo?: { sessionId?: string; buildId?: string; dashboardUrl?: string }
  ): Promise<{ testRunId: string }> {
    const { projectId, apiToken } = this.getConfig();
    const url = `${this.baseUrl}/projects/${projectId}/test-runs`;

    const payload = {
      test_case_id: testCaseId,
      status: testRun.status,
      duration: testRun.duration || 0,
      error: testRun.error || null,
      screenshots: testRun.screenshots || [],
      video_url: testRun.videoUrl || null,
      session_id: automateInfo?.sessionId || testRun.sessionId || null,
      build_id: automateInfo?.buildId || testRun.buildId || null,
      notes: automateInfo?.dashboardUrl
        ? `BrowserStack Automate Session: ${automateInfo.dashboardUrl}`
        : null,
    };

    return this.makeRequest('POST', url, apiToken, payload);
  }

  /**
   * Test connection to BrowserStack TM
   * Gets project info to verify connection
   */
  async testConnection(): Promise<{ success: boolean; projectName?: string; error?: string }> {
    try {
      const { projectId, apiToken } = this.getConfig();
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
   * List test cases for the project
   * Uses BrowserStack TM API v2 format with pagination
   */
  async listTestCases(page: number = 1, pageSize: number = 30): Promise<{
    testCases: Array<{
      id: string;
      identifier: string;
      name: string;
      description?: string;
      status?: string;
      priority?: string;
      caseType?: string;
      owner?: string;
      tags?: string[];
      automationStatus?: string;
      createdAt: string;
      updatedAt: string;
      url: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      const { projectId, apiToken } = this.getConfig();
      // BrowserStack TM API uses page and page_size for pagination
      const url = `${this.baseUrl}/projects/${projectId}/test-cases?p=${page}&page_size=${pageSize}`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      // BrowserStack TM API returns { success: true, test_cases: [...], info: {...} }
      const testCases = (response.test_cases || []).map((tc: any) => ({
        id: tc.identifier || tc.id,
        identifier: tc.identifier || '',
        name: tc.title || tc.name || 'Unnamed',
        description: tc.description || '',
        status: tc.status || '',
        priority: tc.priority || '',
        caseType: tc.case_type || '',
        owner: tc.owner || null,
        tags: tc.tags || [],
        automationStatus: tc.automation_status || '',
        createdAt: tc.created_at || '',
        updatedAt: tc.last_updated_at || tc.updated_at || '',
        url: `https://test-management.browserstack.com/projects/${projectId}/test-cases/${tc.identifier || tc.id}`,
      }));
      
      const info = response.info || {};
      
      return {
        testCases,
        total: info.count || testCases.length,
        page: info.page || page,
        pageSize: info.page_size || pageSize,
        hasMore: !!info.next,
      };
    } catch (error: any) {
      throw new Error(`Failed to list test cases: ${error.message}`);
    }
  }

  /**
   * Get a single test case by ID
   * Uses BrowserStack TM API v2 format
   */
  async getTestCase(testCaseId: string): Promise<{
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
  }> {
    try {
      const { projectId, apiToken } = this.getConfig();
      // BrowserStack TM API uses query parameter ?id=TC-xxx to get specific test case
      const url = `${this.baseUrl}/projects/${projectId}/test-cases?id=${testCaseId}`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      // Response contains test_cases array, get the first one
      const tc = (response.test_cases || [])[0];
      if (!tc) {
        throw new Error(`Test case ${testCaseId} not found`);
      }
      
      return {
        id: tc.identifier || testCaseId,
        identifier: tc.identifier || testCaseId,
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
        url: `https://test-management.browserstack.com/projects/${projectId}/test-cases/${tc.identifier || testCaseId}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to get test case: ${error.message}`);
    }
  }

  /**
   * List test runs for a test case or project
   * Uses BrowserStack TM API v2 format
   */
  async listTestRuns(testCaseId?: string, page: number = 1, pageSize: number = 30): Promise<{
    testRuns: Array<{
      id: string;
      identifier: string;
      testCaseId: string;
      status: 'passed' | 'failed' | 'skipped';
      duration?: number;
      error?: string;
      createdAt: string;
      sessionId?: string;
      buildId?: string;
      url: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      const { projectId, apiToken } = this.getConfig();
      let url = `${this.baseUrl}/projects/${projectId}/test-runs?p=${page}&page_size=${pageSize}`;
      
      if (testCaseId) {
        url += `&test_case_id=${testCaseId}`;
      }
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      // BrowserStack TM API returns { success: true, test_runs: [...], info: {...} }
      const testRuns = (response.test_runs || []).map((tr: any) => ({
        id: tr.identifier || tr.id,
        identifier: tr.identifier || tr.id || '',
        testCaseId: tr.test_case_id || tr.testCaseId || '',
        status: tr.status || 'unknown',
        duration: tr.duration || 0,
        error: tr.error || null,
        createdAt: tr.created_at || '',
        sessionId: tr.session_id || tr.sessionId,
        buildId: tr.build_id || tr.buildId,
        url: `https://test-management.browserstack.com/projects/${projectId}/test-runs/${tr.identifier || tr.id}`,
      }));
      
      const info = response.info || {};
      
      return {
        testRuns,
        total: info.count || testRuns.length,
        page: info.page || page,
        pageSize: info.page_size || pageSize,
        hasMore: !!info.next,
      };
    } catch (error: any) {
      throw new Error(`Failed to list test runs: ${error.message}`);
    }
  }

  /**
   * Make HTTP request to BrowserStack TM API
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
    // The apiToken parameter should already be in the correct format from getConfig()
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
              
              console.error('[BrowserStackTM] API error response:', {
                statusCode: res.statusCode,
                error: errorMessage,
                data: data?.substring(0, 500), // Log first 500 chars for debugging
              });
              
              reject(
                new Error(
                  `BrowserStack TM API error: ${res.statusCode} - ${errorMessage}`
                )
              );
            }
          } catch (error: any) {
            reject(new Error(`Failed to parse BrowserStack TM response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`BrowserStack TM API request failed: ${error.message}`));
      });

      if (payload && (method === 'POST' || method === 'PUT')) {
        const payloadString = JSON.stringify(payload);
        headers['Content-Length'] = Buffer.byteLength(payloadString).toString();
        req.write(payloadString);
      }

      req.end();
    });
  }

  /**
   * Build a deep-link URL to a BrowserStack TM test case
   */
  private buildTestCaseUrl(projectId: string, testCaseId: string): string {
    // NOTE: Adjust this if BrowserStack TM uses a different URL pattern
    return `https://test-management.browserstack.com/projects/${projectId}/test-cases/${testCaseId}`;
  }

  /**
   * Ensure a BrowserStack TM test case exists for the given test bundle.
   * Reads the bundle's meta.json, creates a test case if needed, and writes
   * tmProjectId / tmTestCaseId / tmTestCaseUrl back into meta.browserstack.
   */
  async ensureTestCaseForBundle(bundleDir: string): Promise<void> {
    // Check configuration first - fail gracefully if not configured
    let config;
    try {
      config = this.getConfig();
    } catch (error: any) {
      console.warn('[BrowserStackTM] Configuration check failed, skipping test case creation:', error.message);
      // Don't throw - TM sync is optional, test generation should continue
      return;
    }

    const { projectId, projectName, suiteName } = config;

    const metaFile = fs.readdirSync(bundleDir).find(f => f.endsWith('.meta.json'));
    if (!metaFile) {
      console.warn('[BrowserStackTM] No meta.json found in bundle', bundleDir);
      return;
    }

    const metaPath = path.join(bundleDir, metaFile);
    const meta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const browserstack = meta.browserstack || {};

    // Determine the display name for the test case
    const testName: string = meta.testName || meta.name || path.basename(bundleDir);

    // If already linked, skip creation (update support can be added later)
    if (browserstack.tmTestCaseId) {
      console.log('[BrowserStackTM] Test case already linked:', browserstack.tmTestCaseId);
      return;
    }

    const parameters: string[] =
      Array.isArray(meta.parameters) ? meta.parameters.map((p: any) => p.name || p) : [];
    const assertions: string[] =
      Array.isArray(meta.assertions) ? meta.assertions.map((a: any) => a.description || a) : [];

    const descriptionParts: string[] = [];
    if (meta.intent || meta.description) {
      descriptionParts.push(meta.intent || meta.description);
      descriptionParts.push('');
    }
    descriptionParts.push(`Project: ${projectName}`);
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

    const payload: TestCase = {
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
    };

    try {
      const response = await this.createOrUpdateTestCase(payload);
      const tmTestCaseId = response.testCaseId;
      const tmTestCaseUrl = this.buildTestCaseUrl(projectId, tmTestCaseId);

      meta.browserstack = {
        ...browserstack,
        tmProjectId: projectId,
        tmTestCaseId,
        tmTestCaseUrl,
      };

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      console.log('[BrowserStackTM] Linked test to BrowserStack TM:', tmTestCaseId);
    } catch (error: any) {
      console.warn('[BrowserStackTM] Failed to create/update test case in BrowserStack TM:', error.message);
      // Don't throw - TM sync is optional, test generation should continue
      throw error; // Re-throw so caller can handle it if needed, but SpecWriter already catches
    }
  }

  /**
   * Link an existing BrowserStack TM test case to a test bundle.
   * Updates meta.json with the test case ID and URL.
   */
  async linkTestCaseToBundle(
    workspacePath: string,
    testName: string,
    testCaseId: string,
    testCaseUrl: string
  ): Promise<void> {
    try {
      const fileName = testName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Try new bundle structure first
      let metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);

      if (!fs.existsSync(metaPath)) {
        // Try old module structure
        const oldModulePath = path.join(workspacePath, 'tests', 'd365', fileName, `${fileName}.meta.json`);
        if (fs.existsSync(oldModulePath)) {
          metaPath = oldModulePath;
        } else {
          // Try old flat structure
          const oldFlatPath = path.join(workspacePath, 'tests', `${fileName}.meta.json`);
          if (fs.existsSync(oldFlatPath)) {
            metaPath = oldFlatPath;
          } else {
            // Try web-demo structure
            const webDemoPath = path.join(workspacePath, 'tests', 'web-demo', 'specs', fileName, `${fileName}.meta.json`);
            if (fs.existsSync(webDemoPath)) {
              metaPath = webDemoPath;
            } else {
              throw new Error(`meta.json not found for test: ${testName}`);
            }
          }
        }
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const { projectId } = this.getConfig();

      meta.browserstack = {
        ...(meta.browserstack || {}),
        tmProjectId: projectId,
        tmTestCaseId: testCaseId || undefined,
        tmTestCaseUrl: testCaseUrl || undefined,
      };

      // Remove fields if unlinking (empty values)
      if (!testCaseId || !testCaseUrl) {
        delete meta.browserstack.tmTestCaseId;
        delete meta.browserstack.tmTestCaseUrl;
        if (Object.keys(meta.browserstack).length === 1 && meta.browserstack.tmProjectId) {
          // Only projectId left, might want to keep it or remove entirely
        }
      }

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      console.log('[BrowserStackTM] Linked test case to bundle:', testCaseId || 'unlinked');
    } catch (error: any) {
      throw new Error(`Failed to link test case: ${error.message}`);
    }
  }

  /**
   * Sync an existing BrowserStack TM test case for the given bundle.
   * If no test case is linked yet, this falls back to ensureTestCaseForBundle.
   */
  async syncTestCaseForBundle(bundleDir: string): Promise<void> {
    // Check configuration first - fail gracefully if not configured
    let config;
    try {
      config = this.getConfig();
    } catch (error: any) {
      console.warn('[BrowserStackTM] Configuration check failed, skipping sync:', error.message);
      throw new Error('BrowserStack Test Management is not configured. Please set the API token in Settings.');
    }

    const { projectId, projectName, suiteName } = config;
    const metaFile = fs.readdirSync(bundleDir).find(f => f.endsWith('.meta.json'));
    if (!metaFile) {
      console.warn('[BrowserStackTM] No meta.json found in bundle', bundleDir);
      return;
    }

    const metaPath = path.join(bundleDir, metaFile);
    const meta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const browserstack = meta.browserstack || {};

    // If no existing TM id, just create/link a new test case
    if (!browserstack.tmTestCaseId) {
      await this.ensureTestCaseForBundle(bundleDir);
      return;
    }

    const testName: string = meta.testName || meta.name || path.basename(bundleDir);
    const parameters: string[] =
      Array.isArray(meta.parameters) ? meta.parameters.map((p: any) => p.name || p) : [];
    const assertions: string[] =
      Array.isArray(meta.assertions) ? meta.assertions.map((a: any) => a.description || a) : [];

    const descriptionParts: string[] = [];
    if (meta.intent || meta.description) {
      descriptionParts.push(meta.intent || meta.description);
      descriptionParts.push('');
    }
    descriptionParts.push(`Project: ${projectName}`);
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

    const payload: TestCase = {
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
    };

    // Treat createOrUpdateTestCase as an upsert for now
    try {
      await this.createOrUpdateTestCase(payload);
      // We keep the existing tmTestCaseId and URL; no need to rewrite meta
    } catch (error: any) {
      console.warn('[BrowserStackTM] Failed to sync test case in BrowserStack TM:', error.message);
      // Don't throw - TM sync is optional
      throw error; // Re-throw so caller can handle it, but bridge handler already catches
    }
  }

  /**
   * Get test case history
   * GET /api/v2/projects/{project_id}/test-cases/{test_case_id}/history
   */
  async getTestCaseHistory(testCaseId: string, page: number = 1, pageSize: number = 20): Promise<{
    history: Array<{
      versionId: string;
      source: string;
      modifiedFields: string[];
      userId: number;
      createdAt: string;
      modified?: Record<string, any>;
    }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      const { projectId, apiToken } = this.getConfig();
      const url = `${this.baseUrl}/projects/${projectId}/test-cases/${testCaseId}/history?p=${page}&page_size=${pageSize}`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      const history = (response.history || []).map((h: any) => ({
        versionId: h.version_id || '',
        source: h.source || '',
        modifiedFields: h.modified_fields || [],
        userId: h.user_id || 0,
        createdAt: h.created_at || '',
        modified: h.modified || {},
      }));
      
      const info = response.info || {};
      
      return {
        history,
        total: info.count || history.length,
        page: info.page || page,
        pageSize: info.page_size || pageSize,
        hasMore: !!info.next,
      };
    } catch (error: any) {
      throw new Error(`Failed to get test case history: ${error.message}`);
    }
  }

  /**
   * Publish a run result for a given bundle to BrowserStack TM.
   * Expects the bundle's meta.json to already contain browserstack.tmTestCaseId.
   */
  async publishRunFromBundle(bundleDir: string, result: any): Promise<void> {
    const metaFile = fs.readdirSync(bundleDir).find(f => f.endsWith('.meta.json'));
    if (!metaFile) {
      console.warn('[BrowserStackTM] No meta.json found for run publish in', bundleDir);
      return;
    }

    const metaPath = path.join(bundleDir, metaFile);
    const meta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const browserstack = meta.browserstack || {};

    if (!browserstack.tmTestCaseId) {
      console.warn('[BrowserStackTM] tmTestCaseId missing, skipping TM run publish');
      return;
    }

    const status: 'passed' | 'failed' | 'skipped' =
      result.status === 'failed'
        ? 'failed'
        : result.status === 'skipped'
        ? 'skipped'
        : 'passed';

    const testRun: TestRun = {
      testCaseId: browserstack.tmTestCaseId,
      status,
      duration: result.durationMs,
      error: result.assertionSummary?.firstFailureMessage,
      sessionId: result.bsSessionId,
      buildId: result.bsBuildId,
    };

    await this.publishTestRun(browserstack.tmTestCaseId, testRun, {
      sessionId: result.bsSessionId,
      buildId: result.bsBuildId,
      dashboardUrl: result.bsSessionUrl,
    });
  }
}

