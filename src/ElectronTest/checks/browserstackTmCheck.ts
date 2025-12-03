import { ElectronTestResultWithoutDuration } from '../types';
import { ConfigManager } from '../../main/config-manager';

export async function browserstackTmCheck(): Promise<ElectronTestResultWithoutDuration> {
  const configManager = new ConfigManager();
  const cfg = configManager.getConfig() as any;

  const projectId = cfg.browserstackTmProjectId;
  const apiToken = cfg.browserstackTmApiToken;

  if (!projectId || !apiToken) {
    return {
      id: 'browserstack-tm',
      label: 'BrowserStack Test Management',
      status: 'SKIP',
      details: 'BrowserStack TM not configured. Set project id and API token in settings.',
    };
  }

  // For now we treat configuration presence as a basic PASS to avoid creating
  // noise entries in TM. A future enhancement can add a real ping call.
  return {
    id: 'browserstack-tm',
    label: 'BrowserStack Test Management',
    status: 'PASS',
    details: `Project id ${projectId} and API token are configured.`,
  };
}

(browserstackTmCheck as any).id = 'browserstack-tm';
(browserstackTmCheck as any).label = 'BrowserStack Test Management';


