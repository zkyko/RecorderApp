import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';
import { app } from 'electron';

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

interface DefectLinks {
  browserStackSessionUrl?: string;
  browserStackTmTestCaseUrl?: string;
  browserStackTmRunUrl?: string;
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

interface EnvironmentInfo {
  browser?: string;
  os?: string;
  executionProfile?: 'local' | 'browserstack';
  browserVersion?: string;
  osVersion?: string;
}

export interface DefectPayload {
  projectKey?: string;
  summary: string;
  description?: string;
  issueType?: string;
  labels?: string[];
  priority?: string;
  links?: DefectLinks;
  attachments?: DefectAttachments;
  testMeta: DefectTestMeta;
  failureArtifact?: FailureArtifactData;
  environment?: EnvironmentInfo;
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
}

/**
 * Jira Service for creating issues and managing defects
 * Uses JiraRestAPI.json as source of truth for field schemas
 */
export class JiraService {
  private configManager: ConfigManager;
  private fieldSchema: JiraFieldSchema | null = null;

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
   * Get Jira configuration from settings
   */
  private getConfig(): {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  } {
    // Read Jira-specific values from dedicated config API
    const jiraConfig = this.configManager.getJiraConfig();

    // Debug logging to trace Jira config resolution
    try {
      // eslint-disable-next-line no-console
      console.log('[JiraService] getConfig jiraConfig:', jiraConfig);
    } catch {
      // Ignore logging errors
    }

    // Default values for Four Hands Jira instance (no hardcoded secrets)
    const baseUrl = jiraConfig.baseUrl || 'https://fourhands.atlassian.net';
    const email = jiraConfig.email || '';
    const apiToken = jiraConfig.apiToken || '';
    const projectKey = jiraConfig.projectKey || 'QST';

    if (!email || !apiToken) {
      throw new Error('Jira email or API token is not configured. Please set them in Settings.');
    }

    return {
      baseUrl,
      email,
      apiToken,
      projectKey,
    };
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<{ success: boolean; projectName?: string; error?: string }> {
    try {
      const { baseUrl, email, apiToken, projectKey } = this.getConfig();
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
  async getIssueTypes(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const { baseUrl, email, apiToken, projectKey } = this.getConfig();
      const url = `${baseUrl}/rest/api/3/project/${projectKey}`;

      const project = await this.makeRequest('GET', url, email, apiToken);
      
      // Get issue types from project metadata
      const issueTypesUrl = `${baseUrl}/rest/api/3/project/${projectKey}/statuses`;
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

    // Try to get issue type ID from create metadata (more reliable than name)
    // Also check which fields are available on the create screen
    let issueTypeField: { id?: string; name?: string } = {};
    let labelsAvailable = false;
    const issueTypeName = issueData.issueType || 'Bug';
    
    try {
      const metadataUrl = `${baseUrl}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&issuetypeNames=${encodeURIComponent(issueTypeName)}&expand=projects.issuetypes.fields`;
      const metadata = await this.makeRequest('GET', metadataUrl, email, apiToken);
      
      if (metadata.projects && metadata.projects.length > 0) {
        const project = metadata.projects[0];
        if (project.issuetypes && project.issuetypes.length > 0) {
          // Use the first matching issue type
          issueTypeField = { id: project.issuetypes[0].id };
          
          // Check if labels field is available on the create screen
          const issueType = project.issuetypes[0];
          if (issueType.fields && issueType.fields.labels) {
            labelsAvailable = true;
          }
        }
      }
    } catch (metadataError: any) {
      // Fall back to using name if metadata fetch fails
      console.warn('[JiraService] Could not fetch issue type metadata, using name:', metadataError.message);
    }

    // Build issue payload
    const fields: any = {
      project: {
        key: projectKey,
      },
      summary: issueData.summary,
      description: {
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
      issuetype: issueTypeField.id 
        ? { id: issueTypeField.id }
        : { name: issueTypeName },
    };

    // Add labels if provided and available on the create screen
    if (issueData.labels && issueData.labels.length > 0 && labelsAvailable) {
      fields.labels = issueData.labels;
    } else if (issueData.labels && issueData.labels.length > 0) {
      console.warn('[JiraService] Labels field is not available on the create screen, skipping labels');
    }

    // Add custom fields with proper formatting based on schema
    if (issueData.customFields) {
      for (const [fieldId, value] of Object.entries(issueData.customFields)) {
        const fieldSchema = this.getFieldSchema(fieldId);
        if (fieldSchema) {
          fields[fieldId] = this.formatFieldValue(value, fieldSchema);
        } else {
          // Fallback: use value as-is
          fields[fieldId] = value;
        }
      }
    }

    const payload = {
      fields,
    };

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
   * High-level helper for creating a structured Jira defect from a failed test run.
   * Builds a Markdown-style description, creates the issue, uploads attachments,
   * and updates the corresponding test bundle meta.json with Jira linkage.
   */
  async createDefect(payload: DefectPayload): Promise<{ issueKey: string; issueUrl: string }> {
    const meta = payload.testMeta;

    // Load failure artifact if not provided
    const failureArtifact = payload.failureArtifact || this.loadFailureArtifact(meta.workspacePath, meta.testName);

    const lines: string[] = [];

    // Header
    lines.push(`# Test: ${meta.testName}`);
    lines.push('');
    lines.push(`Status: Failed`);
    if (meta.workspaceId) {
      lines.push(`Workspace: ${meta.workspaceId}`);
    }
    if (payload.runId) {
      lines.push(`Run ID: ${payload.runId}`);
    }
    if (payload.startedAt) {
      const startDate = new Date(payload.startedAt).toLocaleString();
      lines.push(`Execution Time: ${startDate}`);
    }
    if (failureArtifact?.duration) {
      const durationSeconds = (failureArtifact.duration / 1000).toFixed(2);
      lines.push(`Duration: ${durationSeconds}s`);
    }
    if (failureArtifact?.retry !== undefined && failureArtifact.retry > 0) {
      lines.push(`Retry Count: ${failureArtifact.retry}`);
    }
    lines.push('');

    // Test Execution Environment
    lines.push('## Test Execution Environment');
    lines.push('');
    if (payload.environment) {
      if (payload.environment.executionProfile) {
        lines.push(`- Execution Profile: ${payload.environment.executionProfile === 'browserstack' ? 'BrowserStack Automate' : 'Local'}`);
      }
      if (payload.environment.browser) {
        lines.push(`- Browser: ${payload.environment.browser}${payload.environment.browserVersion ? ` ${payload.environment.browserVersion}` : ''}`);
      }
      if (payload.environment.os) {
        lines.push(`- OS: ${payload.environment.os}${payload.environment.osVersion ? ` ${payload.environment.osVersion}` : ''}`);
      }
    } else if (payload.links?.browserStackSessionUrl) {
      lines.push('- Execution Profile: BrowserStack Automate');
    } else {
      lines.push('- Execution Profile: Local');
    }
    lines.push('');

    // Failure Summary
    lines.push('## Failure Summary');
    lines.push('');
    const errorMessage = failureArtifact?.errorMessage || payload.description || 'Automated test failed. See artifacts and links below for more details.';
    lines.push(`\`\`\``);
    lines.push(errorMessage);
    lines.push(`\`\`\``);
    lines.push('');

    // Assertion Failure Details (if available)
    if (failureArtifact?.assertionFailure) {
      lines.push('### Assertion Failure Details');
      lines.push('');
      const af = failureArtifact.assertionFailure;
      lines.push(`- **Type**: ${af.assertionType}`);
      lines.push(`- **Target**: ${af.target}`);
      if (af.expected !== undefined) {
        lines.push(`- **Expected**: ${af.expected}`);
      }
      if (af.actual !== undefined) {
        lines.push(`- **Actual**: ${af.actual}`);
      }
      lines.push('');
    }

    // Failed Locator (if available)
    if (failureArtifact?.failedLocator) {
      lines.push('### Failed Locator');
      lines.push('');
      const fl = failureArtifact.failedLocator;
      lines.push(`- **Locator**: \`${fl.locator}\``);
      lines.push(`- **Type**: ${fl.type}`);
      lines.push(`- **Key**: ${fl.locatorKey}`);
      lines.push('');
    }

    // Error Location (if available)
    if (failureArtifact?.location) {
      lines.push('### Error Location');
      lines.push('');
      const loc = failureArtifact.location;
      lines.push(`- **File**: \`${loc.file}\``);
      lines.push(`- **Line**: ${loc.line}`);
      lines.push(`- **Column**: ${loc.column}`);
      lines.push('');
    }

    // Stack Trace (if available, in collapsed section)
    if (failureArtifact?.stackTrace) {
      lines.push('### Stack Trace');
      lines.push('');
      lines.push(`{code:java}`);
      lines.push(failureArtifact.stackTrace);
      lines.push(`{code}`);
      lines.push('');
    }

    // Steps to Reproduce
    lines.push('## Steps to Reproduce');
    lines.push('');
    lines.push('1. Open QA Studio');
    lines.push(`2. Navigate to workspace: ${meta.workspaceId || '<workspace>'}`);
    lines.push(`3. Execute test: ${meta.testName}`);
    if (payload.runId) {
      lines.push(`4. View run details for Run ID: ${payload.runId}`);
    }
    lines.push('');

    // Artifacts
    lines.push('## Artifacts');
    lines.push('');
    const attachments = payload.attachments || {};
    if (attachments.screenshotPath || (attachments.screenshotPaths && attachments.screenshotPaths.length > 0)) {
      const screenshotCount = attachments.screenshotPaths?.length || (attachments.screenshotPath ? 1 : 0);
      lines.push(`- Screenshot${screenshotCount > 1 ? 's' : ''}: ${screenshotCount} file${screenshotCount > 1 ? 's' : ''} attached`);
    }
    if (attachments.tracePath) {
      lines.push('- Trace file: attached (contains DOM snapshots, network logs, console logs, and step-by-step execution)');
    }
    if (attachments.videoPath) {
      lines.push('- Video recording: attached');
    }
    if (attachments.playwrightReportPath) {
      lines.push(`- Allure HTML Report: ${attachments.playwrightReportPath}`);
    }
    lines.push('');
    lines.push('*Note: Trace files can be opened in Playwright Trace Viewer for detailed debugging.*');
    lines.push('');

    // Links
    lines.push('## External Links');
    lines.push('');
    if (payload.links?.browserStackSessionUrl) {
      lines.push(`- [BrowserStack Session](${payload.links.browserStackSessionUrl})`);
    }
    if (payload.links?.browserStackTmTestCaseUrl) {
      lines.push(`- [BrowserStack TM Test Case](${payload.links.browserStackTmTestCaseUrl})`);
    }
    if (payload.links?.browserStackTmRunUrl) {
      lines.push(`- [BrowserStack TM Test Run](${payload.links.browserStackTmRunUrl})`);
    }
    if (!payload.links?.browserStackSessionUrl && !payload.links?.browserStackTmTestCaseUrl && !payload.links?.browserStackTmRunUrl) {
      lines.push('*No external links available*');
    }
    lines.push('');

    // Studio bundle reference
    lines.push('## QA Studio Bundle Reference');
    lines.push('');
    const slug = meta.testName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    lines.push(`Bundle Path: \`workspaces/${meta.workspaceId || '<workspace>'}/tests/specs/${slug}/\``);
    lines.push('');

    const fullDescription = lines.join('\n');

    const issue = await this.createIssue({
      summary: payload.summary,
      description: fullDescription,
      issueType: payload.issueType || 'Bug',
      labels: [
        'qa-studio',
        meta.workspaceId || '',
        meta.module || '',
        meta.id || '',
        ...(payload.labels || []),
      ].filter(Boolean),
    });

    // Upload primary artifacts (screenshot + trace)
    await this.uploadAttachments(issue.issueKey, payload.attachments || {});

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

