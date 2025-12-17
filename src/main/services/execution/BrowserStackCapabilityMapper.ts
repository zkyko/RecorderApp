import { BrowserCapability } from '../../../types/capabilities';

/**
 * BrowserStack capability object structure
 */
export interface BrowserStackCapabilities {
  browserName: string;
  browserVersion: string;
  os: string;
  osVersion?: string;
  device?: string;
  realMobile?: boolean;
}

/**
 * Maps BrowserCapability to BrowserStack capabilities format
 */
export class BrowserStackCapabilityMapper {
  /**
   * Convert BrowserCapability to BrowserStack capabilities object
   * 
   * @param capability Browser capability from UI
   * @returns BrowserStack capabilities object
   */
  static toBrowserStackCaps(capability: BrowserCapability): BrowserStackCapabilities {
    const browserName = this.capitalizeFirst(capability.browser);
    const os = this.mapOs(capability.os);
    
    const caps: BrowserStackCapabilities = {
      browserName,
      browserVersion: capability.version || 'latest',
      os,
    };

    if (capability.osVersion) {
      caps.osVersion = capability.osVersion;
    }

    if (capability.device) {
      caps.device = capability.device;
    }

    if (capability.realMobile !== undefined) {
      caps.realMobile = capability.realMobile;
    }

    return caps;
  }

  /**
   * Capitalize first letter of a string
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Map OS name to BrowserStack format
   * macOS -> OS X
   */
  private static mapOs(os: string): string {
    if (os === 'macos') {
      return 'OS X';
    }
    // Capitalize first letter: windows -> Windows, ios -> Ios, android -> Android
    return this.capitalizeFirst(os);
  }
}

