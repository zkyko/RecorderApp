import * as path from 'path';
import { RecordedStep, GeneratedFile } from '../types';
import { PageRegistryManager } from '../core/registry/page-registry';

/**
 * Generates Playwright test spec files in TypeScript
 */
export class SpecGenerator {
  private pageRegistry: PageRegistryManager;

  constructor() {
    this.pageRegistry = new PageRegistryManager();
  }
  /**
   * Generate a test spec file from recorded steps
   * Returns spec file with new bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
   */
  generateSpec(
    flowName: string,
    steps: RecordedStep[],
    outputDir: string,
    pagesDir: string,
    module?: string
  ): GeneratedFile {
    // Filter out navigation steps and steps from ignored pages
    const validSteps = steps.filter(step => {
      // Skip navigation steps
      if (step.action === 'navigate') {
        return false;
      }
      // Skip steps with only body locator (no real interaction)
      // These are typically navigation or placeholder steps
      if (step.locator && step.locator.strategy === 'css' && 
          (step.locator as any).selector === 'body') {
        return false;
      }
      return true;
    });

    const fileName = this.flowNameToFileName(flowName);
    const testName = this.formatTestName(flowName);
    
    // New bundle structure: tests/d365/specs/<TestName>/
    const modulePath = module ? path.join('d365', 'specs', fileName) : path.join('d365', 'specs', fileName);
    const bundleDir = path.join(outputDir, modulePath);
    const specFilePath = path.join(bundleDir, `${fileName}.spec.ts`);

    if (validSteps.length === 0) {
      // Return empty spec if no valid steps
      const content = `import { test } from '@playwright/test';\n\ntest('${testName} - auto generated', async ({ page }) => {\n  // No valid steps recorded\n});\n`;
      return {
        path: specFilePath,
        content,
        type: 'spec',
      };
    }

    // Always generate data-driven tests with a data file path
    // The data file will be created/edited in the Test Runner UI
    // Data file is at tests/d365/data/<TestName>Data.json (two levels up from bundle: specs/<TestName>/ -> d365/ -> data/)
    const dataDir = path.join(outputDir, module ? path.join('d365', module) : 'd365', 'data');
    const dataFilePath = path.join(dataDir, `${fileName}Data.json`);
    
    const content = this.generateSpecContent(flowName, validSteps, specFilePath, pagesDir, module, dataFilePath);

    return {
      path: specFilePath,
      content,
      type: 'spec',
    };
  }
  
  /**
   * Detect parameters from steps that will be used in data-driven tests
   * Public method for use in bridge
   */
  detectParametersFromSteps(steps: RecordedStep[]): string[] {
    const parameters = new Set<string>();
    
    for (const step of steps) {
      if (step.action === 'fill' || step.action === 'select') {
        const methodName = step.methodName || this.inferMethodName(step);
        const fieldName = this.extractFieldNameFromMethod(methodName);
        if (fieldName) {
          parameters.add(fieldName);
        }
      }
    }
    
    return Array.from(parameters).sort();
  }
  
  /**
   * Generate initial data file content with detected parameters
   * Public method for use in bridge
   */
  generateInitialDataFile(parameters: string[]): string {
    if (parameters.length === 0) {
      // Default structure if no parameters detected
      return JSON.stringify([{
        testCaseId: 'test-1',
        name: 'Test Order',
      }], null, 2);
    }
    
    // Create initial data object with all parameters
    const initialData: any = {
      testCaseId: 'test-1',
    };
    
    for (const param of parameters) {
      initialData[param] = '';
    }
    
    return JSON.stringify([initialData], null, 2);
  }

  /**
   * Generate the test spec content
   */
  private generateSpecContent(
    flowName: string,
    steps: RecordedStep[],
    specFilePath: string,
    pagesDir: string,
    module?: string,
    dataFilePath?: string // Optional JSON data file for data-driven tests
  ): string {
    let content = `import { test, expect } from '@playwright/test';\n`;
    
    // Always import data file for data-driven tests
    // Data file is at tests/d365/data/<TestName>Data.json (two levels up from bundle)
    // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
    // Data structure: tests/d365/data/<TestName>Data.json
    // Relative path from bundle: ../../data/<TestName>Data.json
    const finalDataFilePath = dataFilePath || path.join(path.dirname(path.dirname(path.dirname(specFilePath))), 'data', `${this.flowNameToFileName(flowName)}Data.json`);
    const relativeDataPath = this.buildRelativeImportPath(specFilePath, finalDataFilePath);
    content += `import dataSet from '${relativeDataPath}';\n`;
    
    content += `\n`;

    // Group steps by pageId to determine imports
    const pageIds = new Set<string>();
    for (const step of steps) {
      pageIds.add(step.pageId);
    }

    // Generate imports with safe class names using computed relative paths
    // Use className from registry if available for consistency
    for (const pageId of pageIds) {
      const registryEntry = this.pageRegistry.getPage(pageId);
      const safeClassName = registryEntry?.className || this.makePageClassName(pageId);
      const pageFileName = this.pageIdToFileName(pageId);
      const importPath = this.buildPageImportPath(specFilePath, pagesDir, `${pageFileName}.page`);
      content += `import { ${safeClassName} } from '${importPath}';\n`;
    }

    content += `\n`;
    content += `// Helper to wait for D365 shell to be ready\n`;
    content += `async function waitForD365Shell(page) {\n`;
    content += `  const selectors = [\n`;
    content += `    '[data-dyn-role="shell"]',\n`;
    content += `    '.dyn-shell',\n`;
    content += `    '#shell',\n`;
    content += `    'div[aria-label*="Finance and Operations"]',\n`;
    content += `    'nav[role="navigation"]',\n`;
    content += `  ];\n`;
    content += `\n`;
    content += `  // Try each selector in order, with a reasonable timeout\n`;
    content += `  for (const s of selectors) {\n`;
    content += `    try {\n`;
    content += `      await page.locator(s).first().waitFor({ state: 'visible', timeout: 60_000 });\n`;
    content += `      return;\n`;
    content += `    } catch {\n`;
    content += `      // ignore and try next selector\n`;
    content += `    }\n`;
    content += `  }\n`;
    content += `\n`;
    content += `  throw new Error('D365 shell did not appear – maybe login page or wrong URL?');\n`;
    content += `}\n`;
    content += `\n`;
    // Always generate data-driven test structure
    content += `test.describe('${this.formatTestName(flowName)} - Data Driven', () => {\n`;
    content += `  for (const data of dataSet) {\n`;
    content += `    test(\`\${data.testCaseId || data.id || data.name || 'Test'}\`, async ({ page }, testInfo) => {\n`;
    content += `      test.setTimeout(120_000); // 2 minutes for D365 to wake up\n\n`;
    // Attach test data for audit trail
    content += `      // ATTACH DATA FOR AUDIT\n`;
    content += `      await testInfo.attach('test-data', {\n`;
    content += `        body: JSON.stringify(data, null, 2),\n`;
    content += `        contentType: 'application/json'\n`;
    content += `      });\n\n`;

    // Initial navigation - go to first page with actions using POM.goto() if available
    // Otherwise fallback to base URL
    const firstPageId = steps.length > 0 ? steps[0].pageId : null;
    let hasInitialNavigation = false;
    
    if (firstPageId) {
      const firstPageEntry = this.pageRegistry.getPage(firstPageId);
      // Use className from registry entry if available (most accurate)
      const firstPageClassName = firstPageEntry?.className || this.makePageClassName(firstPageId);
      
      if (firstPageEntry && firstPageEntry.mi) {
        // Use POM.goto() for URL-aware navigation
        const cmp = firstPageEntry.cmp || 'FH';
        content += `      // Navigate to first page using POM.goto()\n`;
        content += `      await ${firstPageClassName}.goto(page, { cmp: '${cmp}' });\n\n`;
        hasInitialNavigation = true;
      }
    }
    
    if (!hasInitialNavigation) {
      // Fallback to base URL - use finite timeouts
      content += `      // Navigate to base URL (uses baseURL from playwright.config.ts)\n`;
      content += `      await page.goto('/', { waitUntil: 'domcontentloaded' });\n`;
      content += `      \n`;
      content += `      // Verify storage state was loaded (debugging)\n`;
      content += `      const cookies = await page.context().cookies();\n`;
      content += `      console.log('[Test] Loaded', cookies.length, 'cookies from storage state');\n`;
      content += `      \n`;
      content += `      // Wait for D365 shell to appear\n`;
      content += `      await waitForD365Shell(page);\n`;
      content += `      await page.waitForTimeout(2000); // small extra buffer\n\n`;
    }

    // Create page object instances with safe names
    // Use className from registry for consistency
    const pageInstances = new Map<string, string>();
    for (const pageId of pageIds) {
      const registryEntry = this.pageRegistry.getPage(pageId);
      const safeClassName = registryEntry?.className || this.makePageClassName(pageId);
      const instanceName = this.toCamelCase(pageId);
      pageInstances.set(pageId, instanceName);
      content += `      const ${instanceName} = new ${safeClassName}(page);\n`;
    }

    content += `\n`;

    // Generate test steps with URL-aware navigation on page transitions
    let currentPageId: string | null = null;
    for (const step of steps) {
      // Skip navigation steps
      if (step.action === 'navigate') {
        continue;
      }

      // Handle custom actions
      if (step.action === 'custom' && (step as any).customAction === 'waitForD365') {
        content += `      await waitForD365(page);\n`;
        continue;
      }

      // Handle wait steps
      if (step.action === 'wait') {
        // Coerce any recorded wait value into a numeric timeout.
        // Older recordings may store arbitrary strings (e.g. "Enter") which
        // must never be emitted as bare identifiers in the generated code.
        const raw = (step as any).value as unknown;
        let waitMs = 1000;
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          waitMs = raw;
        } else if (typeof raw === 'string') {
          const parsed = parseInt(raw, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            waitMs = parsed;
          }
        }
        content += `      await page.waitForTimeout(${waitMs});\n`;
        continue;
      }

      // Handle comment steps
      if (step.action === 'comment') {
        const commentText = step.value || 'New Step';
        content += `      // ${commentText}\n`;
        continue;
      }

      // Handle page transitions with POM.goto() if available
      if (step.pageId !== currentPageId) {
        const pageEntry = this.pageRegistry.getPage(step.pageId);
        // Use className from registry for consistency
        const pageClassName = pageEntry?.className || this.makePageClassName(step.pageId);
        
        if (pageEntry && pageEntry.mi && currentPageId !== null) {
          // Navigate to new page using POM.goto() - this is more reliable than replaying clicks
          const cmp = pageEntry.cmp || step.cmp || 'FH';
          content += `      // Navigate to ${step.pageId} using POM.goto()\n`;
          content += `      await ${pageClassName}.goto(page, { cmp: '${cmp}' });\n\n`;
        } else if (currentPageId === null && !hasInitialNavigation) {
          // First page, already handled above
        } else {
          // No URL navigation available (no mi parameter), just add comment
          content += `      // ${step.pageId} (no URL navigation available)\n`;
        }
        currentPageId = step.pageId;
      }

      const instanceName = pageInstances.get(step.pageId) || 'page';
      // Always use data source for parameterized values
      const methodCall = this.generateMethodCall(step, instanceName, 'data');
      
      content += `      ${methodCall}\n`;
    }

    content += `\n`;
    content += `      // TODO: add assertions manually\n`;
    content += `    });\n`;
    content += `  }\n`;
    content += `});\n`;

    // Clean up double semicolons (e.g., "import ...';;" or "await ...();;")
    content = content.replace(/;;+/g, ';');

    return content;
  }

  /**
   * Generate a method call from a step
   * @param dataSource - If 'data', use data object for values (data-driven tests)
   */
  private generateMethodCall(step: RecordedStep, instanceName: string, dataSource?: string): string {
    // Don't generate goto() calls - navigation is handled at the start
    if (step.action === 'navigate') {
      return `// Navigation to ${step.pageId} (handled by initial page.goto())`;
    }

    // Custom, wait, and comment steps are handled in the main loop, not here
    if (step.action === 'custom' || step.action === 'wait' || step.action === 'comment') {
      return ''; // Should not reach here, but return empty string as fallback
    }

    // Use methodName from step if available, otherwise infer it
    const methodName = step.methodName || this.inferMethodName(step);
    
    if (step.action === 'fill' || step.action === 'select') {
      let value: string;
      
      if (dataSource === 'data') {
        // For data-driven tests, try to map JSON keys to method parameters
        // Extract field name from method name (e.g., "fillCustomerAccount" -> "customerAccount")
        const fieldName = this.extractFieldNameFromMethod(methodName);
        // Try camelCase and various formats
        const possibleKeys = [
          fieldName,
          this.toCamelCase(fieldName),
          fieldName.toLowerCase(),
          step.description.match(/["']([^"']+)["']/)?.[1]?.replace(/\s+/g, '') || fieldName
        ];
        
        // Use first possible key that makes sense, or fallback to generic
        const dataKey = possibleKeys.find(k => k && k.length > 0) || 'value';
        value = `data.${dataKey}`;
      } else {
        // Use recorded value or placeholder
        value = step.value ? `'${this.escapeString(step.value)}'` : 'value';
      }
      
      return `await ${instanceName}.${methodName}(${value});`;
    } else {
      return `await ${instanceName}.${methodName}();`;
    }
  }

  /**
   * Extract field name from method name for data mapping
   * e.g., "fillCustomerAccount" -> "customerAccount"
   */
  private extractFieldNameFromMethod(methodName: string): string {
    // Remove action prefix (fill, select, click, etc.)
    const withoutAction = methodName.replace(/^(fill|select|click|set)/i, '');
    // Convert to camelCase
    return withoutAction.charAt(0).toLowerCase() + withoutAction.slice(1);
  }

  /**
   * Infer method name from step (should match POM generator logic)
   */
  private inferMethodName(step: RecordedStep): string {
    const action = step.action;
    const description = step.description.toLowerCase();
    
    if (action === 'click') {
      const words = description.replace(/^click\s+/i, '').split(/\s+/);
      return 'click' + words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    } else if (action === 'fill') {
      const match = description.match(/fill\s+["']([^"']+)["']/i);
      if (match) {
        const fieldName = match[1].split(/\s+/).map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join('');
        return 'fill' + fieldName;
      }
      return 'fillField';
    } else if (action === 'select') {
      const match = description.match(/select\s+["']([^"']+)["']/i);
      if (match) {
        const fieldName = match[1].split(/\s+/).map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join('');
        return 'select' + fieldName;
      }
      return 'selectOption';
    } else if (action === 'navigate') {
      return 'goto';
    }
    
    return action + 'Action';
  }

  /**
   * Convert flow name to file name
   */
  /**
   * Convert flow name to file name (public for use in bridge)
   */
  flowNameToFileName(flowName: string): string {
    return flowName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Convert pageId to file name (should match POM generator)
   */
  private pageIdToFileName(pageId: string): string {
    return this.toSafeIdentifier(pageId, 'kebab')
      .replace(/-page$/, '');
  }

  /**
   * Convert pageId to instance variable name (camelCase)
   */
  private pageIdToInstanceName(pageId: string): string {
    return this.toCamelCase(pageId);
  }

  /**
   * Convert string to safe JavaScript identifier (PascalCase for class names)
   */
  private toPascalCase(raw: string): string {
    return raw
      .replace(/[^a-zA-Z0-9]+/g, ' ')   // non-alnum -> space
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to safe identifier (camelCase for variable names)
   */
  private toCamelCase(raw: string): string {
    const pascal = this.toPascalCase(raw);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Convert string to safe identifier (kebab-case for file names)
   */
  private toSafeIdentifier(raw: string, format: 'pascal' | 'camel' | 'kebab' = 'pascal'): string {
    const cleaned = raw
      .replace(/[^a-zA-Z0-9]+/g, ' ')   // non-alnum -> space
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    if (format === 'kebab') {
      return cleaned
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
    } else if (format === 'camel') {
      return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    }
    return cleaned;
  }

  /**
   * Make a safe page class name from a title or page name
   */
  private makePageClassName(caption: string): string {
    const base = this.toPascalCase(caption || 'Page');
    // Ensure it ends with 'Page' if it doesn't already
    if (!base.endsWith('Page')) {
      return `${base}Page`;
    }
    return base;
  }

  /**
   * Format test name from flow name
   * Public for use in bridge
   */
  formatTestName(flowName: string): string {
    return flowName
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Build the import path for a POM file relative to the spec file
   * 
   * @param specFilePath - Full path to the spec file (e.g., "Recordings/tests/d365/sales/createsalesorder.generated.spec.js")
   * @param pagesDir - Root directory for pages (e.g., "Recordings/pages")
   * @param pageFileName - Name of the page file with extension (e.g., "dashboard.page")
   * @returns Relative import path (e.g., "../../../pages/d365/sales/dashboard.page")
   * 
   * Example:
   *   Spec:  Recordings/tests/d365/sales/createsalesorder.generated.spec.js
   *   Pages: Recordings/pages/d365/sales/dashboard.page.js
   *   Returns: "../../../pages/d365/sales/dashboard.page"
   */
  private buildPageImportPath(specFilePath: string, pagesDir: string, pageFileName: string): string {
    // Get the directory containing the spec file
    const specDir = path.dirname(specFilePath);
    
    // Root of tests and pages under Recordings
    const testsRoot = path.join('Recordings', 'tests');   // "Recordings/tests"
    const pagesRoot = path.normalize(pagesDir);            // "Recordings/pages"
    
    // Get subpath under tests (e.g., "d365/sales" from "Recordings/tests/d365/sales")
    const normalizedSpecDir = path.normalize(specDir);
    const testsMarker = path.normalize(testsRoot);
    
    let subPath = '';
    if (normalizedSpecDir.includes(testsMarker)) {
      // Extract everything after "Recordings/tests/"
      const afterTests = normalizedSpecDir.substring(normalizedSpecDir.indexOf(testsMarker) + testsMarker.length);
      // Remove leading path separators and normalize
      subPath = path.normalize(afterTests.replace(/^[\/\\]+/, ''));
    } else {
      // Fallback: if path structure is different, try to extract from specDir
      const specParts = normalizedSpecDir.split(path.sep);
      const testsIndex = specParts.indexOf('tests');
      if (testsIndex !== -1 && testsIndex < specParts.length - 1) {
        subPath = path.join(...specParts.slice(testsIndex + 1));
      }
    }
    
    // Build the actual POM file path: "Recordings/pages/d365/sales/dashboard.page.js"
    const pageFileFull = path.join(pagesRoot, subPath, `${pageFileName}.js`);
    
    // Now compute the relative import path from specDir to pageFileFull
    let relative = path.relative(normalizedSpecDir, pageFileFull);
    
    // Normalize to POSIX-style (forward slashes) for import
    relative = relative.split(path.sep).join('/');
    
    // Strip ".ts" or ".js" extension for import
    if (relative.endsWith('.ts')) {
      relative = relative.slice(0, -3);
    } else if (relative.endsWith('.js')) {
      relative = relative.slice(0, -3);
    }
    
    // Prepend "./" if it doesn't start with "." or "/"
    if (!relative.startsWith('.') && !relative.startsWith('/')) {
      relative = './' + relative;
    }
    
    return relative;
  }

  /**
   * Build relative import path for data files (JSON)
   */
  private buildRelativeImportPath(fromPath: string, toPath: string): string {
    const fromDir = path.dirname(fromPath);
    const relative = path.relative(fromDir, toPath);
    const normalized = relative.split(path.sep).join('/');
    
    // Strip .json extension for import
    const withoutExt = normalized.endsWith('.json') ? normalized.slice(0, -5) : normalized;
    
    // Prepend "./" if needed
    if (!withoutExt.startsWith('.') && !withoutExt.startsWith('/')) {
      return './' + withoutExt;
    }
    
    return withoutExt;
  }

  /**
   * Escape string for JavaScript
   */
  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  }

  /**
   * Extract locators, fixtures, and runtime helpers from spec content
   * Returns structured information for .meta.md generation
   */
  extractLocatorsFromContent(content: string): {
    locators: Array<{ selector: string; type: string; line?: number }>;
    fixtures: string[];
    runtimeHelpers: string[];
  } {
    const lines = content.split('\n');
    const locators: Array<{ selector: string; type: string; line?: number }> = [];
    const fixtures = new Set<string>();
    const runtimeHelpers = new Set<string>();

    // Extract fixtures from test function parameters
    // Match: async ({ page, browserStackWorker, request, ... }) => {
    const fixtureMatch = content.match(/async\s*\(\s*\{([^}]+)\}/);
    if (fixtureMatch) {
      const fixtureParams = fixtureMatch[1].split(',').map(p => p.trim());
      fixtureParams.forEach(param => {
        const cleanParam = param.replace(/[:\s].*$/, '').trim();
        if (cleanParam) {
          fixtures.add(cleanParam);
        }
      });
    }

    // Extract runtime helpers from import statements
    // Match: import { waitForD365, ... } from '...'
    const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[2];
      // Check if it's a runtime helper (not from @playwright/test)
      if (!importPath.includes('@playwright/test') && !importPath.includes('.json')) {
        const helpers = match[1].split(',').map(h => h.trim());
        helpers.forEach(helper => {
          runtimeHelpers.add(helper);
        });
      }
    }

    // Extract locators using regex patterns (similar to bridge.ts)
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Match page.getByRole(...)
      const roleMatch = line.match(/page\.getByRole\(['"]([^'"]+)['"],\s*\{[^}]*name:\s*['"]([^'"]+)['"]/);
      if (roleMatch) {
        locators.push({
          selector: line.trim(),
          type: 'role',
          line: lineNum,
        });
      }

      // Match page.getByLabel(...)
      const labelMatch = line.match(/page\.getByLabel\(['"]([^'"]+)['"]/);
      if (labelMatch) {
        locators.push({
          selector: line.trim(),
          type: 'label',
          line: lineNum,
        });
      }

      // Match page.locator(...)
      const locatorMatch = line.match(/page\.locator\(['"]([^'"]+)['"]/);
      if (locatorMatch) {
        const selector = locatorMatch[1];
        let type: string = 'css';
        if (selector.includes('data-dyn-controlname')) {
          type = 'd365-controlname';
        } else if (selector.includes('data-test-id')) {
          type = 'testid';
        } else if (selector.startsWith('//') || selector.startsWith('/')) {
          type = 'xpath';
        }
        locators.push({
          selector: line.trim(),
          type,
          line: lineNum,
        });
      }

      // Match page.getByText(...)
      const textMatch = line.match(/page\.getByText\(['"]([^'"]+)['"]/);
      if (textMatch) {
        locators.push({
          selector: line.trim(),
          type: 'text',
          line: lineNum,
        });
      }

      // Match page.getByPlaceholder(...)
      const placeholderMatch = line.match(/page\.getByPlaceholder\(['"]([^'"]+)['"]/);
      if (placeholderMatch) {
        locators.push({
          selector: line.trim(),
          type: 'placeholder',
          line: lineNum,
        });
      }

      // Match POM instance methods (e.g., dashboardPage.fillCustomerAccount(...))
      const pomMethodMatch = line.match(/(\w+Page)\.(\w+)\(/);
      if (pomMethodMatch) {
        const pageInstance = pomMethodMatch[1];
        const methodName = pomMethodMatch[2];
        locators.push({
          selector: `${pageInstance}.${methodName}()`,
          type: 'pom-method',
          line: lineNum,
        });
      }
    });

    // Merge duplicate locators
    const mergedLocators = new Map<string, { selector: string; type: string; line?: number }>();
    locators.forEach(loc => {
      const key = loc.selector;
      if (mergedLocators.has(key)) {
        const existing = mergedLocators.get(key)!;
        if (loc.line && existing.line !== loc.line) {
          // Keep the first line number
        }
      } else {
        mergedLocators.set(key, loc);
      }
    });

    return {
      locators: Array.from(mergedLocators.values()),
      fixtures: Array.from(fixtures),
      runtimeHelpers: Array.from(runtimeHelpers),
    };
  }

  /**
   * Generate meta.json file content
   */
  generateMetaJson(
    testName: string,
    module: string | undefined,
    dataFilePath: string,
    specFilePath: string
  ): string {
    const relativeDataPath = this.buildRelativeImportPath(specFilePath, dataFilePath);
    const meta = {
      name: testName,
      module: module || undefined,
      createdAt: new Date().toISOString(),
      dataPath: relativeDataPath,
    };
    return JSON.stringify(meta, null, 2);
  }

  /**
   * Generate meta.md file content
   */
  generateMetaMd(
    testName: string,
    flowName: string,
    specContent: string,
    module: string | undefined
  ): string {
    const extracted = this.extractLocatorsFromContent(specContent);
    
    let md = `# ${testName}\n\n`;
    md += `## Test Intent\n\n`;
    md += `${flowName}\n\n`;
    if (module) {
      md += `**Module:** ${module}\n\n`;
    }
    
    md += `## Key Locators & Strategy\n\n`;
    
    if (extracted.fixtures.length > 0) {
      md += `### Fixtures Used\n\n`;
      extracted.fixtures.forEach(fixture => {
        md += `- \`${fixture}\`\n`;
      });
      md += `\n`;
    }
    
    if (extracted.runtimeHelpers.length > 0) {
      md += `### Runtime Helpers\n\n`;
      extracted.runtimeHelpers.forEach(helper => {
        md += `- \`${helper}\`\n`;
      });
      md += `\n`;
    }
    
    if (extracted.locators.length > 0) {
      md += `### Locators\n\n`;
      // Group by type
      const byType = new Map<string, Array<{ selector: string; type: string; line?: number }>>();
      extracted.locators.forEach(loc => {
        if (!byType.has(loc.type)) {
          byType.set(loc.type, []);
        }
        byType.get(loc.type)!.push(loc);
      });
      
      byType.forEach((locs, type) => {
        md += `#### ${type}\n\n`;
        locs.forEach(loc => {
          md += `- \`${loc.selector}\`${loc.line ? ` (line ${loc.line})` : ''}\n`;
        });
        md += `\n`;
      });
    } else {
      md += `No locators detected in test.\n\n`;
    }
    
    md += `## Code Preview\n\n`;
    md += `\`\`\`typescript\n`;
    md += specContent;
    md += `\n\`\`\`\n`;
    
    return md;
  }
}

