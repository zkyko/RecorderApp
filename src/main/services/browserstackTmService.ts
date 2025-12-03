import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';

// Demo configuration for v2.0 – hardcoded project + suite
const TM_DEMO_CONFIG = {
  tmProjectId: 'PR-26',
  tmProjectName: 'StudioAPP',
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
   */
  private getConfig(): {
    projectId: string;
    apiToken: string;
    projectName: string;
    suiteName: string;
  } {
    const config = this.configManager.getConfig();
    const tmApiToken = (config as any).browserstackTmApiToken || '';

    if (!tmApiToken) {
      throw new Error('BrowserStack Test Management API token is not configured. Please set it in Settings.');
    }

    return {
      projectId: TM_DEMO_CONFIG.tmProjectId,
      apiToken: tmApiToken,
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

    // BrowserStack TM uses HTTP Basic Auth with token in "username:password" format
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
              reject(
                new Error(
                  `BrowserStack TM API error: ${res.statusCode} - ${data || res.statusMessage}`
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
    const { projectId, projectName, suiteName } = this.getConfig();

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
  }

  /**
   * Sync an existing BrowserStack TM test case for the given bundle.
   * If no test case is linked yet, this falls back to ensureTestCaseForBundle.
   */
  async syncTestCaseForBundle(bundleDir: string): Promise<void> {
    const { projectId, projectName, suiteName } = this.getConfig();
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
    await this.createOrUpdateTestCase(payload);
    // We keep the existing tmTestCaseId and URL; no need to rewrite meta
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
      buildId: undefined,
    };

    await this.publishTestRun(browserstack.tmTestCaseId, testRun, {
      sessionId: result.bsSessionId,
      buildId: undefined,
      dashboardUrl: result.bsSessionUrl,
    });
  }
}

