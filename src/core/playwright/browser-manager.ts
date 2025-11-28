import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Manages Playwright browser lifecycle and D365 navigation
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Check if storage state file exists and is valid (basic check)
   */
  isStorageStateValid(storageStatePath?: string): boolean {
    if (!storageStatePath) return false;
    
    try {
      if (!fs.existsSync(storageStatePath)) {
        return false;
      }
      
      const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));
      // Check if it has cookies (basic validation)
      return state.cookies && Array.isArray(state.cookies) && state.cookies.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test if storage state is valid and working by attempting to use it
   */
  async testStorageState(storageStatePath: string, d365Url: string): Promise<{
    isValid: boolean;
    isWorking: boolean;
    error?: string;
    details: {
      exists: boolean;
      hasCookies: boolean;
      cookieCount: number;
      canAccessD365: boolean;
    };
  }> {
    const result = {
      isValid: false,
      isWorking: false,
      details: {
        exists: false,
        hasCookies: false,
        cookieCount: 0,
        canAccessD365: false,
      }
    };

    // Check 1: File exists
    if (!fs.existsSync(storageStatePath)) {
      return { ...result, error: 'Storage state file does not exist' };
    }
    result.details.exists = true;

    // Check 2: Valid JSON structure with cookies
    try {
      const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));
      result.details.hasCookies = state.cookies && Array.isArray(state.cookies);
      result.details.cookieCount = result.details.hasCookies ? state.cookies.length : 0;
      result.isValid = result.details.hasCookies && result.details.cookieCount > 0;
    } catch (error: any) {
      return { ...result, error: `Invalid JSON: ${error.message}` };
    }

    if (!result.isValid) {
      return { ...result, error: 'Storage state has no cookies' };
    }

    // Check 3: Actually test if it works by trying to use it
    let testBrowser: Browser | null = null;
    try {
      testBrowser = await chromium.launch({ headless: true });
      const context = await testBrowser.newContext({
        storageState: storageStatePath,
      });
      const page = await context.newPage();
      
      // Try to navigate to D365
      await page.goto(d365Url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Check if we're logged in (not on login page)
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('login.microsoft.com') || 
                            currentUrl.includes('microsoftonline.com');
      
      result.details.canAccessD365 = !isOnLoginPage;
      result.isWorking = result.details.canAccessD365;
      
      await context.close();
      await testBrowser.close();
    } catch (error: any) {
      if (testBrowser) {
        await testBrowser.close().catch(() => {});
      }
      return { ...result, error: `Test failed: ${error.message}` };
    }

    return result;
  }

  /**
   * Launch Chromium browser with optional storage state for D365 auth
   */
  async launch(options?: {
    storageStatePath?: string;
    headless?: boolean;
    slowMo?: number;
  }): Promise<Page> {
    const launchOptions: LaunchOptions = {
      headless: options?.headless ?? false,
      slowMo: options?.slowMo,
    };

    this.browser = await chromium.launch(launchOptions);

    const contextOptions: any = {};
    if (options?.storageStatePath && this.isStorageStateValid(options.storageStatePath)) {
      contextOptions.storageState = options.storageStatePath;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    return this.page;
  }

  /**
   * Save storage state to file
   */
  async saveStorageState(filePath: string): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not available. Launch browser first.');
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.context.storageState({ path: filePath });
  }

  /**
   * Perform D365 login and save storage state
   */
  async performLogin(
    d365Url: string,
    username: string,
    password: string,
    storageStatePath: string,
    onProgress?: (message: string) => void
  ): Promise<boolean> {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }

      onProgress?.('Navigating to D365...');
      // Navigate and wait for DOM to be ready (Chrome backend confirms page loaded)
      await this.page.goto(d365Url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      onProgress?.('Waiting for page to be ready...');
      // Wait for Chrome to confirm page is loaded (networkidle or specific elements)
      if (this.page) {
        await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
          // If networkidle times out, at least wait for load state
          if (this.page) {
            return this.page.waitForLoadState('load', { timeout: 10000 });
          }
        });
      }

      // Wait for sign-in page - use dynamic wait for Chrome to confirm elements are ready
      onProgress?.('Waiting for sign-in page...');
      try {
        // Wait for login input to be visible and ready (Chrome confirms element is interactive)
        await this.page.waitForSelector('input[type="email"], input[name="loginfmt"], input[type="text"]', { 
          timeout: 10000,
          state: 'visible'
        });
      } catch (error) {
        // Maybe already logged in or different login flow - check URL immediately
        const currentUrl = this.page.url();
        if (currentUrl.includes(d365Url) || currentUrl.includes('dynamics.com')) {
          onProgress?.('Already authenticated or different login flow detected');
          // Wait for D365 to be ready before saving state
          await this.waitForD365Ready();
          await this.saveStorageState(storageStatePath);
          return true;
        }
        throw error;
      }

      // Fill username
      onProgress?.('Entering username...');
      const emailInput = this.page.locator('input[type="email"], input[name="loginfmt"], input[type="text"]').first();
      await emailInput.fill(username);
      await emailInput.press('Enter');
      // Wait for Chrome to confirm next page is loaded (wait for navigation to complete)
      onProgress?.('Waiting for response...');
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

      // Wait for password field or check if already logged in
      onProgress?.('Waiting for password field...');
      try {
        // Wait for password field to be visible (Chrome confirms element is ready)
        await this.page.waitForSelector('input[type="password"]', { 
          timeout: 10000,
          state: 'visible'
        });
      } catch (error) {
        // Might be MFA or different flow - check if we're already logged in
        onProgress?.('Password field not found, checking if already authenticated...');
        // Wait for Chrome to confirm page is loaded
        await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
        const currentUrl = this.page.url();
        if (currentUrl.includes(d365Url) || currentUrl.includes('dynamics.com')) {
          await this.waitForD365Ready();
          await this.saveStorageState(storageStatePath);
          return true;
        }
        throw new Error('Password field not found. Please check authentication flow.');
      }

      // Fill password
      onProgress?.('Entering password...');
      const passwordInput = this.page.locator('input[type="password"]').first();
      await passwordInput.fill(password);
      await passwordInput.press('Enter');
      // Wait for Chrome to confirm navigation started
      onProgress?.('Waiting for authentication...');
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

      // Wait for D365 to load - use Chrome's confirmation that page is ready
      onProgress?.('Waiting for D365 to load...');
      try {
        // Wait for URL to contain D365 domain (Chrome confirms navigation)
        await this.page.waitForURL(url => 
          url.toString().includes('dynamics.com') || 
          url.toString().includes('operations.dynamics.com'), 
          { timeout: 60000 }
        );
        // Chrome confirms page loaded - wait for load state
        await this.page.waitForLoadState('load', { timeout: 10000 });
      } catch (error) {
        // Check if page was closed
        if (this.page.isClosed()) {
          throw new Error('Browser page was closed during login');
        }
        
        // Check if we're on an MFA or consent page
        const currentUrl = this.page.url();
        if (currentUrl.includes('microsoftonline.com') || currentUrl.includes('login.microsoft.com')) {
          onProgress?.('MFA or additional authentication required. Please complete in browser...');
          // Wait for Chrome to confirm navigation to D365 (user completes MFA)
          await this.page.waitForURL(url => 
            url.toString().includes('dynamics.com') || 
            url.toString().includes('operations.dynamics.com'), 
            { timeout: 300000 }
          );
          // Chrome confirms page loaded
          await this.page.waitForLoadState('load', { timeout: 10000 });
        } else {
          throw error;
        }
      }

      // Wait for D365 shell to be ready (Chrome confirms elements are visible)
      await this.waitForD365Ready();

      // Save storage state
      onProgress?.('Saving authentication state...');
      await this.saveStorageState(storageStatePath);
      onProgress?.('Authentication successful!');

      return true;
    } catch (error: any) {
      onProgress?.(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to D365 URL
   */
  async navigateToD365(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    // Navigate and wait for Chrome to confirm page is loaded
    await this.page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for Chrome to confirm page is fully loaded
    await this.page.waitForLoadState('load', { timeout: 10000 });
    
    // Wait for D365 to be ready (Chrome confirms elements are visible)
    await this.waitForD365Ready();
  }

  /**
   * Wait for D365 to be fully loaded and ready
   * Uses Chrome's backend to confirm page is actually ready, not fixed timeouts
   */
  private async waitForD365Ready(): Promise<void> {
    if (!this.page) {
      return;
    }

    // Check if page is still open
    if (this.page.isClosed()) {
      console.warn('Page was closed before waitForD365Ready could complete');
      return;
    }

    try {
      // Wait for Chrome to confirm DOM is ready
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      
      // Wait for D365 app shell indicators - Chrome confirms elements are visible
      const selectors = [
        '[data-dyn-role="shell"]',
        '.dyn-shell',
        '#shell',
        'div[aria-label*="Finance and Operations"]',
        'nav[role="navigation"]',
        'body', // Fallback - body should always exist
      ];

      // Try to find at least one D365 shell element (Chrome confirms visibility)
      let found = false;
      for (const selector of selectors) {
        if (this.page.isClosed()) {
          return;
        }
        
        try {
          // Wait for Chrome to confirm element is visible and ready
          await this.page.waitForSelector(selector, { 
            timeout: 5000, // Shorter timeout - Chrome confirms quickly
            state: 'visible' // Chrome confirms element is actually visible
          });
          found = true;
          break; // Found one, Chrome confirmed it's ready
        } catch (error) {
          // Try next selector
          continue;
        }
      }
      
      if (!found) {
        // If none of the selectors match, check if we're at least on a D365 URL
        if (!this.page.isClosed()) {
          const currentUrl = this.page.url();
          if (currentUrl.includes('dynamics.com') || currentUrl.includes('operations.dynamics.com')) {
            console.log('D365 URL detected, Chrome confirmed page loaded');
          } else {
            console.warn('Could not detect D365 shell elements and not on D365 URL');
          }
        }
      }
      
      // Wait for Chrome to confirm network is idle (all resources loaded)
      if (this.page && !this.page.isClosed()) {
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
          // If networkidle times out, at least Chrome confirmed load state
          if (this.page) {
            return this.page.waitForLoadState('load', { timeout: 3000 });
          }
        });
      }
    } catch (error: any) {
      // If page is closed, don't try to recover
      if (this.page.isClosed()) {
        console.warn('Page was closed during waitForD365Ready');
        return;
      }
      
      // Fallback: Chrome confirms at least DOM is ready
      console.warn('Error waiting for D365 ready, falling back to DOM ready:', error.message);
      try {
        if (!this.page.isClosed()) {
          await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        }
      } catch (e: any) {
        if (!this.page.isClosed()) {
          console.warn('Could not wait for DOM ready:', e.message);
        }
      }
    }
  }

  /**
   * Get the current page instance
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get the current browser context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Check if browser is currently open
   */
  isOpen(): boolean {
    return this.browser !== null && this.page !== null;
  }
}

