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
}

interface DefectTestMeta {
  workspacePath: string;
  workspaceId?: string;
  testName: string;
  module?: string;
  id?: string;
}

export interface DefectPayload {
  projectKey?: string;
  summary: string;
  description?: string;
  labels?: string[];
  priority?: string;
  links?: DefectLinks;
  attachments?: DefectAttachments;
  testMeta: DefectTestMeta;
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

    // Values from settings with sensible defaults
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
      return {
        success: false,
        error: error.message || 'Failed to connect to Jira',
      };
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
      issuetype: {
        name: issueData.issueType || 'Bug',
      },
    };

    // Add labels if provided
    if (issueData.labels && issueData.labels.length > 0) {
      fields.labels = issueData.labels;
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

    const response = await this.makeRequest('POST', url, email, apiToken, payload);

    return {
      issueKey: response.key,
      issueUrl: `${baseUrl}/browse/${response.key}`,
    };
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
              reject(
                new Error(
                  `Jira API error: ${res.statusCode} - ${errorData.errorMessages?.join(', ') || errorData.message || res.statusMessage}`
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
   * High-level helper for creating a structured Jira defect from a failed test run.
   * Builds a Markdown-style description, creates the issue, uploads attachments,
   * and updates the corresponding test bundle meta.json with Jira linkage.
   */
  async createDefect(payload: DefectPayload): Promise<{ issueKey: string; issueUrl: string }> {
    const meta = payload.testMeta;

    const lines: string[] = [];

    // Header
    lines.push(`# Test: ${meta.testName}`);
    lines.push('');
    lines.push(`Status: Failed`);
    if (meta.workspaceId) {
      lines.push(`Workspace: ${meta.workspaceId}`);
    }
    lines.push('');

    // Environment (simple hint based on BrowserStack presence)
    if (payload.links?.browserStackSessionUrl) {
      lines.push(`Environment: BrowserStack (Automate)`);
      lines.push('');
    }

    // Failure Summary
    lines.push('## Failure Summary');
    lines.push('');
    if (payload.description) {
      lines.push(payload.description);
      lines.push('');
    } else {
      lines.push('Automated test failed. See artifacts and links below for more details.');
      lines.push('');
    }

    // Steps to Reproduce (placeholder – recording-based steps can be added later)
    lines.push('## Steps to Reproduce');
    lines.push('');
    lines.push('- Execute the automated test in QA Studio for the bundle referenced below.');
    lines.push('');

    // Artifacts
    lines.push('## Artifacts');
    lines.push('');
    if (payload.attachments?.screenshotPath) {
      lines.push('- Screenshot: attached');
    }
    if (payload.attachments?.tracePath) {
      lines.push('- Trace: attached');
    }
    if (payload.attachments?.playwrightReportPath) {
      lines.push(`- Playwright report: ${payload.attachments.playwrightReportPath}`);
    }
    lines.push('');

    // Links
    lines.push('## Links');
    lines.push('');
    if (payload.links?.browserStackSessionUrl) {
      lines.push(`- BrowserStack session: ${payload.links.browserStackSessionUrl}`);
    }
    if (payload.links?.browserStackTmTestCaseUrl) {
      lines.push(`- BrowserStack TM test case: ${payload.links.browserStackTmTestCaseUrl}`);
    }
    if (payload.links?.browserStackTmRunUrl) {
      lines.push(`- BrowserStack TM run: ${payload.links.browserStackTmRunUrl}`);
    }
    lines.push('');

    // Studio bundle reference
    lines.push('## Studio bundle reference');
    lines.push('');
    const slug = meta.testName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    lines.push(`Bundle: workspaces/${meta.workspaceId || '<workspace>'}/tests/specs/${slug}/`);
    lines.push('');

    const fullDescription = lines.join('\n');

    const issue = await this.createIssue({
      summary: payload.summary,
      description: fullDescription,
      issueType: 'Bug',
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
   * Upload screenshot/trace attachments to a Jira issue using the attachments API.
   */
  private async uploadAttachments(issueKey: string, attachments: DefectAttachments): Promise<void> {
    const { baseUrl, email, apiToken } = this.getConfig();
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}/attachments`;

    const files: string[] = [];
    if (attachments.screenshotPath) files.push(attachments.screenshotPath);
    if (attachments.tracePath) files.push(attachments.tracePath);

    if (files.length === 0) {
      return;
    }

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

      for (const filePath of files) {
        if (!fs.existsSync(filePath)) continue;
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);

        req.write(`--${boundary}\r\n`);
        req.write(
          `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`
        );
        req.write(fileContent);
        req.write('\r\n');
      }

      req.write(`--${boundary}--\r\n`);
      req.end();
    });
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

