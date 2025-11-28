import { Page } from 'playwright';

/**
 * Injects event listeners into the page to intercept user interactions
 */
export class EventListeners {
  /**
   * Inject scripts to intercept clicks, inputs, and other interactions
   * Uses context-level init scripts to ensure listeners run in all frames (including iframes)
   */
  static async injectListeners(page: Page, onEvent: (event: any) => void): Promise<void> {
    // Expose functions that can be called from the page
    await page.exposeFunction('recorderOnClick', async (data: any) => {
      onEvent({ type: 'click', ...data });
    });

    await page.exposeFunction('recorderOnInput', async (data: any) => {
      onEvent({ type: 'fill', ...data });
    });

    await page.exposeFunction('recorderOnChange', async (data: any) => {
      onEvent({ type: 'select', ...data });
    });

    // Get context from page to inject script at context level (runs in all frames)
    const context = page.context();
    
    // CRITICAL: Use context.addInitScript() to ensure listeners run in ALL frames (including iframes)
    // This is the "nuclear" option - injects before D365 can stop events
    await context.addInitScript(() => {
      // Helper to get element identifier
      const getElementId = (element: HTMLElement): string => {
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-test-id')) return `[data-test-id="${element.getAttribute('data-test-id')}"]`;
        if (element.getAttribute('data-qa')) return `[data-qa="${element.getAttribute('data-qa')}"]`;
        if (element.getAttribute('name')) return `[name="${element.getAttribute('name')}"]`;
        // Generate a unique selector path
        const path: string[] = [];
        let current: HTMLElement | null = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let selector = current.tagName.toLowerCase();
          if (current.id) {
            path.unshift(`#${current.id}`);
            break;
          }
          let index = 1;
          let sibling = current.previousElementSibling;
          while (sibling) {
            if (sibling.tagName === current.tagName) index++;
            sibling = sibling.previousElementSibling;
          }
          if (index > 1) selector += `:nth-of-type(${index})`;
          path.unshift(selector);
          current = current.parentElement;
          if (path.length > 10) break;
        }
        return path.join(' > ');
      };

      // Debounce map for input events (to avoid recording each keystroke)
      const inputDebounceTimers = new Map<HTMLElement, number>();

      // Helper to check if element is in D365 navigation pane
      const isInNavigationPane = (elem: HTMLElement): boolean => {
        let current: HTMLElement | null = elem;
        let depth = 0;
        const maxDepth = 15; // Navigation pane can be deeply nested

        while (current && depth < maxDepth) {
          const className = current.className || '';
          const id = current.id || '';
          const role = current.getAttribute('role') || '';

            // Check for common D365 navigation pane containers
            if (
              className.includes('modulesPane') ||
              className.includes('navigation') ||
              className.includes('nav-pane') ||
              className.includes('NavPane') ||
              className.includes('treeView') ||
              className.includes('tree-view') ||
              id.includes('nav') ||
              id.includes('modules') ||
              role === 'navigation' ||
              current.getAttribute('data-dyn-controlname')?.includes('Nav')
            ) {
              return true;
            }

          current = current.parentElement;
          depth++;
        }

        return false;
      };

      // Helper to find D365 Navigation Pane button by walking up DOM tree
      const findNavigationPaneButton = (element: HTMLElement): HTMLElement | null => {
        let current: HTMLElement | null = element;
        let depth = 0;
        const maxDepth = 10; // Safety limit

        while (current && depth < maxDepth) {
          // Check if this element is the navigation pane button
          const controlName = current.getAttribute('data-dyn-controlname');
          const ariaLabel = current.getAttribute('aria-label');
          const title = current.getAttribute('title') || (current as any).title;

          // Match navigation pane button attributes
          if (controlName === 'NavBarDashboard' ||
              (ariaLabel && ariaLabel.toLowerCase().includes('expand the navigation pane')) ||
              (title && title.toLowerCase().includes('expand the navigation pane'))) {
            return current;
          }

          // Check if it's a button with navigation pane attributes
          if (current.tagName === 'BUTTON' || current.getAttribute('role') === 'button') {
            const label = (ariaLabel || title || '').toLowerCase();
            if (label.includes('navigation') && 
                (label.includes('expand') || label.includes('menu'))) {
              return current;
            }
          }

          // Move to parent
          current = current.parentElement;
          depth++;
        }

        return null;
      };

      // Helper to find D365 Navigation Pane link by walking up DOM tree
      // This handles clicks on navigation tree leaf nodes like "All sales orders"
      const findNavigationPaneLink = (element: HTMLElement): HTMLElement | null => {
        let current: HTMLElement | null = element;
        let depth = 0;
        const maxDepth = 10; // Safety limit

        while (current && depth < maxDepth) {
          const tag = current.tagName.toLowerCase();
          const role = current.getAttribute('role') || '';
          const dataDynControlName = current.getAttribute('data-dyn-controlname');

          // PRIORITY 1: If element has data-dyn-controlname and is in navigation pane, FORCE capture it
          // This is a common D365 pattern for navigation links like "All sales orders"
          if (dataDynControlName && isInNavigationPane(current)) {
            // Verify it has meaningful text content
            const text = current.textContent?.trim() || '';
            const ariaLabel = current.getAttribute('aria-label') || '';
            const title = current.getAttribute('title') || '';

            // Must have some label or text to be meaningful
            if (text.length > 0 || ariaLabel.length > 0 || title.length > 0) {
              return current;
            }
          }

          // PRIORITY 2: Check if this is a link element (a tag, role="link", or role="treeitem")
          const isLink = tag === 'a' || role === 'link' || role === 'treeitem';

          // Check if we're in the navigation pane
          if (isLink && isInNavigationPane(current)) {
            // Verify it has meaningful text content
            const text = current.textContent?.trim() || '';
            const ariaLabel = current.getAttribute('aria-label') || '';
            const title = current.getAttribute('title') || '';

            // Must have some label or text to be meaningful
            if (text.length > 0 || ariaLabel.length > 0 || title.length > 0) {
              return current;
            }
          }

          // Move to parent
          current = current.parentElement;
          depth++;
        }

        return null;
      };

      // Intercept click events with CAPTURE PHASE enabled
      // This ensures we intercept events BEFORE D365's internal scripts can stop propagation
      document.addEventListener('click', async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target && (window as any).recorderOnClick) {
          try {
            // Priority 1: Check if this click should target the navigation pane button
            const navPaneButton = findNavigationPaneButton(target);
            if (navPaneButton) {
              const elementId = getElementId(navPaneButton);
              await (window as any).recorderOnClick({
                selector: elementId,
                timestamp: Date.now(),
              });
              return;
            }

            // Priority 2: Check if this click should target a navigation pane link
            const navPaneLink = findNavigationPaneLink(target);
            if (navPaneLink) {
              const elementId = getElementId(navPaneLink);
              await (window as any).recorderOnClick({
                selector: elementId,
                timestamp: Date.now(),
              });
              return;
            }

            // Default: Record the clicked element as-is
            const elementId = getElementId(target);
            await (window as any).recorderOnClick({
              selector: elementId,
              timestamp: Date.now(),
            });
          } catch (error) {
            // Silently ignore if function not available yet
          }
        }
      }, { capture: true }); // Enable capture phase to intercept BEFORE D365 scripts

      // Intercept input events (debounced to avoid multiple steps per field)
      document.addEventListener('input', async (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          // Clear existing timer for this element
          const existingTimer = inputDebounceTimers.get(target as HTMLElement);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }
          
          // Set new timer - only fire after 800ms of no typing
          const timer = window.setTimeout(async () => {
            if ((window as any).recorderOnInput) {
              try {
                const elementId = getElementId(target as HTMLElement);
                await (window as any).recorderOnInput({
                  selector: elementId,
                  value: target.value,
                  timestamp: Date.now(),
                });
                // Remove timer from map after firing
                inputDebounceTimers.delete(target as HTMLElement);
              } catch (error) {
                // Silently ignore if function not available yet
              }
            }
          }, 800); // 800ms debounce delay
          
          inputDebounceTimers.set(target as HTMLElement, timer);
        }
      }, true);

      // Intercept change events
      document.addEventListener('change', async (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        if (target && (window as any).recorderOnChange) {
          try {
            const elementId = getElementId(target);
            await (window as any).recorderOnChange({
              selector: elementId,
              value: target.value,
              timestamp: Date.now(),
            });
          } catch (error) {
            // Silently ignore if function not available yet
          }
        }
      }, true);
    });

    // Also inject after page loads in case context.addInitScript didn't work
    // This is a fallback - context.addInitScript should handle most cases including iframes
    await page.evaluate(() => {
      // Helper to get element identifier
      const getElementId = (element: HTMLElement): string => {
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-test-id')) return `[data-test-id="${element.getAttribute('data-test-id')}"]`;
        if (element.getAttribute('data-qa')) return `[data-qa="${element.getAttribute('data-qa')}"]`;
        if (element.getAttribute('name')) return `[name="${element.getAttribute('name')}"]`;
        const path: string[] = [];
        let current: HTMLElement | null = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let selector = current.tagName.toLowerCase();
          if (current.id) {
            path.unshift(`#${current.id}`);
            break;
          }
          let index = 1;
          let sibling = current.previousElementSibling;
          while (sibling) {
            if (sibling.tagName === current.tagName) index++;
            sibling = sibling.previousElementSibling;
          }
          if (index > 1) selector += `:nth-of-type(${index})`;
          path.unshift(selector);
          current = current.parentElement;
          if (path.length > 10) break;
        }
        return path.join(' > ');
      };

      // Debounce map for input events (to avoid recording each keystroke)
      const inputDebounceTimers = new Map<HTMLElement, number>();

      // Intercept click events
      document.addEventListener('click', async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target && (window as any).recorderOnClick) {
          try {
            const elementId = getElementId(target);
            await (window as any).recorderOnClick({
              selector: elementId,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error('Recorder click error:', error);
          }
        }
      }, true);

      // Intercept input events (debounced to avoid multiple steps per field)
      document.addEventListener('input', async (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          // Clear existing timer for this element
          const existingTimer = inputDebounceTimers.get(target as HTMLElement);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }
          
          // Set new timer - only fire after 800ms of no typing
          const timer = window.setTimeout(async () => {
            if ((window as any).recorderOnInput) {
              try {
                const elementId = getElementId(target as HTMLElement);
                await (window as any).recorderOnInput({
                  selector: elementId,
                  value: target.value,
                  timestamp: Date.now(),
                });
                // Remove timer from map after firing
                inputDebounceTimers.delete(target as HTMLElement);
              } catch (error) {
                console.error('Recorder input error:', error);
              }
            }
          }, 800); // 800ms debounce delay
          
          inputDebounceTimers.set(target as HTMLElement, timer);
        }
      }, true);

      // Intercept change events
      document.addEventListener('change', async (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        if (target && (window as any).recorderOnChange) {
          try {
            const elementId = getElementId(target);
            await (window as any).recorderOnChange({
              selector: elementId,
              value: target.value,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error('Recorder change error:', error);
          }
        }
      }, true);
    });

    // Listen for navigation
    page.on('framenavigated', () => {
      onEvent({ type: 'navigate', url: page.url(), timestamp: Date.now() });
    });
  }

  /**
   * Set up Playwright's built-in request interception for better control
   */
  static async setupPlaywrightListeners(page: Page, onEvent: (event: any) => void): Promise<void> {
    // Use Playwright's route interception to detect navigation
    await page.route('**/*', (route) => {
      route.continue();
    });

    // Monitor console for D365-specific events (optional)
    page.on('console', (msg) => {
      // Could be used to detect D365-specific UI changes
    });
  }
}

