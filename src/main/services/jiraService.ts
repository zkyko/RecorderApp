import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';
import { app } from 'electron';
import { ExecutionContext } from '../../types/execution-context';
import { TestRunMeta } from '../../types/v1.5';
import { generateFingerprint, generateSearchJQL, extractFingerprintFromIssue } from './jira/DefectFingerprint';
import { DefectTemplateBuilder } from './jira/DefectTemplateBuilder';

interface JiraField {
  id: string;
  key: string;
  name: string;
  schema: {
    type: string;
    custom?: string;
    customId?: number;
  };
}

interface JiraFieldSchema {
  fields: JiraField[];
}

export interface JiraFieldMeta {
  id: string;
  key: string;
  name: string;
  required: boolean;
  schema?: any;
  allowedValues?: any[];
}

interface DefectAttachments {
  screenshotPath?: string;
  tracePath?: string;
  playwrightReportPath?: string;
  videoPath?: string;
  screenshotPaths?: string[]; // Multiple screenshots
}

interface DefectTestMeta {
  workspacePath: string;
  workspaceId?: string;
  testName: string;
  module?: string;
  id?: string;
}

interface FailureArtifactData {
  errorMessage?: string;
  stackTrace?: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  duration?: number;
  retry?: number;
  timestamp?: string;
  failedLocator?: {
    locator: string;
    type: string;
    locatorKey: string;
  };
  assertionFailure?: {
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
  };
}

export interface DefectPayload {
  projectKey?: string;
  summary: string;
  description?: string;
  issueType?: string;
  labels?: string[];
  priority?: string;
  attachments?: DefectAttachments;
  testMeta: DefectTestMeta;
  failureArtifact?: FailureArtifactData;
  execution?: ExecutionContext; // Provider-agnostic execution context (replaces environment + links)
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
}

/**
 * Jira Service for creating issues and managing defects.
 * 
 * The JiraService provides integration with Jira for:
 * - Creating defect issues from failed test runs
 * - Fetching field schemas and metadata
 * - Uploading attachments (screenshots, traces, reports)
 * - Searching for duplicate defects using fingerprints
 * - Generating defect descriptions with test context
 * 
 * @remarks
 * Uses JiraRestAPI.json as source of truth for field schemas.
 * Supports both Jira Cloud and Jira Server/Data Center via REST API.
 * 
 * @example
 * ```typescript
 * const jiraService = new JiraService(configManager);
 * const issue = await jiraService.createDefect(defectPayload);
 * ```
 */
export class JiraService {
  private configManager: ConfigManager;
  private fieldSchema: JiraFieldSchema | null = null;
  private fieldMetaCache: Map<string, { fields: JiraFieldMeta[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.loadFieldSchema();
  }

  /**
   * Load field schema from JiraRestAPI.json
   */
  private loadFieldSchema(): void {
    try {
      // Try multiple possible locations for JiraRestAPI.json
      const possiblePaths = [
        path.join(process.cwd(), 'JiraRestAPI.json'),
        path.join(app.getAppPath(), 'JiraRestAPI.json'),
        path.join(__dirname, '..', '..', 'JiraRestAPI.json'),
      ];

      for (const schemaPath of possiblePaths) {
        if (fs.existsSync(schemaPath)) {
          const content = fs.readFileSync(schemaPath, 'utf-8');
          this.fieldSchema = { fields: JSON.parse(content) };
          console.log('[JiraService] Loaded field schema from:', schemaPath);
          return;
        }
      }

      console.warn('[JiraService] JiraRestAPI.json not found, field schema will be unavailable');
    } catch (error) {
      console.error('[JiraService] Failed to load field schema:', error);
    }
  }

  /**
   * Get field schema for a specific field ID
   */
  getFieldSchema(fieldId: string): JiraField | null {
    if (!this.fieldSchema) {
      return null;
    }

    return this.fieldSchema.fields.find((f) => f.id === fieldId || f.key === fieldId) || null;
  }

  /**
   * Load workspace-level Jira settings from workspace-settings.json
   */
  private loadWorkspaceJiraConfig(workspacePath?: string): {
    projectKey?: string;
    issueType?: string;
    labels?: string[];
  } {
    if (!workspacePath) {
      return {};
    }
    
    const settingsPath = path.join(workspacePath, 'workspace-settings.json');
    if (!fs.existsSync(settingsPath)) {
      return {};
    }
    
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return {
        projectKey: settings.jira?.projectKey,
        issueType: settings.jira?.issueType,
        labels: settings.jira?.labels,
      };
    } catch (error) {
      console.warn('[JiraService] Failed to load workspace Jira settings:', error);
      return {};
    }
  }

  /**
   * Get Jira configuration from settings (workspace > global > defaults)
   */
  private getConfig(workspacePath?: string): {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
    issueType?: string;
    labels?: string[];
  } {
    // Read Jira-specific values from dedicated config API
    const jiraConfig = this.configManager.getJiraConfig();
    const workspaceConfig = this.loadWorkspaceJiraConfig(workspacePath);

    // Merge strategy: workspace fills gaps, global provides defaults
    // All values must be configured - no hardcoded defaults
    const baseUrl = jiraConfig.baseUrl || '';
    const email = jiraConfig.email || '';
    const apiToken = jiraConfig.apiToken || '';
    const projectKey = workspaceConfig.projectKey || jiraConfig.projectKey || '';
    const issueType = workspaceConfig.issueType || 'Bug';
    const labels = [
      ...(workspaceConfig.labels || []),
    ];

    if (!baseUrl || !email || !apiToken || !projectKey) {
      throw new Error('Jira configuration incomplete. Please configure base URL, email, API token, and project key in Settings → Jira.');
    }

    return {
      baseUrl,
      email,
      apiToken,
      projectKey,
      issueType,
      labels: labels.length > 0 ? labels : undefined,
    };
  }

  /**
   * Get comprehensive diagnostics for Jira connection
   */
  async getDiagnostics(workspacePath?: string): Promise<{
    authenticatedUser?: string;
    accessibleProjectsCount: number;
    currentProjectValid: boolean;
    currentProjectName?: string;
    issueTypes: Array<{ id: string; name: string }>;
    requiredFields: Array<{ id: string; name: string; required: boolean }>;
    error?: string;
  }> {
    try {
      const { baseUrl, email, apiToken, projectKey } = this.getConfig(workspacePath);
      
      // Get authenticated user
      let authenticatedUser: string | undefined;
      try {
        const userUrl = `${baseUrl}/rest/api/3/myself`;
        const user = await this.makeRequest('GET', userUrl, email, apiToken);
        authenticatedUser = user.displayName || user.emailAddress || user.accountId;
      } catch {
        // Ignore user fetch errors
      }
      
      // Get accessible projects
      const projects = await this.listAccessibleProjects();
      
      // Check if current project is valid
      let currentProjectValid = false;
      let currentProjectName: string | undefined;
      try {
        const projectUrl = `${baseUrl}/rest/api/3/project/${projectKey}`;
        const project = await this.makeRequest('GET', projectUrl, email, apiToken);
        currentProjectValid = true;
        currentProjectName = project.name;
      } catch {
        currentProjectValid = false;
      }
      
      // Get issue types
      const issueTypes = await this.getIssueTypes(projectKey);
      
      // Get required fields for Bug issue type
      const requiredFields: Array<{ id: string; name: string; required: boolean }> = [];
      try {
        const fieldMeta = await this.getCreateMeta(projectKey, 'Bug');
        requiredFields.push(...fieldMeta
          .filter(f => f.required)
          .map(f => ({ id: f.id, name: f.name, required: true }))
        );
      } catch {
        // Ignore field metadata errors
      }
      
      return {
        authenticatedUser,
        accessibleProjectsCount: projects.length,
        currentProjectValid,
        currentProjectName,
        issueTypes,
        requiredFields,
      };
    } catch (error: any) {
      return {
        authenticatedUser: undefined,
        accessibleProjectsCount: 0,
        currentProjectValid: false,
        issueTypes: [],
        requiredFields: [],
        error: error.message || 'Failed to get diagnostics',
      };
    }
  }

  /**
   * Test connection to Jira
   */
  async testConnection(workspacePath?: string): Promise<{ success: boolean; projectName?: string; error?: string }> {
    try {
      const { baseUrl, email, apiToken, projectKey } = this.getConfig(workspacePath);
      const url = `${baseUrl}/rest/api/3/project/${projectKey}`;

      const response = await this.makeRequest('GET', url, email, apiToken);

      return {
        success: true,
        projectName: response.name || projectKey,
      };
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to connect to Jira';
      
      if (errorMessage.includes('No project could be found') || errorMessage.includes('404')) {
        errorMessage += '\n\nPossible causes:\n' +
          '1. The project key "QST" may be incorrect\n' +
          '2. The API token may not have permission to access this project\n' +
          '3. The API token may be associated with a different Jira account\n\n' +
          'To fix this:\n' +
          '1. Verify the project key in Jira (Settings → Projects → QST)\n' +
          '2. Ensure the API token is created for an account that has access to QST\n' +
          '3. Check project permissions in Jira (Project Settings → Permissions)\n' +
          '4. Create a new API token at: https://id.atlassian.com/manage-profile/security/api-tokens';
      } else if (errorMessage.includes('permission')) {
        errorMessage += '\n\nThe API token does not have sufficient permissions.\n\n' +
          'Required permissions:\n' +
          '- Browse Projects\n' +
          '- Create Issues\n' +
          '- Edit Issues\n\n' +
          'To fix this:\n' +
          '1. Ask a Jira administrator to grant permissions to your account\n' +
          '2. Or create a new API token for an account with the right permissions';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * List projects accessible to the current user
   * Useful for debugging permission issues
   */
  async listAccessibleProjects(): Promise<Array<{ key: string; name: string; id: string }>> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/project?maxResults=100`;

      const response = await this.makeRequest('GET', url, email, apiToken);
      
      // Response can be an array or an object with a values property
      const projects = Array.isArray(response) ? response : (response.values || []);
      
      return projects.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id,
      }));
    } catch (error: any) {
      console.error('[JiraService] Failed to list projects:', error.message);
      return [];
    }
  }

  /**
   * Search for JIRA issues using JQL (Jira Query Language)
   */
  async searchIssues(jql?: string, maxResults: number = 50, startAt: number = 0, nextPageToken?: string): Promise<{
    issues: Array<{
      key: string;
      summary: string;
      status: string;
      issueType: string;
      assignee?: string;
      created: string;
      updated: string;
      url: string;
    }>;
    total: number;
    startAt: number;
    maxResults: number;
    nextPageToken?: string;
  }> {
    try {
      const { baseUrl, email, apiToken, projectKey } = this.getConfig();
      
      // Default JQL: get all issues from the project, ordered by most recent
      // Use project key without quotes for Jira Cloud
      // IMPORTANT: New API requires bounded queries - add a time bound to avoid 400 errors
      const defaultJql = `project = ${projectKey} ORDER BY created DESC`;
      const query = jql || defaultJql;
      
      // Use the new /rest/api/3/search/jql endpoint (replaces deprecated /rest/api/3/search)
      // This endpoint requires a two-step approach:
      // Step 1: Get issue IDs/keys via /rest/api/3/search/jql
      // Step 2: Get full issue details via /rest/api/3/issue/bulkfetch
      const searchUrl = `${baseUrl}/rest/api/3/search/jql`;
      
      // Step 1: Get issue IDs/keys (new API only returns IDs by default)
      const searchPayload: any = {
        jql: query,
        maxResults: Math.min(maxResults, 100), // API may have limits
      };
      
      // Use nextPageToken if provided (new pagination method replaces startAt)
      if (nextPageToken) {
        searchPayload.nextPageToken = nextPageToken;
      }
      
      // Log request for debugging
      try {
        console.log('[JiraService] Step 1: Searching with POST to:', searchUrl);
        console.log('[JiraService] JQL query:', query);
        console.log('[JiraService] Payload:', JSON.stringify(searchPayload, null, 2));
      } catch {
        // Ignore logging errors
      }
      
      // Step 1: Get issue IDs/keys from search endpoint
      const searchResponse = await this.makeRequest('POST', searchUrl, email, apiToken, searchPayload);
      
      // Log search response for debugging
      try {
        console.log('[JiraService] Step 1 response:', JSON.stringify(searchResponse, null, 2));
        console.log('[JiraService] Response issues count:', searchResponse.issues?.length || 0);
        if (searchResponse.issues && searchResponse.issues.length > 0) {
          console.log('[JiraService] First issue from search:', JSON.stringify(searchResponse.issues[0], null, 2));
        } else {
          // If no issues found, test permissions by fetching a specific issue
          console.log('[JiraService] No issues found in search. Testing permissions by fetching QST-1 directly...');
          try {
            const testIssueUrl = `${baseUrl}/rest/api/3/issue/QST-1`;
            const testIssue = await this.makeRequest('GET', testIssueUrl, email, apiToken);
            console.log('[JiraService] Successfully fetched QST-1:', testIssue.key);
            console.log('[JiraService] This suggests a JQL query issue, not permissions');
          } catch (testError: any) {
            console.log('[JiraService] Failed to fetch QST-1:', testError.message);
            console.log('[JiraService] This suggests a permissions issue');
          }
        }
      } catch {
        // Ignore logging errors
      }
      
      // Extract issue keys/IDs from search response
      const issueKeys = (searchResponse.issues || []).map((issue: any) => issue.key || issue.id).filter(Boolean);
      
      if (issueKeys.length === 0) {
        // No issues found
        return {
          issues: [],
          total: 0,
          startAt: startAt,
          maxResults: maxResults,
          nextPageToken: searchResponse.nextPageToken,
        };
      }
      
      // Step 2: Get full issue details using bulk fetch API
      const fields = ['summary', 'status', 'issuetype', 'assignee', 'created', 'updated', 'priority', 'labels'];
      const bulkFetchUrl = `${baseUrl}/rest/api/3/issue/bulkfetch`;
      const bulkFetchPayload = {
        issueIdsOrKeys: issueKeys,
        fields: fields,
      };
      
      try {
        console.log('[JiraService] Step 2: Fetching details for', issueKeys.length, 'issues via bulk fetch');
        console.log('[JiraService] Bulk fetch URL:', bulkFetchUrl);
      } catch {
        // Ignore logging errors
      }
      
      const bulkResponse = await this.makeRequest('POST', bulkFetchUrl, email, apiToken, bulkFetchPayload);
      
      // Log bulk response for debugging
      try {
        console.log('[JiraService] Step 2 response (bulk fetch):', JSON.stringify(bulkResponse, null, 2));
      } catch {
        // Ignore logging errors
      }
      
      // Bulk API returns issues in an array or object with issues property
      const bulkIssues = Array.isArray(bulkResponse) ? bulkResponse : (bulkResponse.issues || bulkResponse.values || []);
      
      // Map response to our format
      const issues = bulkIssues.map((issue: any) => {
        const issueFields = issue.fields || {};
        
        return {
          key: issue.key,
          summary: issueFields.summary || 'No summary',
          status: issueFields.status?.name || 'Unknown',
          issueType: issueFields.issuetype?.name || 'Unknown',
          assignee: issueFields.assignee?.displayName || issueFields.assignee?.emailAddress || 'Unassigned',
          created: issueFields.created || '',
          updated: issueFields.updated || '',
          url: `${baseUrl}/browse/${issue.key}`,
        };
      });
      
      // New API doesn't return exact total count, use approximate
      // We can use the count of issues returned and indicate if there are more pages
      const returnedCount = issues.length;
      const hasMorePages = !!searchResponse.nextPageToken;
      
      return {
        issues,
        total: hasMorePages ? returnedCount + 1 : returnedCount, // Approximate total
        startAt: startAt, // Keep for backward compatibility
        maxResults: maxResults,
        nextPageToken: searchResponse.nextPageToken, // New pagination token
      };
    } catch (error: any) {
      throw new Error(`Failed to search JIRA issues: ${error.message}`);
    }
  }

  /**
   * Get a single JIRA issue by key
   */
  async getIssue(issueKey: string): Promise<{
    key: string;
    summary: string;
    description?: string;
    status: string;
    issueType: string;
    priority?: string;
    assignee?: string;
    reporter?: string;
    created: string;
    updated: string;
    labels?: string[];
    url: string;
    fields: Record<string, any>;
  }> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
      
      const response = await this.makeRequest('GET', url, email, apiToken);
      
      return {
        key: response.key,
        summary: response.fields?.summary || 'No summary',
        description: response.fields?.description?.content?.[0]?.content?.[0]?.text || '',
        status: response.fields?.status?.name || 'Unknown',
        issueType: response.fields?.issuetype?.name || 'Unknown',
        priority: response.fields?.priority?.name,
        assignee: response.fields?.assignee?.displayName || response.fields?.assignee?.emailAddress || 'Unassigned',
        reporter: response.fields?.reporter?.displayName || response.fields?.reporter?.emailAddress,
        created: response.fields?.created || '',
        updated: response.fields?.updated || '',
        labels: response.fields?.labels || [],
        url: `${baseUrl}/browse/${response.key}`,
        fields: response.fields || {},
      };
    } catch (error: any) {
      throw new Error(`Failed to get JIRA issue: ${error.message}`);
    }
  }

  /**
   * Get comments for a JIRA issue
   */
  async getComments(issueKey: string): Promise<Array<{
    id: string;
    author: string;
    body: string;
    created: string;
    updated: string;
  }>> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/comment`;
      
      const response = await this.makeRequest('GET', url, email, apiToken);
      
      return (response.comments || []).map((comment: any) => ({
        id: comment.id,
        author: comment.author?.displayName || comment.author?.emailAddress || 'Unknown',
        body: comment.body?.content?.[0]?.content?.[0]?.text || comment.body || '',
        created: comment.created || '',
        updated: comment.updated || comment.created || '',
      }));
    } catch (error: any) {
      throw new Error(`Failed to get comments: ${error.message}`);
    }
  }

  /**
   * Add a comment to a JIRA issue
   */
  async addComment(issueKey: string, comment: string): Promise<{ id: string; url: string }> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/comment`;
      
      // JIRA API v3 uses Atlassian Document Format (ADF) for comments
      const payload = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      };
      
      const response = await this.makeRequest('POST', url, email, apiToken, payload);
      
      return {
        id: response.id,
        url: `${baseUrl}/browse/${issueKey}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Get available transitions for a JIRA issue
   */
  async getTransitions(issueKey: string): Promise<Array<{ id: string; name: string; to: { id: string; name: string } }>> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`;
      
      const response = await this.makeRequest('GET', url, email, apiToken);
      
      return (response.transitions || []).map((transition: any) => ({
        id: transition.id,
        name: transition.name,
        to: {
          id: transition.to?.id || '',
          name: transition.to?.name || transition.name,
        },
      }));
    } catch (error: any) {
      throw new Error(`Failed to get transitions: ${error.message}`);
    }
  }

  /**
   * Transition a JIRA issue (change status)
   */
  async transitionIssue(issueKey: string, transitionId: string, comment?: string): Promise<void> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`;
      
      const payload: any = {
        transition: {
          id: transitionId,
        },
      };
      
      // Add comment if provided
      if (comment) {
        payload.update = {
          comment: [
            {
              add: {
                body: {
                  type: 'doc',
                  version: 1,
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: comment,
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        };
      }
      
      await this.makeRequest('POST', url, email, apiToken, payload);
    } catch (error: any) {
      throw new Error(`Failed to transition issue: ${error.message}`);
    }
  }

  /**
   * Update a JIRA issue
   */
  async updateIssue(issueKey: string, updates: {
    summary?: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
    customFields?: Record<string, any>;
  }): Promise<void> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
      
      const fields: any = {};
      
      if (updates.summary) {
        fields.summary = updates.summary;
      }
      
      if (updates.description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description,
                },
              ],
            },
          ],
        };
      }
      
      if (updates.assignee) {
        fields.assignee = { accountId: updates.assignee };
      }
      
      if (updates.priority) {
        fields.priority = { name: updates.priority };
      }
      
      if (updates.labels) {
        fields.labels = updates.labels;
      }
      
      // Add custom fields
      if (updates.customFields) {
        for (const [fieldId, value] of Object.entries(updates.customFields)) {
          const fieldSchema = this.getFieldSchema(fieldId);
          if (fieldSchema) {
            fields[fieldId] = this.formatFieldValue(value, fieldSchema);
          } else {
            fields[fieldId] = value;
          }
        }
      }
      
      const payload = {
        fields,
      };
      
      await this.makeRequest('PUT', url, email, apiToken, payload);
    } catch (error: any) {
      throw new Error(`Failed to update issue: ${error.message}`);
    }
  }

  /**
   * Get project information
   */
  async getProject(projectKey?: string): Promise<{
    id: string;
    key: string;
    name: string;
    description?: string;
    lead?: string;
    url: string;
  }> {
    try {
      const { baseUrl, email, apiToken, projectKey: defaultProjectKey } = this.getConfig();
      const key = projectKey || defaultProjectKey;
      const url = `${baseUrl}/rest/api/3/project/${key}`;
      
      const response = await this.makeRequest('GET', url, email, apiToken);
      
      return {
        id: response.id,
        key: response.key,
        name: response.name,
        description: response.description,
        lead: response.lead?.displayName || response.lead?.emailAddress,
        url: `${baseUrl}/browse/${response.key}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * Get available issue types for the project
   */
  async getIssueTypes(projectKey?: string): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const { baseUrl, email, apiToken, projectKey: defaultProjectKey } = this.getConfig();
      const key = projectKey || defaultProjectKey;
      const url = `${baseUrl}/rest/api/3/project/${key}`;

      const project = await this.makeRequest('GET', url, email, apiToken);
      
      // Get issue types from project metadata
      const issueTypesUrl = `${baseUrl}/rest/api/3/project/${key}/statuses`;
      const statuses = await this.makeRequest('GET', issueTypesUrl, email, apiToken);
      
      // Extract unique issue types
      const issueTypeMap = new Map<string, { id: string; name: string }>();
      if (Array.isArray(statuses)) {
        for (const status of statuses) {
          if (status.issueType) {
            issueTypeMap.set(status.issueType.id, {
              id: status.issueType.id,
              name: status.issueType.name,
            });
          }
        }
      }
      
      return Array.from(issueTypeMap.values());
    } catch (error: any) {
      console.warn('[JiraService] Failed to fetch issue types:', error.message);
      // Return common defaults
      return [
        { id: '10004', name: 'Bug' },
        { id: '10003', name: 'Task' },
        { id: '10001', name: 'Story' },
      ];
    }
  }

  /**
   * Get create metadata for a project and issue type
   * Returns normalized field metadata including required fields and allowed values
   * Uses caching to reduce API calls
   */
  async getCreateMeta(projectKey: string, issueType: string): Promise<JiraFieldMeta[]> {
    const cacheKey = `${projectKey}:${issueType}`;
    const cached = this.fieldMetaCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.fields;
    }
    
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      // Use issue type name or ID
      const issueTypeParam = issueType.match(/^\d+$/) ? `issuetypeIds=${issueType}` : `issuetypeNames=${encodeURIComponent(issueType)}`;
      const url = `${baseUrl}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&${issueTypeParam}&expand=projects.issuetypes.fields`;
      
      const metadata = await this.makeRequest('GET', url, email, apiToken);
      
      if (!metadata.projects || metadata.projects.length === 0) {
        return [];
      }
      
      const project = metadata.projects[0];
      if (!project.issuetypes || project.issuetypes.length === 0) {
        return [];
      }
      
      const issueTypeData = project.issuetypes[0];
      if (!issueTypeData.fields) {
        return [];
      }
      
      // Normalize fields to JiraFieldMeta format
      const fields: JiraFieldMeta[] = [];
      for (const [fieldId, fieldData] of Object.entries(issueTypeData.fields)) {
        const field = fieldData as any;
        const fieldMeta: JiraFieldMeta = {
          id: fieldId,
          key: field.key || fieldId,
          name: field.name || fieldId,
          required: field.required || false,
          schema: field.schema,
          allowedValues: field.allowedValues || (field.schema?.type === 'option' ? [] : undefined),
        };
        fields.push(fieldMeta);
      }
      
      // Cache the result
      this.fieldMetaCache.set(cacheKey, {
        fields,
        timestamp: Date.now(),
      });
      
      return fields;
    } catch (error: any) {
      console.warn('[JiraService] Failed to fetch create metadata:', error.message);
      return [];
    }
  }

  /**
   * Validate payload against field metadata
   * Returns validation result with user-friendly error messages
   */
  async validatePayload(payload: any, fieldMeta: JiraFieldMeta[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check required fields
    for (const field of fieldMeta) {
      if (field.required) {
        const fieldValue = payload.fields?.[field.id] || payload.fields?.[field.key];
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          errors.push(`Required field "${field.name}" (${field.id}) is missing`);
        }
      }
    }
    
    // Validate enumerated values
    for (const field of fieldMeta) {
      if (field.allowedValues && field.allowedValues.length > 0) {
        const fieldValue = payload.fields?.[field.id] || payload.fields?.[field.key];
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          // Check if value is in allowed values
          const valueStr = typeof fieldValue === 'object' ? fieldValue.id || fieldValue.value : String(fieldValue);
          const allowedIds = field.allowedValues.map((v: any) => v.id || v.value || String(v));
          const allowedNames = field.allowedValues.map((v: any) => v.name || String(v));
          
          if (!allowedIds.includes(valueStr) && !allowedNames.includes(valueStr)) {
            const allowedList = field.allowedValues.map((v: any) => v.name || v.value || String(v)).join(', ');
            errors.push(`Field "${field.name}" has invalid value. Allowed values: ${allowedList}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a Jira issue
   */
  async createIssue(issueData: {
    summary: string;
    description: string;
    issueType?: string;
    customFields?: Record<string, any>;
    labels?: string[];
  }): Promise<{ issueKey: string; issueUrl: string }> {
    const { baseUrl, email, apiToken, projectKey } = this.getConfig();
    const url = `${baseUrl}/rest/api/3/issue`;
    const issueTypeName = issueData.issueType || 'Bug';

    // Get field metadata for validation and formatting
    const fieldMeta = await this.getCreateMeta(projectKey, issueTypeName);
    
    // Find issue type ID from metadata
    let issueTypeId: string | undefined;
    let labelsAvailable = false;
    if (fieldMeta.length > 0) {
      // Find issuetype field to get the ID
      const issueTypeField = fieldMeta.find(f => f.id === 'issuetype' || f.key === 'issuetype');
      if (issueTypeField && issueTypeField.allowedValues) {
        const matchingType = issueTypeField.allowedValues.find((v: any) => 
          v.name === issueTypeName || v.id === issueTypeName
        );
        if (matchingType) {
          issueTypeId = matchingType.id || issueTypeName;
        }
      }
      
      // Check if labels field is available
      const labelsField = fieldMeta.find(f => f.id === 'labels' || f.key === 'labels');
      labelsAvailable = !!labelsField;
    }

    // Build issue payload
    const fields: any = {
      project: {
        key: projectKey,
      },
      summary: issueData.summary,
      description: typeof issueData.description === 'string' && issueData.description.startsWith('{')
        ? JSON.parse(issueData.description) // ADF document already provided
        : {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: issueData.description,
                  },
                ],
              },
            ],
          },
      issuetype: issueTypeId 
        ? { id: issueTypeId }
        : { name: issueTypeName },
    };

    // Add labels if provided and available on the create screen
    if (issueData.labels && issueData.labels.length > 0 && labelsAvailable) {
      fields.labels = issueData.labels;
    } else if (issueData.labels && issueData.labels.length > 0) {
      console.warn('[JiraService] Labels field is not available on the create screen, skipping labels');
    }

    // Add custom fields with proper formatting based on schema
    // Prefer live metadata schema, fallback to JiraRestAPI.json, then safe defaults
    if (issueData.customFields) {
      for (const [fieldId, value] of Object.entries(issueData.customFields)) {
        // Try to find field in metadata first
        const metaField = fieldMeta.find(f => f.id === fieldId || f.key === fieldId);
        if (metaField && metaField.schema) {
          // Create a JiraField-like object for formatFieldValue
          const fieldForFormatting: JiraField = {
            id: metaField.id,
            key: metaField.key,
            name: metaField.name,
            schema: metaField.schema,
          };
          fields[fieldId] = this.formatFieldValue(value, fieldForFormatting);
        } else {
          // Fallback to JiraRestAPI.json schema
          const fieldSchema = this.getFieldSchema(fieldId);
          if (fieldSchema) {
            fields[fieldId] = this.formatFieldValue(value, fieldSchema);
          } else {
            // Safe default: use value as-is
            fields[fieldId] = value;
          }
        }
      }
    }

    const payload = {
      fields,
    };

    // Validate payload before sending
    if (fieldMeta.length > 0) {
      const validation = await this.validatePayload(payload, fieldMeta);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
      }
    }

    // Log payload for debugging (without sensitive data)
    try {
      const debugPayload = { ...payload };
      console.log('[JiraService] Creating issue with payload:', JSON.stringify(debugPayload, null, 2));
    } catch {
      // Ignore logging errors
    }

    try {
      const response = await this.makeRequest('POST', url, email, apiToken, payload);

      return {
        issueKey: response.key,
        issueUrl: `${baseUrl}/browse/${response.key}`,
      };
    } catch (error: any) {
      // If error is about labels field not being available, retry without labels
      if (error.message && error.message.includes('labels') && error.message.includes('cannot be set')) {
        console.warn('[JiraService] Labels field not available, retrying without labels');
        
        // Remove labels from payload and retry
        const fieldsWithoutLabels = { ...fields };
        delete fieldsWithoutLabels.labels;
        const payloadWithoutLabels = { fields: fieldsWithoutLabels };
        
        const response = await this.makeRequest('POST', url, email, apiToken, payloadWithoutLabels);
        
        return {
          issueKey: response.key,
          issueUrl: `${baseUrl}/browse/${response.key}`,
        };
      }
      
      // Re-throw if it's not a labels error
      throw error;
    }
  }

  /**
   * Format field value based on schema type
   */
  private formatFieldValue(value: any, fieldSchema: JiraField): any {
    const schema = fieldSchema.schema;

    // Textarea fields (string type)
    if (schema.type === 'string' && schema.custom?.includes('textarea')) {
      return String(value);
    }

    // Multiselect fields (array type)
    if (schema.type === 'array') {
      // Convert to array of option objects
      if (Array.isArray(value)) {
        return value.map((v) => ({ value: String(v) }));
      }
      return [{ value: String(value) }];
    }

    // Datetime fields
    if (schema.type === 'datetime') {
      // Return ISO 8601 format
      if (value instanceof Date) {
        return value.toISOString();
      }
      return String(value);
    }

    // User picker fields
    if (schema.type === 'user') {
      // Return user account ID object
      return { accountId: String(value) };
    }

    // Default: return as-is
    return value;
  }

  /**
   * Make HTTP request to Jira API
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    urlString: string,
    email: string,
    apiToken: string,
    payload?: any
  ): Promise<any> {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // Jira uses HTTP Basic Auth with email:apiToken
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
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
              const errorData = data ? JSON.parse(data) : {};
              // Jira API v3 returns errors in different formats:
              // - errorMessages: array of strings
              // - errors: object with field-level errors
              // - message: single error message
              let errorMessage = '';
              
              if (errorData.errorMessages && errorData.errorMessages.length > 0) {
                errorMessage = errorData.errorMessages.join('; ');
              }
              
              if (errorData.errors && Object.keys(errorData.errors).length > 0) {
                const fieldErrors = Object.entries(errorData.errors)
                  .map(([field, msg]) => `${field}: ${msg}`)
                  .join('; ');
                errorMessage = errorMessage 
                  ? `${errorMessage}. Field errors: ${fieldErrors}` 
                  : `Field errors: ${fieldErrors}`;
              }
              
              if (!errorMessage && errorData.message) {
                errorMessage = errorData.message;
              }
              
              if (!errorMessage) {
                errorMessage = res.statusMessage || 'Unknown error';
              }
              
              // Log the full error response for debugging
              console.error('[JiraService] API error response:', JSON.stringify(errorData, null, 2));
              
              // Add helpful suggestions for common errors
              if (res.statusCode === 400) {
                if (errorMessage.toLowerCase().includes('issuetype') || errorMessage.toLowerCase().includes('issue type')) {
                  errorMessage += '. Tip: The issue type name must match exactly (case-sensitive). Common types: Bug, Task, Story, Defect.';
                } else if (errorMessage.toLowerCase().includes('field') || errorMessage.toLowerCase().includes('required')) {
                  errorMessage += '. Tip: Some required fields may be missing. Check your Jira project configuration.';
                }
              }
              
              reject(
                new Error(
                  `Jira API error: ${res.statusCode} - ${errorMessage}`
                )
              );
            }
          } catch (error: any) {
            reject(new Error(`Failed to parse Jira response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Jira API request failed: ${error.message}`));
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
   * Load failure artifact from test bundle if not provided
   */
  private loadFailureArtifact(workspacePath: string, testName: string): FailureArtifactData | undefined {
    try {
      const slug = testName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Try new bundle structure first
      let failurePath = path.join(workspacePath, 'tests', 'd365', 'specs', slug, `${slug}_failure.json`);
      
      if (!fs.existsSync(failurePath)) {
        // Try old structure
        failurePath = path.join(workspacePath, 'tests', 'd365', slug, `${slug}_failure.json`);
        if (!fs.existsSync(failurePath)) {
          // Try flat structure
          failurePath = path.join(workspacePath, 'tests', `${slug}_failure.json`);
        }
      }
      
      if (fs.existsSync(failurePath)) {
        const content = fs.readFileSync(failurePath, 'utf-8');
        const artifact = JSON.parse(content);
        return {
          errorMessage: artifact.error?.message,
          stackTrace: artifact.error?.stack,
          location: artifact.error?.location,
          duration: artifact.duration,
          retry: artifact.retry,
          timestamp: artifact.timestamp,
          failedLocator: artifact.failedLocator,
          assertionFailure: artifact.assertionFailure,
        };
      }
    } catch (error: any) {
      console.warn('[JiraService] Failed to load failure artifact:', error.message);
    }
    return undefined;
  }

  /**
   * Find existing defect by fingerprint
   */
  async findExistingDefect(fingerprint: string): Promise<{ issueKey: string; issueUrl: string } | null> {
    try {
      const { baseUrl, projectKey } = this.getConfig();
      const jql = generateSearchJQL(fingerprint, projectKey);
      
      const searchResults = await this.searchIssues(jql, 5);
      
      if (searchResults.issues && searchResults.issues.length > 0) {
        // Return the most recent matching issue
        const issue = searchResults.issues[0];
        return {
          issueKey: issue.key,
          issueUrl: issue.url,
        };
      }
      
      return null;
    } catch (error: any) {
      console.warn('[JiraService] Failed to search for existing defect:', error.message);
      return null;
    }
  }

  /**
   * Update existing defect with new run information
   */
  async updateExistingDefect(issueKey: string, runInfo: DefectPayload): Promise<void> {
    try {
      const { baseUrl } = this.getConfig();
      const execution = runInfo.execution;
      
      // Build comment with new run info
      const commentLines: string[] = [];
      commentLines.push('---');
      commentLines.push('**New Test Run Detected**');
      commentLines.push('');
      if (runInfo.runId) {
        commentLines.push(`Run ID: ${runInfo.runId}`);
      }
      if (runInfo.startedAt) {
        const startDate = new Date(runInfo.startedAt).toLocaleString();
        commentLines.push(`Execution Time: ${startDate}`);
      }
      if (execution) {
        commentLines.push(`Provider: ${execution.provider}`);
        if (execution.browser) {
          commentLines.push(`Browser: ${execution.browser}${execution.browserVersion ? ` ${execution.browserVersion}` : ''}`);
        }
        if (execution.sessionUrl) {
          commentLines.push(`Session: ${execution.sessionUrl}`);
        }
      }
      commentLines.push('');
      commentLines.push('*This is a duplicate of an existing defect. New artifacts have been attached.*');
      
      const comment = commentLines.join('\n');
      await this.addComment(issueKey, comment);
      
      // Upload new attachments if any
      if (runInfo.attachments) {
        await this.uploadAttachments(issueKey, runInfo.attachments);
      }
    } catch (error: any) {
      console.warn('[JiraService] Failed to update existing defect:', error.message);
      // Don't throw - we still want to return the existing issue
    }
  }

  /**
   * Store fingerprint in issue (try label, custom field, then description)
   */
  private async storeFingerprint(issueKey: string, fingerprint: string): Promise<void> {
    try {
      const { baseUrl, email, apiToken } = this.getConfig();
      
      // Extract hash from fingerprint for label
      const fingerprintParts = fingerprint.split('::');
      const errorHash = fingerprintParts[3] || '';
      const labelName = `qa-studio-fingerprint-${errorHash}`;
      
      // Try 1: Add as label (if label length is within limits)
      if (labelName.length <= 255) {
        try {
          const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
          const payload = {
            update: {
              labels: [
                {
                  add: labelName,
                },
              ],
            },
          };
          await this.makeRequest('PUT', url, email, apiToken, payload);
          return; // Success
        } catch (labelError: any) {
          // Labels might not be available, continue to next method
          console.warn('[JiraService] Failed to add fingerprint as label, trying custom field:', labelError.message);
        }
      }
      
      // Try 2: Custom field (if "QA Studio Fingerprint" field exists)
      // This would need to be configured per Jira instance
      // For now, skip and go to fallback
      
      // Try 3: Add to description (fallback)
      try {
        // Get current issue
        const getUrl = `${baseUrl}/rest/api/3/issue/${issueKey}?fields=description`;
        const issue = await this.makeRequest('GET', getUrl, email, apiToken);
        
        // Append fingerprint to description
        const currentDescription = issue.fields?.description || {
          type: 'doc',
          version: 1,
          content: [],
        };
        
        // Add fingerprint line
        const fingerprintNode = {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Fingerprint: ${fingerprint}`,
              marks: [{ type: 'code' }],
            },
          ],
        };
        
        // Ensure content array exists
        if (!currentDescription.content) {
          currentDescription.content = [];
        }
        
        // Add separator and fingerprint
        currentDescription.content.push(
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }],
          },
          fingerprintNode
        );
        
        const updateUrl = `${baseUrl}/rest/api/3/issue/${issueKey}`;
        const updatePayload = {
          fields: {
            description: currentDescription,
          },
        };
        
        await this.makeRequest('PUT', updateUrl, email, apiToken, updatePayload);
      } catch (descError: any) {
        console.warn('[JiraService] Failed to add fingerprint to description:', descError.message);
        // At this point, we've tried all methods - fingerprint won't be stored
        // but the issue was still created, which is acceptable
      }
    } catch (error: any) {
      console.warn('[JiraService] Failed to store fingerprint:', error.message);
      // Non-critical error - issue was created successfully
    }
  }

  /**
   * High-level helper for creating a structured Jira defect from a failed test run.
   * Builds a Markdown-style description, creates the issue, uploads attachments,
   * and updates the corresponding test bundle meta.json with Jira linkage.
   * Includes deduplication logic to prevent duplicate defects.
   */
  async createDefect(payload: DefectPayload): Promise<{ issueKey: string; issueUrl: string }> {
    const meta = payload.testMeta;

    // Load failure artifact if not provided
    const failureArtifact = payload.failureArtifact || this.loadFailureArtifact(meta.workspacePath, meta.testName);
    
    // Generate fingerprint for deduplication
    const errorForFingerprint = failureArtifact?.errorMessage || payload.description || 'Test failed';
    const provider = payload.execution?.provider || 'local';
    const fingerprint = generateFingerprint(meta.workspaceId, meta.testName, errorForFingerprint, provider);
    
    // Check for existing defect
    const existingDefect = await this.findExistingDefect(fingerprint);
    if (existingDefect) {
      // Update existing defect with new run info
      await this.updateExistingDefect(existingDefect.issueKey, payload);
      return existingDefect;
    }

    // Build ADF document using DefectTemplateBuilder
    const templateBuilder = new DefectTemplateBuilder();
    
    // Create a TestRunMeta-like object for the template builder
    const runMetaForTemplate: TestRunMeta = {
      runId: payload.runId || '',
      testName: meta.testName,
      specRelPath: '', // Not needed for template
      status: 'failed',
      startedAt: payload.startedAt || new Date().toISOString(),
      finishedAt: payload.finishedAt,
    };
    
    const adfDocument = templateBuilder.build(
      runMetaForTemplate,
      failureArtifact,
      payload.execution,
      payload.attachments || {},
      meta
    );
    
    // Convert ADF to string for createIssue (which expects ADF format)
    const fullDescription = JSON.stringify(adfDocument);

    // Get config with workspace overrides
    const config = this.getConfig(meta.workspacePath);
    
    const issue = await this.createIssue({
      summary: payload.summary,
      description: fullDescription,
      issueType: payload.issueType || config.issueType || 'Bug',
      labels: [
        'qa-studio',
        meta.workspaceId || '',
        meta.module || '',
        meta.id || '',
        ...(config.labels || []),
        ...(payload.labels || []),
      ].filter(Boolean),
    });

    // Upload primary artifacts (screenshot + trace)
    await this.uploadAttachments(issue.issueKey, payload.attachments || {});

    // Store fingerprint for future deduplication
    await this.storeFingerprint(issue.issueKey, fingerprint);

    // Update the bundle's meta.json with Jira linkage
    await this.updateMetaWithJira(meta.workspacePath, meta.testName, issue.issueKey, issue.issueUrl);

    return issue;
  }

  /**
   * Upload screenshot/trace/video attachments to a Jira issue using the attachments API.
   * Supports multiple files including screenshots, traces, videos, and reports.
   */
  private async uploadAttachments(issueKey: string, attachments: DefectAttachments): Promise<void> {
    const { baseUrl, email, apiToken } = this.getConfig();
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}/attachments`;

    const files: Array<{ path: string; name?: string }> = [];
    
    // Add single screenshot
    if (attachments.screenshotPath && fs.existsSync(attachments.screenshotPath)) {
      files.push({ path: attachments.screenshotPath });
    }
    
    // Add multiple screenshots
    if (attachments.screenshotPaths) {
      for (const screenshotPath of attachments.screenshotPaths) {
        if (fs.existsSync(screenshotPath)) {
          files.push({ path: screenshotPath });
        }
      }
    }
    
    // Add trace file
    if (attachments.tracePath && fs.existsSync(attachments.tracePath)) {
      files.push({ path: attachments.tracePath });
    }
    
    // Add video file
    if (attachments.videoPath && fs.existsSync(attachments.videoPath)) {
      files.push({ path: attachments.videoPath });
    }

    if (files.length === 0) {
      console.log('[JiraService] No attachment files found to upload');
      return;
    }

    console.log(`[JiraService] Uploading ${files.length} attachment(s) to Jira issue ${issueKey}`);

    const boundary = `----qa-studio-${Date.now()}`;
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    await new Promise<void>((resolve, reject) => {
      const req = client.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'X-Atlassian-Token': 'no-check',
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`Jira attachment upload failed: ${res.statusCode} - ${data || res.statusMessage}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(err));

      // Upload all files
      for (const file of files) {
        if (!fs.existsSync(file.path)) {
          console.warn(`[JiraService] File not found, skipping: ${file.path}`);
          continue;
        }
        
        const fileName = file.name || path.basename(file.path);
        const fileContent = fs.readFileSync(file.path);
        
        // Determine content type based on file extension
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
          contentType = `image/${ext === '.png' ? 'png' : 'jpeg'}`;
        } else if (ext === '.zip') {
          contentType = 'application/zip';
        } else if (ext === '.mp4' || ext === '.webm') {
          contentType = `video/${ext === '.mp4' ? 'mp4' : 'webm'}`;
        } else if (ext === '.html') {
          contentType = 'text/html';
        }

        req.write(`--${boundary}\r\n`);
        req.write(
          `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: ${contentType}\r\n\r\n`
        );
        req.write(fileContent);
        req.write('\r\n');
        
        console.log(`[JiraService] Uploaded: ${fileName} (${(fileContent.length / 1024).toFixed(2)} KB)`);
      }

      req.write(`--${boundary}--\r\n`);
      req.end();
    });
    
    console.log(`[JiraService] Successfully uploaded ${files.length} attachment(s)`);
  }

  /**
   * Update the test bundle's meta.json with Jira issue linkage.
   */
  private async updateMetaWithJira(
    workspacePath: string,
    testName: string,
    issueKey: string,
    issueUrl: string
  ): Promise<void> {
    try {
      const fileName = testName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // New bundle structure
      let metaPath = path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.meta.json`);

      if (!fs.existsSync(metaPath)) {
        // Old module structure
        const oldModulePath = path.join(workspacePath, 'tests', 'd365', fileName, `${fileName}.meta.json`);
        if (fs.existsSync(oldModulePath)) {
          metaPath = oldModulePath;
        } else {
          // Old flat structure
          const oldFlatPath = path.join(workspacePath, 'tests', `${fileName}.meta.json`);
          if (fs.existsSync(oldFlatPath)) {
            metaPath = oldFlatPath;
          }
        }
      }

      if (!fs.existsSync(metaPath)) {
        console.warn('[JiraService] meta.json not found for Jira linkage:', testName);
        return;
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      meta.jira = {
        ...(meta.jira || {}),
        issueKey,
        issueUrl,
      };

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      console.log('[JiraService] Updated meta.json with Jira issue:', issueKey);
    } catch (e: any) {
      console.error('[JiraService] Failed to update meta.json with Jira info:', e.message);
    }
  }
}

