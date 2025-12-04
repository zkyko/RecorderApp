import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';

/**
 * BrowserStack Automate Service
 * Handles interactions with BrowserStack Automate API
 */
export class BrowserStackAutomateService {
  private configManager: ConfigManager;
  private baseUrl = 'https://api.browserstack.com/automate';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Get BrowserStack Automate configuration
   * Hardcoded defaults for organization credentials
   */
  private getConfig(): {
    username: string;
    accessKey: string;
    apiToken: string;
  } {
    // Hardcoded defaults for BrowserStack Automate
    const defaultUsername = 'nbhandari_KMkNq9';
    const defaultAccessKey = '1tnaMGT6bqxfiTNX9zd7';
    
    // Read BrowserStack config from settings (if available)
    const config = this.configManager.getConfig();
    const username = (config as any).browserstackUsername || defaultUsername;
    const accessKey = (config as any).browserstackAccessKey || defaultAccessKey;
    
    // BrowserStack Automate uses username:accessKey for Basic Auth
    const apiToken = `${username}:${accessKey}`;

    return {
      username,
      accessKey,
      apiToken,
    };
  }

  /**
   * Get plan details
   * GET /automate/plan.json
   */
  async getPlan(): Promise<{
    automatePlan: string;
    parallelSessionsRunning: number;
    teamParallelSessionsMaxAllowed: number;
    parallelSessionsMaxAllowed: number;
    queuedSessions: number;
    queuedSessionsMaxAllowed: number;
  }> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/plan.json`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      return {
        automatePlan: response.automate_plan || '',
        parallelSessionsRunning: response.parallel_sessions_running || 0,
        teamParallelSessionsMaxAllowed: response.team_parallel_sessions_max_allowed || 0,
        parallelSessionsMaxAllowed: response.parallel_sessions_max_allowed || 0,
        queuedSessions: response.queued_sessions || 0,
        queuedSessionsMaxAllowed: response.queued_sessions_max_allowed || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to get plan details: ${error.message}`);
    }
  }

  /**
   * Get browser list
   * GET /automate/browsers.json
   */
  async getBrowsers(): Promise<Array<{
    os: string;
    osVersion: string;
    browser: string;
    device: string | null;
    browserVersion: string | null;
    realMobile: boolean | null;
  }>> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/browsers.json`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      return (response || []).map((browser: any) => ({
        os: browser.os || '',
        osVersion: browser.os_version || '',
        browser: browser.browser || '',
        device: browser.device || null,
        browserVersion: browser.browser_version || null,
        realMobile: browser.real_mobile || null,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get browsers: ${error.message}`);
    }
  }

  /**
   * Get project list
   * GET /automate/projects.json
   */
  async getProjects(): Promise<Array<{
    id: number;
    name: string;
    groupId: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    subGroupId: number;
  }>> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/projects.json`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      return (response || []).map((project: any) => ({
        id: project.id || 0,
        name: project.name || '',
        groupId: project.group_id || 0,
        userId: project.user_id || 0,
        createdAt: project.created_at || '',
        updatedAt: project.updated_at || '',
        subGroupId: project.sub_group_id || 0,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }

  /**
   * Get project details
   * GET /automate/projects/{project_id}.json
   */
  async getProject(projectId: number): Promise<{
    id: number;
    name: string;
    groupId: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    subGroupId: number;
    builds: Array<{
      id: number;
      name: string;
      duration: number;
      status: string;
      tags: string | null;
      groupId: number;
      userId: number;
      automationProjectId: number;
      createdAt: string;
      updatedAt: string;
      hashedId: string;
      delta: boolean;
      subGroupId: number;
      framework: string;
      testData: Record<string, any>;
    }>;
  }> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/projects/${projectId}.json`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      const project = response.project || {};
      
      return {
        id: project.id || projectId,
        name: project.name || '',
        groupId: project.group_id || 0,
        userId: project.user_id || 0,
        createdAt: project.created_at || '',
        updatedAt: project.updated_at || '',
        subGroupId: project.sub_group_id || 0,
        builds: (project.builds || []).map((build: any) => ({
          id: build.id || 0,
          name: build.name || '',
          duration: build.duration || 0,
          status: build.status || '',
          tags: build.tags || null,
          groupId: build.group_id || 0,
          userId: build.user_id || 0,
          automationProjectId: build.automation_project_id || 0,
          createdAt: build.created_at || '',
          updatedAt: build.updated_at || '',
          hashedId: build.hashed_id || '',
          delta: build.delta || false,
          subGroupId: build.sub_group_id || 0,
          framework: build.framework || '',
          testData: build.test_data || {},
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * Get build list
   * GET /automate/builds.json
   */
  async getBuilds(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    projectId?: number;
  }): Promise<Array<{
    name: string;
    hashedId: string;
    duration: number;
    status: string;
    buildTag: string | null;
    publicUrl: string;
  }>> {
    try {
      const { apiToken } = this.getConfig();
      let url = `${this.baseUrl}/builds.json`;
      
      const params: string[] = [];
      if (options?.limit) params.push(`limit=${options.limit}`);
      if (options?.offset) params.push(`offset=${options.offset}`);
      if (options?.status) params.push(`status=${options.status}`);
      if (options?.projectId) params.push(`projectId=${options.projectId}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      return (response || []).map((item: any) => {
        const build = item.automation_build || {};
        return {
          name: build.name || '',
          hashedId: build.hashed_id || '',
          duration: build.duration || 0,
          status: build.status || '',
          buildTag: build.build_tag || null,
          publicUrl: build.public_url || '',
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to get builds: ${error.message}`);
    }
  }

  /**
   * Get build details
   * GET /automate/builds/{build_id}/sessions.json
   */
  async getBuildSessions(buildId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Array<{
    name: string;
    duration: number;
    os: string;
    osVersion: string;
    browserVersion: string | null;
    browser: string | null;
    device: string | null;
    status: string;
    hashedId: string;
    reason: string;
    buildName: string;
    projectName: string;
    testPriority: string | null;
    logs: string;
    browserUrl: string;
    publicUrl: string;
    appiumLogsUrl: string;
    videoUrl: string;
    browserConsoleLogsUrl: string;
    harLogsUrl: string;
    seleniumLogsUrl: string;
    seleniumTelemetryLogsUrl?: string;
  }>> {
    try {
      const { apiToken } = this.getConfig();
      let url = `${this.baseUrl}/builds/${buildId}/sessions.json`;
      
      const params: string[] = [];
      if (options?.limit) params.push(`limit=${options.limit}`);
      if (options?.offset) params.push(`offset=${options.offset}`);
      if (options?.status) params.push(`status=${options.status}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await this.makeRequest('GET', url, apiToken);
      
      return (response || []).map((item: any) => {
        const session = item.automation_session || {};
        return {
          name: session.name || '',
          duration: session.duration || 0,
          os: session.os || '',
          osVersion: session.os_version || '',
          browserVersion: session.browser_version || null,
          browser: session.browser || null,
          device: session.device || null,
          status: session.status || '',
          hashedId: session.hashed_id || '',
          reason: session.reason || '',
          buildName: session.build_name || '',
          projectName: session.project_name || '',
          testPriority: session.test_priority || null,
          logs: session.logs || '',
          browserUrl: session.browser_url || '',
          publicUrl: session.public_url || '',
          appiumLogsUrl: session.appium_logs_url || '',
          videoUrl: session.video_url || '',
          browserConsoleLogsUrl: session.browser_console_logs_url || '',
          harLogsUrl: session.har_logs_url || '',
          seleniumLogsUrl: session.selenium_logs_url || '',
          seleniumTelemetryLogsUrl: session.selenium_telemetry_logs_url,
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to get build sessions: ${error.message}`);
    }
  }

  /**
   * Get session details
   * GET /automate/sessions/{session_id}.json
   */
  async getSession(sessionId: string): Promise<{
    name: string;
    duration: number;
    os: string;
    osVersion: string;
    browserVersion: string | null;
    browser: string | null;
    device: string | null;
    status: string;
    hashedId: string;
    reason: string;
    buildName: string;
    projectName: string;
    testPriority: string | null;
    logs: string;
    browserstackStatus: string;
    createdAt: string;
    browserUrl: string;
    publicUrl: string;
    appiumLogsUrl: string;
    videoUrl: string;
    browserConsoleLogsUrl: string;
    harLogsUrl: string;
    seleniumLogsUrl: string;
    seleniumTelemetryLogsUrl?: string;
  }> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/sessions/${sessionId}.json`;
      
      const response = await this.makeRequest('GET', url, apiToken);
      const session = response.automation_session || {};
      
      return {
        name: session.name || '',
        duration: session.duration || 0,
        os: session.os || '',
        osVersion: session.os_version || '',
        browserVersion: session.browser_version || null,
        browser: session.browser || null,
        device: session.device || null,
        status: session.status || '',
        hashedId: session.hashed_id || sessionId,
        reason: session.reason || '',
        buildName: session.build_name || '',
        projectName: session.project_name || '',
        testPriority: session.test_priority || null,
        logs: session.logs || '',
        browserstackStatus: session.browserstack_status || '',
        createdAt: session.created_at || '',
        browserUrl: session.browser_url || '',
        publicUrl: session.public_url || '',
        appiumLogsUrl: session.appium_logs_url || '',
        videoUrl: session.video_url || '',
        browserConsoleLogsUrl: session.browser_console_logs_url || '',
        harLogsUrl: session.har_logs_url || '',
        seleniumLogsUrl: session.selenium_logs_url || '',
        seleniumTelemetryLogsUrl: session.selenium_telemetry_logs_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  /**
   * Set test status
   * PUT /automate/sessions/{session_id}.json
   */
  async setTestStatus(sessionId: string, status: 'passed' | 'failed', reason?: string): Promise<{
    name: string;
    duration: number;
    status: string;
    hashedId: string;
    reason: string;
  }> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/sessions/${sessionId}.json`;
      
      const payload: any = { status };
      if (reason) {
        payload.reason = reason;
      }
      
      const response = await this.makeRequest('PUT', url, apiToken, payload);
      const session = response.automation_session || {};
      
      return {
        name: session.name || '',
        duration: session.duration || 0,
        status: session.status || '',
        hashedId: session.hashed_id || sessionId,
        reason: session.reason || '',
      };
    } catch (error: any) {
      throw new Error(`Failed to set test status: ${error.message}`);
    }
  }

  /**
   * Update session name
   * PUT /automate/sessions/{session_id}.json
   */
  async updateSessionName(sessionId: string, name: string): Promise<{
    name: string;
    duration: number;
    status: string;
    hashedId: string;
  }> {
    try {
      const { apiToken } = this.getConfig();
      const url = `${this.baseUrl}/sessions/${sessionId}.json`;
      
      const payload = { name };
      const response = await this.makeRequest('PUT', url, apiToken, payload);
      const session = response.automation_session || {};
      
      return {
        name: session.name || name,
        duration: session.duration || 0,
        status: session.status || '',
        hashedId: session.hashed_id || sessionId,
      };
    } catch (error: any) {
      throw new Error(`Failed to update session name: ${error.message}`);
    }
  }

  /**
   * Make HTTP request to BrowserStack Automate API
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

    // BrowserStack Automate uses HTTP Basic Auth with username:accessKey format
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
                  errorMessage = data.substring(0, 200);
                }
              }
              
              console.error('[BrowserStackAutomate] API error response:', {
                statusCode: res.statusCode,
                error: errorMessage,
                data: data?.substring(0, 500),
              });
              
              reject(
                new Error(
                  `BrowserStack Automate API error: ${res.statusCode} - ${errorMessage}`
                )
              );
            }
          } catch (error: any) {
            reject(new Error(`Failed to parse BrowserStack Automate response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`BrowserStack Automate API request failed: ${error.message}`));
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

