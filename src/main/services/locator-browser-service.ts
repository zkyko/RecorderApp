import { BrowserWindow, ipcMain } from 'electron';
import { BrowserManager } from '../../core/playwright/browser-manager';
import { Page } from 'playwright';
import { LocatorEvaluator, LocatorEvaluation } from './locator-evaluator';
import { LocatorDefinition } from '../../types';

export interface LocatorBrowserStartRequest {
  workspacePath: string;
  storageStatePath?: string;
  url?: string;
}

export interface LocatorBrowserStartResponse {
  success: boolean;
  error?: string;
}

export interface LocatorBrowserStopResponse {
  success: boolean;
  error?: string;
}

export interface ElementHoverEvent {
  elementInfo: {
    tag: string;
    id?: string;
    classes?: string;
    text?: string;
    ariaLabel?: string;
    title?: string;
  };
  evaluation?: LocatorEvaluation;
}

/**
 * Service for browsing and inspecting elements to capture locators
 * Similar to RecorderService but focused on element inspection
 */
export class LocatorBrowserService {
  private browserManager: BrowserManager;
  private mainWindow: BrowserWindow | null = null;
  private currentPage: Page | null = null;
  private locatorEvaluator: LocatorEvaluator;
  private isBrowsing: boolean = false;
  private clickedElements: Array<{ elementInfo: any; evaluation: LocatorEvaluation; timestamp: number }> = [];

  constructor() {
    this.browserManager = new BrowserManager();
    this.locatorEvaluator = new LocatorEvaluator();
  }

  /**
   * Set main window for IPC communication
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Start browsing mode
   */
  async start(request: LocatorBrowserStartRequest): Promise<LocatorBrowserStartResponse> {
    try {
      if (this.isBrowsing) {
        return { success: false, error: 'Browsing already in progress' };
      }

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
      this.isBrowsing = true;
      this.clickedElements = []; // Reset clicked elements

      // Inject element inspection scripts BEFORE navigation (so they're ready)
      await this.injectInspectionScripts(page);

      // Navigate to URL if provided
      if (request.url) {
        await page.goto(request.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Wait a bit for page to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Re-inject scripts after navigation (D365 might reload the page)
        await this.injectInspectionScriptsAfterLoad(page);
      } else {
        // Even if no URL, inject after load
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.injectInspectionScriptsAfterLoad(page);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to start browser' };
    }
  }

  /**
   * Stop browsing mode
   */
  async stop(): Promise<LocatorBrowserStopResponse> {
    try {
      if (this.currentPage) {
        await this.currentPage.close().catch(() => {});
        this.currentPage = null;
      }
      await this.browserManager.close();
      this.isBrowsing = false;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to stop browser' };
    }
  }

  /**
   * Inject scripts for element highlighting and inspection
   */
  private async injectInspectionScripts(page: Page): Promise<void> {
    const context = page.context();

    // Expose functions for communication
    await page.exposeFunction('locatorBrowserOnHover', async (data: any) => {
      if (this.mainWindow && this.currentPage) {
        await this.handleElementHover(data);
      }
    });

    await page.exposeFunction('locatorBrowserOnClick', async (data: any) => {
      if (this.mainWindow && this.currentPage) {
        await this.handleElementClick(data);
      }
    });

    // Inject inspection script at context level (runs in all frames)
    await context.addInitScript(() => {
      // Highlight element on hover
      let currentHighlight: HTMLElement | null = null;
      let highlightStyle: HTMLStyleElement | null = null;

      // Create highlight style
      if (!highlightStyle) {
        highlightStyle = document.createElement('style');
        highlightStyle.textContent = `
          .locator-browser-highlight {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            cursor: crosshair !important;
          }
        `;
        document.head.appendChild(highlightStyle);
      }

      // Optional: Highlight on hover (non-intrusive)
      document.addEventListener('mouseover', (e) => {
        const element = e.target as HTMLElement;
        if (!element || element === document.body || element === document.documentElement) return;

        // Remove previous highlight
        if (currentHighlight) {
          currentHighlight.classList.remove('locator-browser-highlight');
        }

        // Add highlight to current element
        element.classList.add('locator-browser-highlight');
        currentHighlight = element;
      }, true);

      document.addEventListener('mouseout', (e) => {
        const element = e.target as HTMLElement;
        if (element) {
          element.classList.remove('locator-browser-highlight');
        }
      }, true);

      // Track clicks WITHOUT preventing them - let D365 work normally
      document.addEventListener('click', async (e) => {
        try {
          const element = e.target as HTMLElement;
          if (!element || element === document.body || element === document.documentElement) return;

          // Don't prevent the click - just track it
          const elementInfo = {
            tag: element.tagName.toLowerCase(),
            id: element.id || undefined,
            classes: element.className || undefined,
            text: element.textContent?.trim().substring(0, 100) || undefined,
            ariaLabel: element.getAttribute('aria-label') || undefined,
            title: element.getAttribute('title') || (element as HTMLElement).title || undefined,
          };

          // Send click event (non-blocking)
          if ((window as any).locatorBrowserOnClick) {
            // Use setTimeout to avoid blocking the click
            setTimeout(async () => {
              try {
                await (window as any).locatorBrowserOnClick({
                  selector: getElementSelector(element),
                  elementInfo,
                });
              } catch (error) {
                console.error('[LocatorBrowser] Error sending click event:', error);
              }
            }, 0);
          } else {
            console.warn('[LocatorBrowser] locatorBrowserOnClick function not available');
          }
        } catch (error) {
          console.error('[LocatorBrowser] Error in click handler:', error);
        }
      }, true);

      // Helper to generate a simple selector for identification
      const getElementSelector = (el: HTMLElement): string => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-test-id')) {
          return `[data-test-id="${el.getAttribute('data-test-id')}"]`;
        }
        if (el.getAttribute('data-qa')) {
          return `[data-qa="${el.getAttribute('data-qa')}"]`;
        }
        return el.tagName.toLowerCase();
      };
    });

  }

  /**
   * Inject scripts after page load (fallback/re-injection)
   */
  private async injectInspectionScriptsAfterLoad(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        // Check if functions are available
        if (!(window as any).locatorBrowserOnClick) {
          console.warn('[LocatorBrowser] Exposed functions not available, re-injecting...');
        }

        // Re-create highlight style if needed
        if (!document.getElementById('locator-browser-style')) {
          const highlightStyle = document.createElement('style');
          highlightStyle.id = 'locator-browser-style';
          highlightStyle.textContent = `
            .locator-browser-highlight {
              outline: 3px solid #3b82f6 !important;
              outline-offset: 2px !important;
              background-color: rgba(59, 130, 246, 0.1) !important;
              cursor: crosshair !important;
            }
          `;
          document.head.appendChild(highlightStyle);
        }

        // Re-attach click listener if not already attached
        if (!(document as any).__locatorBrowserClickAttached) {
          document.addEventListener('click', async (e) => {
            try {
              const element = e.target as HTMLElement;
              if (!element || element === document.body || element === document.documentElement) return;

              const elementInfo = {
                tag: element.tagName.toLowerCase(),
                id: element.id || undefined,
                classes: element.className || undefined,
                text: element.textContent?.trim().substring(0, 100) || undefined,
                ariaLabel: element.getAttribute('aria-label') || undefined,
                title: element.getAttribute('title') || (element as HTMLElement).title || undefined,
              };

              function getElementSelector(el: HTMLElement): string {
                if (el.id) return `#${el.id}`;
                if (el.getAttribute('data-test-id')) {
                  return `[data-test-id="${el.getAttribute('data-test-id')}"]`;
                }
                if (el.getAttribute('data-qa')) {
                  return `[data-qa="${el.getAttribute('data-qa')}"]`;
                }
                return el.tagName.toLowerCase();
              }

              if ((window as any).locatorBrowserOnClick) {
                setTimeout(async () => {
                  try {
                    await (window as any).locatorBrowserOnClick({
                      selector: getElementSelector(element),
                      elementInfo,
                    });
                  } catch (error) {
                    console.error('[LocatorBrowser] Error sending click event:', error);
                  }
                }, 0);
              }
            } catch (error) {
              console.error('[LocatorBrowser] Error in click handler:', error);
            }
          }, true);
          (document as any).__locatorBrowserClickAttached = true;
          console.log('[LocatorBrowser] Click listener attached after page load');
        }
      });
    } catch (error) {
      console.error('[LocatorBrowser] Error injecting scripts after load:', error);
    }
  }

  /**
   * Handle element hover event
   */
  private async handleElementHover(data: { selector: string; elementInfo: any }): Promise<void> {
    if (!this.currentPage || !this.mainWindow) return;

    try {
      // Find element by selector
      const element = await this.currentPage.$(data.selector).catch(() => null);
      if (!element) {
        // Try to find by other means
        const elementByInfo = await this.findElementByInfo(data.elementInfo);
        if (elementByInfo) {
          const evaluation = await this.locatorEvaluator.evaluateLocator(this.currentPage, elementByInfo);
          this.mainWindow.webContents.send('locator:browse:elementHover', {
            elementInfo: data.elementInfo,
            evaluation,
          });
        }
        return;
      }

      // Evaluate locator
      const evaluation = await this.locatorEvaluator.evaluateLocator(this.currentPage, element);
      
      // Send to UI
      this.mainWindow.webContents.send('locator:browse:elementHover', {
        elementInfo: data.elementInfo,
        evaluation,
      });
    } catch (error) {
      console.error('Error handling element hover:', error);
    }
  }

  /**
   * Handle element click event - track last 5 clicked elements
   */
  private async handleElementClick(data: { selector: string; elementInfo: any }): Promise<void> {
    if (!this.currentPage || !this.mainWindow) {
      console.warn('[LocatorBrowser] handleElementClick: No page or mainWindow');
      return;
    }

    console.log('[LocatorBrowser] Click captured:', data.elementInfo.tag, data.selector);

    try {
      // Find element - try multiple methods
      let element = await this.currentPage.$(data.selector).catch(() => null);
      
      // If selector didn't work, try finding by element info
      if (!element) {
        element = await this.findElementByInfo(data.elementInfo);
      }
      
      // If still no element, try to find by waiting a bit (element might be in transition)
      if (!element) {
        await new Promise(resolve => setTimeout(resolve, 100));
        element = await this.currentPage.$(data.selector).catch(() => null);
        if (!element) {
          element = await this.findElementByInfo(data.elementInfo);
        }
      }

      let evaluation: LocatorEvaluation;

      if (!element) {
        console.warn('[LocatorBrowser] Could not find element for evaluation, using fallback');
        // Still can't find element, but we can still track it with basic info
        evaluation = {
          locator: { strategy: 'css', selector: data.selector, flagged: true },
          quality: { score: 0, level: 'weak', reason: 'Element not found for evaluation' },
          uniqueness: { isUnique: false, matchCount: -1, score: 0 },
          usability: { score: 0, level: 'poor', recommendation: 'Element could not be evaluated' },
        };
      } else {
        console.log('[LocatorBrowser] Element found, evaluating locator...');
        // Evaluate locator
        evaluation = await this.locatorEvaluator.evaluateLocator(this.currentPage, element);
        console.log('[LocatorBrowser] Evaluation complete:', evaluation.usability.score);
      }
      
      // Add to clicked elements queue (most recent first)
      this.clickedElements.unshift({
        elementInfo: data.elementInfo,
        evaluation,
        timestamp: Date.now(),
      });

      // Keep only last 5
      if (this.clickedElements.length > 5) {
        this.clickedElements = this.clickedElements.slice(0, 5);
      }
      
      console.log('[LocatorBrowser] Sending clickedElements to UI, count:', this.clickedElements.length);
      console.log('[LocatorBrowser] MainWindow exists:', !!this.mainWindow);
      console.log('[LocatorBrowser] MainWindow destroyed:', this.mainWindow?.isDestroyed());
      
      // Send updated list to UI
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        try {
          this.mainWindow.webContents.send('locator:browse:clickedElements', this.clickedElements);
          console.log('[LocatorBrowser] Event sent successfully');
        } catch (error) {
          console.error('[LocatorBrowser] Error sending event:', error);
        }
      } else {
        console.warn('[LocatorBrowser] Cannot send event - mainWindow is null or destroyed');
      }
    } catch (error) {
      console.error('[LocatorBrowser] Error handling element click:', error);
      // Even on error, try to send what we have
      if (this.mainWindow) {
        this.mainWindow.webContents.send('locator:browse:clickedElements', this.clickedElements);
      }
    }
  }

  /**
   * Find element by info (fallback method)
   */
  private async findElementByInfo(elementInfo: any): Promise<any> {
    if (!this.currentPage) return null;

    try {
      if (elementInfo.id) {
        const el = await this.currentPage.$(`#${elementInfo.id}`).catch(() => null);
        if (el) return el;
      }
      if (elementInfo.ariaLabel) {
        try {
          const locator = this.currentPage.getByLabel(elementInfo.ariaLabel).first();
          const el = await locator.elementHandle().catch(() => null);
          if (el) return el;
        } catch (e) {
          // Ignore
        }
      }
      // Try to find by tag and text
      if (elementInfo.text && elementInfo.text.trim().length > 0 && elementInfo.text.length < 50) {
        try {
          const locator = this.currentPage.getByText(elementInfo.text.trim(), { exact: false }).first();
          const el = await locator.elementHandle().catch(() => null);
          if (el) return el;
        } catch (e) {
          // Ignore
        }
      }
    } catch (error) {
      console.error('[LocatorBrowser] Error in findElementByInfo:', error);
    }
    return null;
  }
}

