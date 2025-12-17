export type ExecutionProviderId = 'local' | 'browserstack' | 'sauce' | 'lambdatest' | 'grid';

/**
 * Generic execution context that works with any execution provider
 * Replaces provider-specific metadata with a unified structure
 */
export interface ExecutionContext {
  provider: ExecutionProviderId;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  realMobile?: boolean;

  // Cloud links (optional)
  sessionUrl?: string;
  buildUrl?: string;
  runUrl?: string;

  // Identifiers (optional, for API lookups later)
  sessionId?: string;
  buildId?: string;
  projectName?: string;
  buildName?: string;
}

