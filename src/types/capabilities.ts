/**
 * Browser capability model for execution providers
 * Supports desktop and mobile browsers across different cloud providers
 */

export interface BrowserCapability {
  browser: 'chrome' | 'edge' | 'firefox' | 'safari';
  version?: string | 'latest';
  os: 'windows' | 'macos' | 'ios' | 'android';
  osVersion?: string;
  device?: string;
  realMobile?: boolean;
}

