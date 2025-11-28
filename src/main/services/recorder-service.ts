import { BrowserWindow, ipcMain } from 'electron';
import { BrowserManager } from '../../core/playwright/browser-manager';
import { RecorderEngine } from '../../core/recorder/recorder-engine';
import { RecordedStep, LocatorDefinition } from '../../types';
import { RecorderStartRequest, RecorderStartResponse, RecorderStopResponse, RecorderCodeUpdate } from '../../types/v1.5';
import { Page } from 'playwright';
import { NavigationCleanupService } from './navigation-cleanup-service';

/**
 * Service for managing QA Studio Recorder
 * Uses existing RecorderEngine to capture steps and converts them to Playwright code
 */
export class RecorderService {
  private browserManager: BrowserManager;
  private recorderEngine: RecorderEngine | null = null;
  private mainWindow: BrowserWindow | null = null;
  private workspacePath: string | null = null;
  private recordedSteps: RecordedStep[] = [];
  private currentPage: Page | null = null;
  private navigationCleanupService: NavigationCleanupService;

  constructor() {
    this.browserManager = new BrowserManager();
    this.navigationCleanupService = new NavigationCleanupService();
  }

  /**
   * Set main window for IPC communication
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Start recording with QA Studio Recorder
   */
  async start(request: RecorderStartRequest): Promise<RecorderStartResponse> {
    try {
      if (this.recorderEngine) {
        return { success: false, error: 'Recording already in progress' };
      }

      this.workspacePath = request.workspacePath;
      this.recordedSteps = [];

      // Launch browser with storage state
      const launchOptions: any = {
        headless: false,
      };
      
      if (request.storageStatePath && request.storageStatePath.trim()) {
        launchOptions.storageStatePath = request.storageStatePath;
      }

      const page = await this.browserManager.launch(launchOptions);

      if (!page) {
        return { success: false, error: 'Failed to launch browser' };
      }

      this.currentPage = page;

      // Create recorder engine BEFORE navigation so we can capture page.goto
      this.recorderEngine = new RecorderEngine();

      // Start recording BEFORE navigation to capture the initial page.goto
      await this.recorderEngine.startRecording(page, (step: RecordedStep) => {
        this.recordedSteps.push(step);
        // Send live update with current code
        this.sendCodeUpdate();
      });

      // Now navigate to D365 URL - this will be captured as a navigation step
      if (request.envUrl) {
        // Store the initial URL before navigation
        const initialUrl = request.envUrl;
        
        // Navigate - this should trigger a navigation event that will be captured
        await page.goto(initialUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait a brief moment for navigation event to be processed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Ensure we have the initial navigation step - add manually if navigation event didn't fire
        const hasNavigationStep = this.recordedSteps.some(
          step => step.action === 'navigate' && step.pageUrl && step.pageUrl.includes(new URL(initialUrl).hostname)
        );
        
        if (!hasNavigationStep) {
          // Manually create initial navigation step as fallback
          const initialNavigationStep: RecordedStep = {
            pageId: 'DefaultDashboard', // Will be classified later if needed
            action: 'navigate',
            description: `Navigate to ${initialUrl}`,
            locator: { strategy: 'css', selector: 'body' },
            order: 0,
            timestamp: new Date(),
            pageUrl: initialUrl,
          };
          
          // Insert at the beginning
          this.recordedSteps.unshift(initialNavigationStep);
          this.sendCodeUpdate();
        }
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to start recording',
      };
    }
  }

  /**
   * Stop recording and return generated code
   */
  async stop(): Promise<RecorderStopResponse> {
    try {
      if (!this.recorderEngine) {
        return { success: false, error: 'No recording in progress' };
      }

      // Stop recording
      this.recorderEngine.stopRecording();
      this.recorderEngine = null;

      // Close browser
      await this.browserManager.close();
      this.currentPage = null;

      // Generate code from steps
      let code = this.generateCodeFromSteps(this.recordedSteps);
      
      // Note: Navigation cleanup is now handled in LocatorCleanupService
      // So we return raw code here, and cleanup happens when UI calls locator cleanup
      // This ensures consistent pipeline for both recorder and codegen paths
      
      // Clear recorded steps
      const steps = [...this.recordedSteps];
      this.recordedSteps = [];

      return {
        success: true,
        rawCode: code,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to stop recording',
      };
    }
  }

  /**
   * Check if a navigation step should be completely ignored (Auth/Redirects/etc)
   */
  private isIgnoredNavigation(step: RecordedStep): boolean {
    if (step.action !== 'navigate' || !step.pageUrl) return false;
    
    const url = step.pageUrl;
    
    // 1. Block Microsoft Login / Auth
    if (url.includes('login.microsoftonline.com') || 
        url.includes('login.live.com') ||
        url.includes('oauth2')) {
      return true;
    }

    // 2. Block "Redirecting" intermediate pages
    if (step.description?.includes('Redirecting')) {
      return true;
    }

    return false;
  }

  /**
   * Convert RecordedStep[] to Playwright code string
   * IMPROVED: Uses Lookahead logic and Interaction Awareness to collapse navigations
   */
  private generateCodeFromSteps(steps: RecordedStep[]): string {
    const lines: string[] = [];
    
    // Add basic test structure
    lines.push("import { test, expect } from '@playwright/test';");
    lines.push("");
    lines.push("test('test', async ({ page }) => {");
    
    let lastWrittenAction: 'click' | 'fill' | 'select' | 'wait' | 'navigate' | null = null;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // --- HANDLE NAVIGATIONS ---
      if (step.action === 'navigate') {
        // 1. Is this junk? (Auth/Redirects)
        if (this.isIgnoredNavigation(step)) {
          continue;
        }

        // 2. INTERACTION AWARENESS: If the last action was a click, this navigation is likely
        // a SPA route change caused by that click. Skip it - the click itself is enough.
        if (lastWrittenAction === 'click') {
          // This is a "ghost" navigation after a click - skip it
          continue;
        }

        // 3. LOOKAHEAD: Is this just an intermediate step in a redirect chain?
        // If the NEXT valid step is also a navigation, we should skip this one.
        // We only want to write the FINAL navigation in a sequence.
        let isIntermediate = false;
        
        for (let j = i + 1; j < steps.length; j++) {
          const nextStep = steps[j];
          
          // If we hit another navigation...
          if (nextStep.action === 'navigate') {
            // ...and it's a valid one (not junk)
            if (!this.isIgnoredNavigation(nextStep)) {
              // Found a better navigation ahead! This one is intermediate.
              isIntermediate = true;
              break; 
            }
            // If next step IS junk, ignore it and keep looking ahead
            continue; 
          }
          
          // If we hit a user action (click, fill, explicit wait), the chain ends.
          if (nextStep.action === 'click' || nextStep.action === 'fill' || nextStep.action === 'select' || nextStep.action === 'wait') {
             break;
          }
        }

        // If a "better" navigation was found ahead, skip this one
        if (isIntermediate) {
          continue;
        }

        if (step.pageUrl) {
          lines.push(`  await page.goto('${this.escapeString(step.pageUrl)}');`);
          lastWrittenAction = 'navigate';
        }
      } 
      
      // --- HANDLE OTHER ACTIONS ---
      else if (step.action === 'wait') {
        // Wait steps are handled by wait injection later
        continue;
      }
      else if (step.action === 'click') {
        // NEW: Dedupe consecutive identical clicks
        // If we just clicked this exact locator, skip it (prevents double-click noise)
        const currentLocator = JSON.stringify(step.locator);
        const prevStep = i > 0 ? steps[i - 1] : null;
        
        if (prevStep && prevStep.action === 'click') {
          const prevLocator = JSON.stringify(prevStep.locator);
          if (prevLocator === currentLocator) {
            // Skip duplicate consecutive clicks
            continue;
          }
        }
        
        const locatorCode = this.locatorToCode(step.locator);
        lines.push(`  await ${locatorCode}.click();`);
        lastWrittenAction = 'click';
      } 
      else if (step.action === 'fill') {
        const locatorCode = this.locatorToCode(step.locator);
        const value = step.value || '';
        lines.push(`  await ${locatorCode}.fill('${this.escapeString(value)}');`);
        
        if (step.locator.strategy === 'role' && step.locator.role === 'combobox') {
          lines.push(`  await ${locatorCode}.press('Enter');`);
        }
        lastWrittenAction = 'fill';
      } 
      else if (step.action === 'select') {
        const locatorCode = this.locatorToCode(step.locator);
        const value = step.value || '';
        lines.push(`  await ${locatorCode}.selectOption('${this.escapeString(value)}');`);
        lastWrittenAction = 'select';
      }
    }
    
    lines.push("});");
    
    return lines.join('\n');
  }

  /**
   * Convert LocatorDefinition to Playwright code
   */
  private locatorToCode(locator: LocatorDefinition): string {
    switch (locator.strategy) {
      case 'd365-controlname':
        return `page.locator('[data-dyn-controlname="${this.escapeString(locator.controlName)}"]')`;
      
      case 'role':
        return `page.getByRole('${locator.role}', { name: '${this.escapeString(locator.name)}' })`;
      
      case 'label':
        return `page.getByLabel('${this.escapeString(locator.text)}')`;
      
      case 'placeholder':
        return `page.getByPlaceholder('${this.escapeString(locator.text)}')`;
      
      case 'text':
        const exact = locator.exact ? ', { exact: true }' : '';
        return `page.getByText('${this.escapeString(locator.text)}'${exact})`;
      
      case 'testid':
        return `page.locator('[data-test-id="${this.escapeString(locator.value)}"]')`;
      
      case 'css':
        return `page.locator('${this.escapeString(locator.selector)}')`;
      
      case 'xpath':
        return `page.locator('${this.escapeString(locator.expression)}')`;
      
      default:
        return `page.locator('body')`;
    }
  }

  /**
   * Escape string for JavaScript code
   */
  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  }

  /**
   * Send code update to renderer via IPC
   */
  private sendCodeUpdate(): void {
    if (!this.mainWindow || !this.workspacePath) return;

    const code = this.generateCodeFromSteps(this.recordedSteps);
    
    const update: RecorderCodeUpdate = {
      workspacePath: this.workspacePath,
      content: code,
      timestamp: new Date().toISOString(),
    };

    this.mainWindow.webContents.send('recorder:code-update', update);
  }
}
