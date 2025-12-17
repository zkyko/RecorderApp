import { ChildProcess } from 'child_process';
import { WorkspaceMeta } from '../../../types/v1.5';
import { TestRunRequest } from '../../../types/v1.5';
import { ExecutionContext } from '../../../types/execution-context';

/**
 * Interface for execution providers (local, BrowserStack, etc.)
 * Abstracts test execution logic from TestRunner
 */
export interface ExecutionProvider {
  /**
   * Prepare the execution environment
   * Loads credentials, validates configuration, sets up environment
   * 
   * @param workspace Workspace metadata
   * @param request Test run request
   * @throws Error if configuration is invalid or credentials are missing
   */
  prepare(workspace: WorkspaceMeta, request: TestRunRequest): Promise<void>;

  /**
   * Generate Playwright configuration file in workspace
   * Should create the appropriate config file (playwright.config.ts or playwright.browserstack.config.ts)
   */
  generateConfig(): Promise<void>;

  /**
   * Run the test and return the spawned process
   * 
   * @param specRelPath Relative path to spec file from workspace root
   * @returns ChildProcess instance for the test execution
   */
  run(specRelPath: string): Promise<ChildProcess>;

  /**
   * Collect execution results and metadata
   * Should parse output for session IDs, build IDs, etc.
   * 
   * @param runId Test run ID
   * @returns Execution context with provider, browser/os info, and cloud links
   */
  collectResults(runId: string): Promise<ExecutionContext>;

  /**
   * Get environment variables to inject into the execution process
   * @returns Environment variables object
   */
  getEnvironmentVariables(): NodeJS.ProcessEnv;
}

