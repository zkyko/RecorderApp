import { ElectronTestResultWithoutDuration } from '../types';
import { ConfigManager } from '../../main/config-manager';
import { JiraService } from '../../main/services/jiraService';

export async function jiraCheck(): Promise<ElectronTestResultWithoutDuration> {
  const configManager = new ConfigManager();
  const cfg = configManager.getConfig() as any;

  const baseUrl = cfg.jiraBaseUrl;
  const email = cfg.jiraEmail;
  const apiToken = cfg.jiraApiToken;
  const projectKey = cfg.jiraProjectKey;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    return {
      id: 'jira',
      label: 'Jira',
      status: 'SKIP',
      details: 'Jira not fully configured. Set base URL, email, API token, and project key in Settings → Jira.',
    };
  }

  const jiraService = new JiraService(configManager);
  const result = await jiraService.testConnection();

  if (result.success) {
    return {
      id: 'jira',
      label: 'Jira',
      status: 'PASS',
      details: `Connected to Jira project: ${result.projectName || projectKey}`,
    };
  }

  return {
    id: 'jira',
    label: 'Jira',
    status: 'FAIL',
    details: result.error || 'Failed to connect to Jira.',
  };
}

(jiraCheck as any).id = 'jira';
(jiraCheck as any).label = 'Jira';


