import { ExecutionProvider } from './ExecutionProvider';
import { LocalPlaywrightProvider } from './LocalPlaywrightProvider';
import { BrowserStackExecutionProvider } from './BrowserStackExecutionProvider';
import { ConfigManager } from '../../config-manager';

/**
 * Factory for creating execution providers based on run mode
 */
export class ExecutionProviderFactory {
  /**
   * Create an execution provider for the given run mode
   * 
   * @param runMode Execution mode ('local' or 'browserstack')
   * @param configManager Config manager instance (optional, created if not provided)
   * @returns ExecutionProvider instance
   */
  static create(runMode: 'local' | 'browserstack' = 'local', configManager?: ConfigManager): ExecutionProvider {
    const config = configManager || new ConfigManager();

    if (runMode === 'browserstack') {
      return new BrowserStackExecutionProvider(config);
    }

    return new LocalPlaywrightProvider(config);
  }
}

