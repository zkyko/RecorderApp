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

      // SAFETY NET: Spatial Heuristic for Navigation Pane Detection
      // The Navigation Pane is always on the left side of the screen
      // If a user clicks non-interactive text in the left 350px, assume it's navigation
      const findNavigationBySpatialHeuristic = (element: HTMLElement, clickX: number): HTMLElement | null => {
        const LEFT_SIDE_THRESHOLD = 350; // pixels from left edge
        
        // Only apply heuristic if click is in the left 350px
        if (clickX > LEFT_SIDE_THRESHOLD) {
          console.log('[Recorder Safety Net] Click is outside left 350px zone (x=' + clickX + '), skipping spatial heuristic');
          return null;
        }

        console.log('[Recorder Safety Net] Click detected in left-side zone (x=' + clickX + '), checking for navigation...');

        // Helper to check if element is interactive
        const isInteractive = (el: HTMLElement): boolean => {
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role') || '';
          
          // Check if it's an interactive element
          const interactiveRoles = ['button', 'link', 'menuitem', 'treeitem', 'tab', 'checkbox', 'radio'];
          if (interactiveRoles.includes(role)) return true;
          if (tag === 'button' || tag === 'a') return true;
          if (el.matches('button, a, [role=button], [role=link], [role=menuitem], [role=treeitem], input, select, textarea')) return true;
          
          // Check if element has click handlers (approximate check)
          if ((el as any).onclick) return true;
          
          return false;
        };

        // Deep text search: Check the clicked element and its parents for text
        // ALWAYS walk up to find treeitems/links, even if the clicked element is interactive
        const findTextInElementOrParents = (el: HTMLElement): { element: HTMLElement, text: string } | null => {
          let current: HTMLElement | null = el;
          let depth = 0;
          const maxDepth = 10;

          while (current && depth < maxDepth) {
            // Get text content
            let text = '';
            for (const node of Array.from(current.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent || '';
              }
            }
            text = text.trim();

            // Also check aria-label and title
            const ariaLabel = current.getAttribute('aria-label') || '';
            const title = current.getAttribute('title') || '';
            const fullText = text || ariaLabel || title;

            // PRIORITY: If it's a treeitem, link, or has data-dyn-controlname, return it immediately
            const tag = current.tagName.toLowerCase();
            const role = current.getAttribute('role') || '';
            const hasDataDynControlName = current.getAttribute('data-dyn-controlname');
            
            if (fullText.length > 0 && fullText.length <= 100) {
              if (role === 'treeitem' || role === 'link' || tag === 'a' || hasDataDynControlName) {
                console.log('[Recorder Safety Net] Found navigation element with text: "' + fullText + '" (role: ' + role + ', tag: ' + tag + ') at depth ' + depth);
                return { element: current, text: fullText };
              }
              
              // If element is not interactive but has text, it might be navigation
              if (!isInteractive(current)) {
                console.log('[Recorder Safety Net] Found non-interactive text element: "' + fullText + '" at depth ' + depth);
                return { element: current, text: fullText };
              }
            }

            // Move to parent
            current = current.parentElement;
            depth++;
          }

          return null;
        };

        // AGGRESSIVE: For ANY click in left side, walk up to find treeitems/links
        // This catches cases where you click on a child element inside a treeitem
        let current: HTMLElement | null = element;
        let depth = 0;
        const maxDepth = 10;
        
        while (current && depth < maxDepth) {
          const tag = current.tagName.toLowerCase();
          const role = current.getAttribute('role') || '';
          const hasDataDynControlName = current.getAttribute('data-dyn-controlname');
          
          // Get text to verify it's meaningful
          let text = '';
          for (const node of Array.from(current.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent || '';
            }
          }
          text = text.trim();
          const ariaLabel = current.getAttribute('aria-label') || '';
          const title = current.getAttribute('title') || '';
          const fullText = text || ariaLabel || title;
          
          // PRIORITY: If it's a treeitem, link, or has data-dyn-controlname with text, return it
          if (fullText.length > 0 && fullText.length <= 100) {
            if (role === 'treeitem' || role === 'link' || tag === 'a' || hasDataDynControlName) {
              console.log('[Recorder Safety Net] ✓ SAFETY NET TRIGGERED: Found navigation element in left side: "' + fullText + '" (role: ' + role + ', tag: ' + tag + ')');
              return current;
            }
          }
          
          // Move to parent
          current = current.parentElement;
          depth++;
        }
        
        // FALLBACK: Try to find any element with text in the left side
        const textResult = findTextInElementOrParents(element);
        if (textResult && textResult.text.length > 0) {
          console.log('[Recorder Safety Net] ✓ SAFETY NET TRIGGERED: Capturing left-side element with text: "' + textResult.text + '"');
          return textResult.element;
        }
        
        console.log('[Recorder Safety Net] Left-side click but no meaningful navigation element found');

        console.log('[Recorder Safety Net] Spatial heuristic did not find navigation element');
        return null;
      };

      // Intercept click events with CAPTURE PHASE enabled
      // This ensures we intercept events BEFORE D365's internal scripts can stop propagation
      document.addEventListener('click', async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target && (window as any).recorderOnClick) {
          try {
            const clickX = event.clientX || 0; // Get click X coordinate for spatial heuristic

            // Priority 1: Check if this click should target the navigation pane button
            const navPaneButton = findNavigationPaneButton(target);
            if (navPaneButton) {
              console.log('[Recorder] Priority 1: Navigation pane button detected');
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
              console.log('[Recorder] Priority 2: Navigation pane link detected');
              const elementId = getElementId(navPaneLink);
              await (window as any).recorderOnClick({
                selector: elementId,
                timestamp: Date.now(),
              });
              return;
            }

            // Priority 3: SAFETY NET - Spatial Heuristic for left-side clicks
            // This catches navigation clicks that the class-name-based detection missed
            const spatialNavElement = findNavigationBySpatialHeuristic(target, clickX);
            if (spatialNavElement) {
              console.log('[Recorder] Priority 3: Spatial heuristic safety net triggered');
              console.log('[Recorder] Spatial element tag: ' + spatialNavElement.tagName + ', role: ' + (spatialNavElement.getAttribute('role') || 'none') + ', text: "' + (spatialNavElement.textContent?.trim().substring(0, 50) || '') + '"');
              const elementId = getElementId(spatialNavElement);
              await (window as any).recorderOnClick({
                selector: elementId,
                timestamp: Date.now(),
              });
              return;
            }
            
            // Debug: Log what we're about to record as default
            console.log('[Recorder] Default element tag: ' + target.tagName + ', role: ' + (target.getAttribute('role') || 'none') + ', text: "' + (target.textContent?.trim().substring(0, 50) || '') + '", clickX: ' + clickX);

            // Default: Record the clicked element as-is
            console.log('[Recorder] Default: Recording clicked element as-is');
            const elementId = getElementId(target);
            await (window as any).recorderOnClick({
              selector: elementId,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error('[Recorder] Error in click handler:', error);
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

    // Monitor console for D365-specific events and forward recorder debug logs
    page.on('console', (msg) => {
      const text = msg.text();
      // Forward console messages from the page to terminal for debugging
      // This includes messages from our injected spatial heuristic safety net
      if (text.includes('[Recorder') || text.includes('[Recorder Safety Net]')) {
        console.log('[Browser Console]', text);
      }
    });
  }
}

