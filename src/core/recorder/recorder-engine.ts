import { Page } from 'playwright';
import { RecordedStep, LocatorDefinition, PageIdentity } from '../../types';
import { EventListeners } from './event-listeners';
import { LocatorExtractor } from '../locators/locator-extractor';
import { PageClassifier } from '../classification/page-classifier';
import { makeSafeIdentifier } from '../utils/identifiers';
import { PageRegistryManager } from '../registry/page-registry';

/**
 * Main recorder engine that coordinates event capture and step creation
 */
export class RecorderEngine {
  private isRecording: boolean = false;
  private page: Page | null = null;
  private onStepRecorded?: (step: RecordedStep) => void;
  private locatorExtractor: LocatorExtractor;
  private pageClassifier: PageClassifier;
  private pageRegistry: PageRegistryManager;
  private currentPageIdentity: PageIdentity | null = null;
  private module?: string;

  constructor(module?: string) {
    this.locatorExtractor = new LocatorExtractor();
    this.pageClassifier = new PageClassifier();
    this.pageRegistry = new PageRegistryManager();
    this.module = module;
  }

  /**
   * Start recording on a page
   */
  async startRecording(page: Page, onStepRecorded: (step: RecordedStep) => void): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.page = page;
    this.onStepRecorded = onStepRecorded;
    this.isRecording = true;

    // Extract initial page identity
    await this.updatePageIdentity(page);

    // Inject event listeners
    await EventListeners.injectListeners(page, (event) => this.handleEvent(event));
    await EventListeners.setupPlaywrightListeners(page, (event) => this.handleEvent(event));

    // Also use Playwright's built-in CDP for more reliable event capture
    await this.setupCDPListeners(page);
  }

  /**
   * Update current page identity from URL and page content
   */
  private async updatePageIdentity(page: Page): Promise<void> {
    try {
      const identity = await this.pageClassifier.extractPageIdentity(page);
      if (identity) {
        this.currentPageIdentity = identity;
        // Register page in registry
        this.pageRegistry.registerPage(identity, this.module);
      }
    } catch (error) {
      console.error('Error updating page identity:', error);
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.isRecording = false;
    this.page = null;
    this.onStepRecorded = undefined;
  }

  /**
   * Handle intercepted events and convert them to RecordedStep
   */
  private async handleEvent(event: any): Promise<void> {
    if (!this.isRecording || !this.page || !this.onStepRecorded) {
      return;
    }

    try {
      let step: RecordedStep | null = null;

      if (event.type === 'click') {
        step = await this.handleClickEvent(event);
      } else if (event.type === 'fill' || event.type === 'input') {
        step = await this.handleInputEvent(event);
      } else if (event.type === 'select' || event.type === 'change') {
        step = await this.handleSelectEvent(event);
      } else if (event.type === 'navigate') {
        // Update page identity on navigation
        if (this.page) {
          await this.updatePageIdentity(this.page);
        }
        // Create navigation step for page.goto - this is important for E2E tests
        step = await this.handleNavigateEvent(event);
      }

      if (step) {
        this.onStepRecorded(step);
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  /**
   * Handle click events
   */
  private async handleClickEvent(event: any): Promise<RecordedStep | null> {
    if (!this.page || !event.selector) {
      return null;
    }

    try {
      // Find element by selector
      let element = await this.page.$(event.selector).catch(() => null);
      if (!element) {
        // Try alternative selectors
        const altSelectors = [
          event.selector,
          `css=${event.selector}`,
          `xpath=//*[@id="${event.selector.replace('#', '')}"]`,
        ];
        
        for (const selector of altSelectors) {
          const el = await this.page.$(selector).catch(() => null);
          if (el) {
            element = el;
            break;
          }
        }
        if (!element) {
          return null;
        }
      }

      // Special handling for D365 Navigation Pane button
      // If the clicked element is an SVG or nested element, walk up to find the button
      const navigationPaneButton = await this.findNavigationPaneButton(element);
      if (navigationPaneButton) {
        element = navigationPaneButton;
      }

      // Special handling for D365 Navigation Pane links (e.g., "All sales orders")
      // These are often nested inside containers and may not pass normal interactive checks
      const navigationPaneLink = await this.findNavigationPaneLink(element);
      if (navigationPaneLink) {
        element = navigationPaneLink;
      }

      return await this.processClickElement(element);
    } catch (error) {
      console.error('Error processing click event:', error);
      return null;
    }
  }

  /**
   * Find the D365 Navigation Pane button by walking up the DOM tree
   * This handles cases where clicks hit SVG icons or nested elements
   */
  private async findNavigationPaneButton(element: any): Promise<any | null> {
    try {
      const button = await element.evaluateHandle((el: HTMLElement) => {
        // Walk up the DOM tree to find the button
        let current: HTMLElement | null = el;
        let depth = 0;
        const maxDepth = 10; // Safety limit

        while (current && depth < maxDepth) {
          // Check if this element is the navigation pane button
          const controlName = current.getAttribute('data-dyn-controlname');
          const ariaLabel = current.getAttribute('aria-label');
          const title = current.getAttribute('title') || (current as any).title;

          // Match navigation pane button attributes
          if (controlName === 'NavBarDashboard' ||
              ariaLabel?.toLowerCase().includes('expand the navigation pane') ||
              title?.toLowerCase().includes('expand the navigation pane')) {
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
      });

      if (button && button.asElement()) {
        return button.asElement();
      }

      return null;
    } catch (error) {
      console.error('Error finding navigation pane button:', error);
      return null;
    }
  }

  /**
   * Find D365 Navigation Pane link by walking up the DOM tree
   * This handles clicks on navigation tree leaf nodes like "All sales orders"
   * These are often <a> tags or div[role="link"] inside the navigation pane
   */
  private async findNavigationPaneLink(element: any): Promise<any | null> {
    try {
      const link = await element.evaluateHandle((el: HTMLElement) => {
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

        // Walk up the DOM tree to find the link
        let current: HTMLElement | null = el;
        let depth = 0;
        const maxDepth = 10; // Safety limit

        while (current && depth < maxDepth) {
          const tag = current.tagName.toLowerCase();
          const role = current.getAttribute('role') || '';
          const dataDynControlName = current.getAttribute('data-dyn-controlname');

          // PRIORITY 1: If element has data-dyn-controlname and is in navigation pane, FORCE capture it
          // This is a common D365 pattern for navigation links
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
      });

      if (link && link.asElement()) {
        return link.asElement();
      }

      return null;
    } catch (error) {
      console.error('Error finding navigation pane link:', error);
      return null;
    }
  }

  /**
   * Process a clicked element and create a step
   */
  private async processClickElement(element: any): Promise<RecordedStep | null> {
    if (!this.page || !element) return null;

    try {
      // Get element metadata FIRST to filter before doing expensive operations
      const elementMeta = await element.evaluate((el: HTMLElement) => {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = (el as HTMLElement).title || el.getAttribute('title') || '';
        const id = el.id || '';
        
        // Only get text content for interactive elements to avoid getting entire page
        let text = '';
        // Check if element is interactive - include links and treeitems (common in D365 navigation)
        let isInteractive = ['button', 'link', 'menuitem', 'treeitem', 'tab', 'checkbox', 'radio'].includes(role) ||
                             tag === 'button' || tag === 'a' || 
                             el.matches('button, a, [role=button], [role=link], [role=menuitem], [role=treeitem]');
        
        // SPECIAL: Force links in navigation pane to be considered interactive
        // This ensures "All sales orders" and similar navigation links are captured
        let isInNavPane = false;
        const hasDataDynControlName = el.getAttribute('data-dyn-controlname');
        
        let current: HTMLElement | null = el;
        let depth = 0;
        while (current && depth < 15) {
          const className = current.className || '';
          const id = current.id || '';
          const parentRole = current.getAttribute('role') || '';
          const parentControlName = current.getAttribute('data-dyn-controlname');
          
          // Check for navigation pane containers (also check for treeView class)
          if (className.includes('modulesPane') || className.includes('navigation') || 
              className.includes('nav-pane') || className.includes('NavPane') ||
              className.includes('treeView') || className.includes('tree-view') ||
              id.includes('nav') || id.includes('modules') ||
              parentRole === 'navigation' ||
              parentControlName?.includes('Nav')) {
            isInNavPane = true;
            break;
          }
          current = current.parentElement;
          depth++;
        }
        
        // RELAXED INTERACTION CHECK FOR NAVIGATION PANE:
        // If inside navigation pane, record clicks on generic divs/spans IF they have text
        // This mimics Playwright Codegen behavior for D365 navigation links
        if (isInNavPane) {
          // Get text content to check if element has meaningful text
          const textContent = el.textContent?.trim() || '';
          
          // If element is a generic div/span but has text, treat it as interactive
          // This captures "All sales orders" and similar navigation leaf nodes
          if ((tag === 'div' || tag === 'span') && textContent.length > 0 && textContent.length <= 100) {
            isInteractive = true; // Force interactive - navigation pane divs/spans with text are clickable
            // Ensure text is captured for these elements
            if (!text || text.length === 0) {
              text = textContent;
            }
          }
        }
        
        // PRIORITY: If element has data-dyn-controlname and is in navigation pane, FORCE capture
        // This is critical for D365 navigation links like "All sales orders"
        if (hasDataDynControlName && isInNavPane) {
          isInteractive = true; // Force interactive - D365 control elements must be captured
        }
        
        // If it's a link or treeitem in navigation pane, force it to be interactive
        if (isInNavPane && (tag === 'a' || role === 'link' || role === 'treeitem')) {
          isInteractive = true; // Force interactive flag - this ensures the element is processed
        }
        
        if (isInteractive) {
          // For interactive elements, get direct text only (not nested children)
          let directText = '';
          for (const node of Array.from(el.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              directText += node.textContent || '';
            }
          }
          text = directText.trim();
          
          // If no direct text, try textContent but limit it
          if (!text) {
            const fullText = el.textContent?.trim() || '';
            // Only use if reasonably short (not entire page)
            if (fullText.length > 0 && fullText.length < 100) {
              text = fullText;
            }
          }
        }
        
        return { tag, role, ariaLabel, title, text, id, isInteractive };
      });

      // FIX #2: Explicitly block garbage steps
      if (this.shouldSkipElement(elementMeta)) {
        return null;
      }

      // Combine label sources: aria-label > text > title
      // Title is important for icon-only buttons like hamburger menu
      const fullLabelText = elementMeta.ariaLabel || elementMeta.text || elementMeta.title;
      
      // FIX #3: Hard limit on label length
      if (fullLabelText && fullLabelText.length > 80) {
        return null; // Skip if label is too long
      }
      
      // Relax filter: allow buttons with title/aria-label even if no text
      const isButtonLike = elementMeta.role === 'button' || elementMeta.tag === 'button';
      if (!fullLabelText && !isButtonLike) {
        return null; // Skip generic elements without any label
      }
      
      // Use fullLabelText for identifier generation
      const labelForIdentifier = fullLabelText || elementMeta.role || elementMeta.tag;

      // Now do the expensive operations only if element passed filters
      const locator = await this.locatorExtractor.extractLocator(this.page, element);
      const pageClassification = await this.pageClassifier.classifyPage(this.page);
      const description = await this.buildDescription(element, 'click');

      // Generate safe identifiers using the full label text
      const baseName = makeSafeIdentifier(labelForIdentifier);
      const fieldName = this.getFieldName(baseName, locator);
      const methodName = this.getMethodName(baseName, 'click');

      // Attach current page identity to step
      const pageUrl = this.page?.url() || '';
      
      return {
        pageId: pageClassification.pageId,
        action: 'click',
        description: description,
        locator: locator,
        fieldName,
        methodName,
        order: 0, // Will be set by SessionManager
        timestamp: new Date(),
        // Page identity information
        pageUrl,
        mi: this.currentPageIdentity?.mi,
        cmp: this.currentPageIdentity?.cmp,
        pageType: this.currentPageIdentity?.type,
      };
    } catch (error) {
      console.error('Error processing click event:', error);
      return null;
    }
  }

  /**
   * Check if element should be skipped (low-value clicks)
   * RELAXED: Trust that if user clicked it, we should record it (especially navigation items)
   * This mimics Playwright Codegen behavior - it trusts user interactions
   */
  private shouldSkipElement(elementMeta: { tag: string; role: string; ariaLabel: string; title: string; text: string; id: string; isInteractive: boolean }): boolean {
    const { tag, role, ariaLabel, title, text, isInteractive } = elementMeta;
    
    // SPECIAL CASE 1: Always record D365 Navigation Pane button (hamburger menu)
    // This button is critical for D365 flows and may be clicked via SVG icon
    const navPaneLabels = [
      'expand the navigation pane',
      'navigation pane',
      'hamburger menu',
      'navbar',
    ];
    
    const combinedLabel = (ariaLabel || title || text || '').toLowerCase();
    const isNavPaneButton = navPaneLabels.some(label => combinedLabel.includes(label)) ||
                           elementMeta.id?.toLowerCase().includes('nav');
    
    if (isNavPaneButton) {
      return false; // Never skip navigation pane button
    }

    // SPECIAL CASE 2: Always record links in navigation pane (e.g., "All sales orders")
    // These are critical navigation steps and may not pass normal interactive checks
    const isLink = tag === 'a' || role === 'link' || role === 'treeitem';
    if (isLink && (text.length > 0 || ariaLabel.length > 0 || title.length > 0)) {
      // If it's a link with meaningful text, never skip it
      // This ensures "All sales orders" and similar navigation links are captured
      return false;
    }
    
    // RELAXED CHECK: Trust clicks on elements with meaningful text in navigation context
    // If element has text (3-100 chars), trust that user meant to click it
    // This is the "Silver Bullet" - if user clicked it, D365 reacted, so we should record it
    if (text.length >= 3 && text.length <= 100) {
      // Check if it looks like a menu item or navigation element
      const isMenuLike = role === 'menuitem' || role === 'treeitem' || 
                         tag === 'li' || 
                         (text.length > 0 && text.length < 50); // Short, distinct text is likely a menu item
      
      if (isMenuLike) {
        return false; // Don't skip - user clicked it, so it's meaningful
      }
    }
    
    // Skip generic roles that have no content
    if ((role === 'generic' || role === 'presentation') && !text && !ariaLabel && !title) {
      return true;
    }

    // RELAXED: Allow generic containers (div, span) if they have meaningful text
    // This mimics Playwright Codegen behavior - it captures "All sales orders" even if it's a div
    if (['div', 'span'].includes(tag)) {
      // Only skip if completely empty (no label, no text)
      if (!ariaLabel && !text && !title) {
        return true; // No label at all
      }
      
      // Skip if text is too short (1-2 chars) and no other label
      if (text.length < 3 && !ariaLabel && !title) {
        return true;
      }
      
      // RELAXED: If element has meaningful text (3+ chars), trust the click
      // This handles navigation pane leaf nodes that are generic divs
      // Playwright Codegen records these, so we should too
      if (text.length >= 3 && text.length <= 100) {
        return false; // Don't skip - it's a meaningful navigation element
      }
      
      // Still allow if it has aria-label or title (icon-only buttons, etc.)
      if (ariaLabel || title) {
        return false; // Don't skip - has accessible name
      }
    }

    // Skip body element
    if (tag === 'body') {
      return true;
    }

    // RELAXED: Trust that if element has any label/text, user meant to click it
    // Only skip if completely empty AND not interactive
    const hasLabel = ariaLabel || text || title;
    const isButton = role === 'button' || tag === 'button';
    
    // Only skip if no label AND not interactive AND not a button AND not a link
    if (!hasLabel && !isInteractive && !isButton && !isLink) {
      return true;
    }

    return false;
  }

  /**
   * Generate field name for POM
   */
  private getFieldName(baseName: string, locator: LocatorDefinition): string {
    // Determine suffix based on locator strategy or element type
    if (locator.strategy === 'role') {
      const role = locator.role;
      if (role === 'button') return `${baseName}Button`;
      if (role === 'link') return `${baseName}Link`;
      if (role === 'textbox') return `${baseName}Input`;
      if (role === 'combobox') return `${baseName}Select`;
      if (role === 'treeitem') return `${baseName}Item`;
      if (role === 'menuitem') return `${baseName}MenuItem`;
    }
    
    // Default suffix
    return `${baseName}Element`;
  }

  /**
   * Generate method name for POM
   */
  private getMethodName(baseName: string, action: 'click' | 'fill' | 'select'): string {
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    return `${action}${capitalized}`;
  }

  /**
   * Build a clean, short description for an element
   * FIX #1: Only use textContent for interactive elements
   */
  private async buildDescription(element: any, action: 'click' | 'fill' | 'select'): Promise<string> {
    try {
      const meta = await element.evaluate((el: HTMLElement) => {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const titleAttr = (el as HTMLElement).title || el.getAttribute('title') || '';
        const placeholder = (el as HTMLInputElement).placeholder || '';
        
        // Only get text for interactive elements
        const isInteractive = ['button', 'link', 'menuitem', 'treeitem', 'tab', 'checkbox', 'radio'].includes(role) ||
                             tag === 'button' || tag === 'a' || 
                             el.matches('button, a, [role=button], [role=link], [role=menuitem], [role=treeitem]');
        
        let text = '';
        if (isInteractive) {
          // Get only direct text nodes (not from children)
          let directText = '';
          for (const node of Array.from(el.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              directText += node.textContent || '';
            }
          }
          directText = directText.trim();

          // If no direct text, try to get a short snippet from textContent
          // but limit it to avoid getting entire page content
          text = directText;
          if (!text) {
            const fullText = el.textContent?.trim() || '';
            // Only use if it's reasonably short (not the entire page)
            if (fullText.length > 0 && fullText.length < 100) {
              text = fullText;
            }
          }
        }

        return { tag, role, ariaLabel, title: titleAttr, placeholder, text };
      });

      // Priority: aria-label > title > placeholder > text > tag
      // Title is important for icon-only buttons like hamburger menu
      const primary = meta.ariaLabel || 
                     meta.title || 
                     meta.placeholder || 
                     (meta.text.length > 0 && meta.text.length < 100 ? meta.text : '') ||
                     meta.tag;

      // Truncate if too long
      const label = primary.length > 80 ? primary.slice(0, 77) + '…' : primary;

      // Don't add prefix if label already starts with action verb
      const actionPrefix = action.charAt(0).toUpperCase() + action.slice(1);
      if (label.toLowerCase().startsWith(action.toLowerCase())) {
        return label;
      }

      switch (action) {
        case 'click':
          return `Click ${label}`;
        case 'fill':
          return `Fill ${label}`;
        case 'select':
          return `Select ${label}`;
        default:
          return `${actionPrefix} ${label}`;
      }
    } catch (error) {
      // Fallback to generic description
      return `${action} element`;
    }
  }

  /**
   * Handle input/fill events
   */
  private async handleInputEvent(event: any): Promise<RecordedStep | null> {
    if (!this.page || !event.selector) {
      return null;
    }

    try {
      // Find element by selector
      const element = await this.page.$(event.selector).catch(() => null);
      if (!element) {
        return null;
      }

      const elementInfo = await element.evaluate((el: HTMLElement) => {
        if (!el) return null;
        const anyEl = el as any;
        
        const labelText = (anyEl.labels && anyEl.labels[0]?.textContent) || '';
        
        return {
          tagName: el.tagName,
          type: (el as HTMLInputElement).type,
          label: el.getAttribute('aria-label') || 
                 labelText.trim() || 
                 (el as HTMLInputElement).placeholder || '',
          value: (el as HTMLInputElement).value,
          id: el.id,
          name: el.getAttribute('name'),
        };
      });

      if (!elementInfo) {
        return null;
      }

      const locator = await this.locatorExtractor.extractLocator(this.page, element);
      const pageClassification = await this.pageClassifier.classifyPage(this.page);
      const description = await this.buildDescription(element, 'fill');

      // Generate safe identifiers
      const labelText = elementInfo.label || elementInfo.name || 'input';
      const baseName = makeSafeIdentifier(labelText);
      const fieldName = `${baseName}Input`;
      const methodName = this.getMethodName(baseName, 'fill');

      const pageUrl = this.page?.url() || '';
      
      return {
        pageId: pageClassification.pageId,
        action: 'fill',
        description: description,
        locator: locator,
        value: event.value || elementInfo.value,
        fieldName,
        methodName,
        order: 0,
        timestamp: new Date(),
        // Page identity information
        pageUrl,
        mi: this.currentPageIdentity?.mi,
        cmp: this.currentPageIdentity?.cmp,
        pageType: this.currentPageIdentity?.type,
      };
    } catch (error) {
      console.error('Error processing input event:', error);
      return null;
    }
  }

  /**
   * Handle select/change events
   */
  private async handleSelectEvent(event: any): Promise<RecordedStep | null> {
    if (!this.page || !event.selector) {
      return null;
    }

    try {
      // Find element by selector
      const element = await this.page.$(event.selector).catch(() => null);
      if (!element) {
        return null;
      }

      const elementInfo = await element.evaluate((el: HTMLElement) => {
        if (!el) return null;
        const anyEl = el as any;
        
        const labelText = (anyEl.labels && anyEl.labels[0]?.textContent) || '';
        
        return {
          tagName: el.tagName,
          label: el.getAttribute('aria-label') || 
                 labelText.trim() || '',
          value: (el as HTMLSelectElement).value,
          id: el.id,
          name: el.getAttribute('name'),
        };
      });

      if (!elementInfo) {
        return null;
      }

      const locator = await this.locatorExtractor.extractLocator(this.page, element);
      const pageClassification = await this.pageClassifier.classifyPage(this.page);
      const description = await this.buildDescription(element, 'select');

      // Generate safe identifiers
      const labelText = elementInfo.label || elementInfo.name || 'select';
      const baseName = makeSafeIdentifier(labelText);
      const fieldName = `${baseName}Select`;
      const methodName = this.getMethodName(baseName, 'select');

      const pageUrl = this.page?.url() || '';
      
      return {
        pageId: pageClassification.pageId,
        action: 'select',
        description: description,
        locator: locator,
        value: event.value || elementInfo.value,
        fieldName,
        methodName,
        order: 0,
        timestamp: new Date(),
        // Page identity information
        pageUrl,
        mi: this.currentPageIdentity?.mi,
        cmp: this.currentPageIdentity?.cmp,
        pageType: this.currentPageIdentity?.type,
      };
    } catch (error) {
      console.error('Error processing select event:', error);
      return null;
    }
  }

  /**
   * Handle navigation events
   * Creates a navigation step for page.goto calls - required for E2E test completeness
   */
  private async handleNavigateEvent(event: any): Promise<RecordedStep | null> {
    if (!this.page) {
      return null;
    }

    try {
      const pageUrl = event.url || this.page.url();
      
      // Only create navigation step if URL is meaningful (not empty, not about:blank)
      if (!pageUrl || pageUrl === 'about:blank' || pageUrl.startsWith('about:')) {
        return null;
      }

      // Get page classification for context
      const pageClassification = await this.pageClassifier.classifyPage(this.page);
      
      return {
        pageId: pageClassification.pageId,
        action: 'navigate',
        description: `Navigate to ${pageUrl}`,
        locator: { strategy: 'css', selector: 'body' }, // Placeholder - navigation doesn't need a locator
        order: 0,
        timestamp: new Date(),
        pageUrl,
        mi: this.currentPageIdentity?.mi,
        cmp: this.currentPageIdentity?.cmp,
        pageType: this.currentPageIdentity?.type,
      };
    } catch (error) {
      console.error('Error processing navigation event:', error);
      return null;
    }
  }

  /**
   * Set up Chrome DevTools Protocol listeners for more reliable event capture
   */
  private async setupCDPListeners(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    
    // Enable DOM and Runtime domains
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Listen for DOM events
    client.on('Runtime.bindingCalled', (event) => {
      // Handle CDP events if needed
    });
  }
}

