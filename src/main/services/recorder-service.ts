import { BrowserWindow, ipcMain } from 'electron';
import { BrowserManager } from '../../core/playwright/browser-manager';
import { RecorderEngine } from '../../core/recorder/recorder-engine';
import { RecordedStep, LocatorDefinition } from '../../types';
import { RecorderStartRequest, RecorderStartResponse, RecorderStopResponse, RecorderCodeUpdate } from '../../types/v1.5';
import { Page } from 'playwright';
import { NavigationCleanupService } from './navigation-cleanup-service';
import { makeSafeIdentifier } from '../../core/utils/identifiers';

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
   * Stop recording and return generated code and cleaned steps
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

      // Clean and filter steps for Step Editor UI
      const cleanedSteps = this.cleanSteps([...this.recordedSteps]);
      
      // Generate code from cleaned steps
      const code = this.compileSteps(cleanedSteps);
      
      // Note: Navigation cleanup is now handled in LocatorCleanupService
      // So we return raw code here, and cleanup happens when UI calls locator cleanup
      // This ensures consistent pipeline for both recorder and codegen paths
      
      // Clear recorded steps
      this.recordedSteps = [];

      return {
        success: true,
        rawCode: code,
        steps: cleanedSteps,
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
   * SAFETY NET: Spatial Heuristic for Navigation Pane Detection
   * 
   * Constant Fact: The Navigation Pane is always on the left side of the screen.
   * 
   * The "Left-Side" Rule: If a user clicks non-interactive text in the left 350px 
   * of the screen (where the menu lives), we assume it's a navigation click and capture it.
   * 
   * This acts as a safety net when class-name-based detection fails due to:
   * - D365 changing class names
   * - Dynamic content rendering
   * - Nested elements with unusual formatting
   * 
   * Deep Text Search: Checks the clicked element and its parents for text,
   * in case you clicked a weird formatting div inside the link.
   * 
   * Debug Logs: The event listeners now include console logging so you can see
   * exactly what the recorder is seeing (or ignoring) in your terminal.
   */
  private async validateNavigationClickBySpatialHeuristic(
    page: Page, 
    element: any, 
    clickX: number
  ): Promise<boolean> {
    if (!page || !element) return false;

    const LEFT_SIDE_THRESHOLD = 350; // pixels from left edge

    try {
      // Check if click is in the left-side zone
      if (clickX > LEFT_SIDE_THRESHOLD) {
        return false;
      }

      // Evaluate element to check if it's non-interactive text
      const result = await element.evaluate((el: HTMLElement) => {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role') || '';
        
        // Check if it's interactive
        const interactiveRoles = ['button', 'link', 'menuitem', 'treeitem', 'tab', 'checkbox', 'radio'];
        const isInteractive = 
          interactiveRoles.includes(role) ||
          tag === 'button' || tag === 'a' ||
          el.matches('button, a, [role=button], [role=link], [role=menuitem], [role=treeitem], input, select, textarea');

        // Get text content
        let text = '';
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent || '';
          }
        }
        text = text.trim();

        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const fullText = text || ariaLabel || title;

        return {
          isInteractive,
          hasText: fullText.length > 0 && fullText.length <= 100,
          text: fullText
        };
      });

      // If non-interactive with text in left side, likely navigation
      return !result.isInteractive && result.hasText;
    } catch (error) {
      console.error('[Recorder Service] Error validating navigation click:', error);
      return false;
    }
  }

  /**
   * Clean and filter recorded steps
   * Applies smart filtering: auth removal, redirect chain collapsing, interaction awareness
   * This returns a high-quality list of steps for the Step Editor UI
   */
  public cleanSteps(steps: RecordedStep[]): RecordedStep[] {
    const cleaned: RecordedStep[] = [];
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

        // Keep this navigation step
        cleaned.push(step);
        lastWrittenAction = 'navigate';
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
        const prevStep = cleaned.length > 0 ? cleaned[cleaned.length - 1] : null;
        
        if (prevStep && prevStep.action === 'click') {
          const prevLocator = JSON.stringify(prevStep.locator);
          if (prevLocator === currentLocator) {
            // Skip duplicate consecutive clicks
            continue;
          }
        }
        
        cleaned.push(step);
        lastWrittenAction = 'click';
      } 
      else if (step.action === 'fill') {
        cleaned.push(step);
        lastWrittenAction = 'fill';
      } 
      else if (step.action === 'select') {
        cleaned.push(step);
        lastWrittenAction = 'select';
      }
    }
    
    return cleaned;
  }

  /**
   * Compile a list of steps into Playwright test code string
   * This method is called by the Step Editor UI after user edits steps
   */
  public compileSteps(steps: RecordedStep[]): string {
    const lines: string[] = [];
    
    // Check if any steps are parameterized
    const hasParameters = steps.some(step => {
      const value = step.value || '';
      return value.startsWith('{{') && value.endsWith('}}');
    });
    
    // Add imports
    lines.push("import { test } from '@playwright/test';");
    if (hasParameters) {
      // Extract test name from first step or use default
      const testName = this.extractTestName(steps);
      lines.push(`import data from '../data/${testName}.json';`);
      lines.push("import { waitForD365 } from '../runtime/d365-waits';");
      lines.push("");
      lines.push(`test.describe('${testName} - Data Driven', () => {`);
      lines.push("  test.setTimeout(120_000); // 2 minutes for D365");
      lines.push("");
      lines.push("  for (const row of data) {");
      lines.push("    test(`${row.name || row.id || 'Test'}`, async ({ page }) => {");
    } else {
      lines.push("");
      lines.push("test('test', async ({ page }) => {");
    }
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nextStep = i < steps.length - 1 ? steps[i + 1] : null;
      
      // Helper to check if next step is already a wait action
      const isNextStepWait = (): boolean => {
        if (!nextStep) return false;
        return (
          (nextStep.action === 'custom' && (nextStep as any).customAction === 'waitForD365') ||
          nextStep.action === 'wait'
        );
      };
      
      // Helper to add line with proper semicolon handling
      const addLine = (line: string): void => {
        const trimmed = line.trim();
        // Only add semicolon if line doesn't already end with one and it's not a comment
        if (!trimmed.startsWith('//') && !trimmed.endsWith(';') && !trimmed.endsWith('}')) {
          lines.push(`      ${trimmed};`);
        } else {
          lines.push(`      ${trimmed}`);
        }
      };
      
      if (step.action === 'navigate') {
        if (step.pageUrl) {
          addLine(`await page.goto('${this.escapeString(step.pageUrl)}')`);
        }
      }
      else if (step.action === 'custom' && (step as any).customAction === 'waitForD365') {
        addLine(`await waitForD365(page)`);
      }
      else if (step.action === 'wait') {
        const waitTime = step.value || '1000';
        addLine(`await page.waitForTimeout(${waitTime})`);
      }
      else if (step.action === 'comment') {
        const commentText = step.value || 'New Step';
        lines.push(`      // ${commentText}`);
      }
      else if (step.action === 'click') {
        if (!step.locator) continue; // Skip if no locator
        const locatorCode = this.locatorToCode(step.locator);
        addLine(`await ${locatorCode}.click()`);
        // Only inject wait if next step is NOT already a wait action
        if (hasParameters && !isNextStepWait()) {
          addLine(`await waitForD365(page)`);
        }
      } 
      else if (step.action === 'fill') {
        if (!step.locator) continue; // Skip if no locator
        const locatorCode = this.locatorToCode(step.locator);
        const value = step.value || '';
        
        // Check if value is parameterized (wrapped in {{ }})
        if (value.startsWith('{{') && value.endsWith('}}')) {
          // Extract the original value and generate parameter name
          const originalValue = value.slice(2, -2); // Remove {{ }}
          const paramName = this.generateParameterName(step);
          addLine(`await ${locatorCode}.fill(row.${paramName})`);
        } else {
          addLine(`await ${locatorCode}.fill('${this.escapeString(value)}')`);
        }
        
        if (step.locator.strategy === 'role' && 'role' in step.locator && step.locator.role === 'combobox') {
          addLine(`await ${locatorCode}.press('Enter')`);
          // Only inject wait if next step is NOT already a wait action
          if (hasParameters && !isNextStepWait()) {
            addLine(`await waitForD365(page)`);
          }
        }
      } 
      else if (step.action === 'select') {
        if (!step.locator) continue; // Skip if no locator
        const locatorCode = this.locatorToCode(step.locator);
        const value = step.value || '';
        
        // Check if value is parameterized (wrapped in {{ }})
        if (value.startsWith('{{') && value.endsWith('}}')) {
          // Extract the original value and generate parameter name
          const originalValue = value.slice(2, -2); // Remove {{ }}
          const paramName = this.generateParameterName(step);
          addLine(`await ${locatorCode}.selectOption(row.${paramName})`);
        } else {
          addLine(`await ${locatorCode}.selectOption('${this.escapeString(value)}')`);
        }
        // Only inject wait if next step is NOT already a wait action
        if (hasParameters && !isNextStepWait()) {
          addLine(`await waitForD365(page)`);
        }
      }
    }
    
    if (hasParameters) {
      lines.push("    });");
      lines.push("  }");
      lines.push("});");
    } else {
      lines.push("});");
    }
    
    return lines.join('\n');
  }

  /**
   * Generate a parameter name from a step's description or field name
   */
  private generateParameterName(step: RecordedStep): string {
    // Try to extract field name from description (e.g., "Fill 'Customer account' = '100001'" -> "customerAccount")
    if (step.description) {
      // Pattern: "Fill 'Customer account' = ..." or "Select 'Item number' = ..."
      const match = step.description.match(/['"]([^'"]+)['"]/);
      if (match && match[1]) {
        return makeSafeIdentifier(match[1]);
      }
    }
    
    // Fallback to fieldName if available
    if (step.fieldName) {
      return makeSafeIdentifier(step.fieldName);
    }
    
    // Fallback to description
    if (step.description) {
      return makeSafeIdentifier(step.description);
    }
    
    // Last resort
    return 'value';
  }

  /**
   * Extract test name from steps (for data file naming)
   */
  private extractTestName(steps: RecordedStep[]): string {
    // Try to get from first navigation step's URL or use default
    const navStep = steps.find(s => s.action === 'navigate');
    if (navStep?.pageUrl) {
      try {
        const url = new URL(navStep.pageUrl);
        const mi = url.searchParams.get('mi');
        if (mi) {
          return makeSafeIdentifier(mi);
        }
      } catch {
        // Ignore URL parsing errors
      }
    }
    return 'test';
  }

  /**
   * Convert RecordedStep[] to Playwright code string
   * IMPROVED: Uses Lookahead logic and Interaction Awareness to collapse navigations
   * @deprecated Use cleanSteps() + compileSteps() instead for Step Editor support
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
        
        if (prevStep && prevStep.action === 'click' && prevStep.locator) {
          const prevLocator = JSON.stringify(prevStep.locator);
          if (prevLocator === currentLocator) {
            // Skip duplicate consecutive clicks
            continue;
          }
        }
        
        if (!step.locator) continue; // Skip if no locator
        const locatorCode = this.locatorToCode(step.locator);
        lines.push(`  await ${locatorCode}.click();`);
        lastWrittenAction = 'click';
      } 
      else if (step.action === 'fill') {
        if (!step.locator) continue; // Skip if no locator
        const locatorCode = this.locatorToCode(step.locator);
        const value = step.value || '';
        lines.push(`  await ${locatorCode}.fill('${this.escapeString(value)}');`);
        
        if (step.locator.strategy === 'role' && 'role' in step.locator && step.locator.role === 'combobox') {
          lines.push(`  await ${locatorCode}.press('Enter');`);
        }
        lastWrittenAction = 'fill';
      } 
      else if (step.action === 'select') {
        if (!step.locator) continue; // Skip if no locator
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

    // Use cleaned steps for live updates to show what will be in Step Editor
    const cleanedSteps = this.cleanSteps(this.recordedSteps);
    const code = this.compileSteps(cleanedSteps);
    
    const update: RecorderCodeUpdate = {
      workspacePath: this.workspacePath,
      content: code,
      timestamp: new Date().toISOString(),
    };

    this.mainWindow.webContents.send('recorder:code-update', update);
  }
}
