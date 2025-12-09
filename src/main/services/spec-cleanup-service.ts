import { Project, SourceFile, Node, CallExpression, StringLiteral } from 'ts-morph';
import { WorkspaceType } from '../../types/v1.5';

/**
 * Service for cleaning up generated spec code:
 * - Removes duplicate/consecutive waitForD365 calls (D365 only)
 * - Removes unnecessary waitForTimeout calls
 * - Adds automatic assertions for common patterns (sales orders, customer validation, etc.)
 * - Web-specific cleanup (remove redundant waits, add expect import)
 */
export class SpecCleanupService {
  /**
   * Clean up the generated spec code based on workspace type
   */
  cleanupSpecCode(code: string, workspaceType: WorkspaceType): string {
    let cleaned = code;

    // Common cleanup for all workspace types
    // Step 1: Add expect import if not present (needed for assertions)
    // Remove test.use() calls for all workspace types - storage state is configured in playwright.config.ts
    cleaned = this.ensureExpectImport(cleaned, true);

    // Workspace-specific cleanup
    if (workspaceType === 'd365') {
      // D365-specific cleanup
      // Step 2: Remove duplicate consecutive waitForD365 calls (do this first)
      cleaned = this.removeDuplicateWaits(cleaned);

      // Step 3: Remove unnecessary waitForTimeout calls after combobox Enter (do this before enhancing)
      cleaned = this.removeRedundantTimeouts(cleaned);

      // Step 4: Enhance combobox patterns for D365 (click -> wait -> clear -> fill -> wait -> press Enter)
      // This adds waits where needed, so do it after removing redundant ones
      cleaned = this.enhanceComboboxPatterns(cleaned);

      // Step 5: Remove any new duplicates created by enhancement
      cleaned = this.removeDuplicateWaits(cleaned);
      cleaned = this.removeRedundantTimeouts(cleaned);

      // Step 6: Add automatic assertions for sales order patterns
      cleaned = this.addSalesOrderAssertions(cleaned);
    } else if (workspaceType === 'web-demo') {
      // Web-specific cleanup
      // Step 2: Remove redundant waitForTimeout calls (web apps may have excessive waits)
      cleaned = this.removeRedundantWebWaits(cleaned);

      // Step 3: Add common web assertions (can be extended based on needs)
      cleaned = this.addWebAssertions(cleaned);
    } else {
      // Generic/Salesforce: minimal cleanup, just ensure expect import is present
      // Can add workspace-specific logic here as needed
      // For now, we can also apply web cleanup to generic if needed
      if (workspaceType === 'generic') {
        // Apply basic web cleanup for generic workspaces
        cleaned = this.removeRedundantWebWaits(cleaned);
      }
    }

    return cleaned;
  }

  /**
   * Remove duplicate/consecutive waitForD365 calls and redundant waits
   * Pattern: await waitForD365(page);\n await waitForD365(page);
   */
  private removeDuplicateWaits(code: string): string {
    // Remove consecutive waitForD365 calls (with optional semicolons and whitespace)
    // This handles multiple consecutive waits
    let previousLength = 0;
    while (code.length !== previousLength) {
      previousLength = code.length;
      code = code.replace(/(await\s+waitForD365\(page\);?\s*\n\s*)await\s+waitForD365\(page\);?\s*\n/g, '$1');
    }

    // Remove waitForD365 immediately followed by another waitForD365 on same line (with semicolon)
    const sameLineDuplicate = /await\s+waitForD365\(page\);?\s*;?\s*await\s+waitForD365\(page\)/g;
    code = code.replace(sameLineDuplicate, 'await waitForD365(page)');

    // Remove waitForD365 followed by waitForTimeout (waitForD365 is sufficient)
    const waitThenTimeout = /(await\s+waitForD365\(page\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g;
    code = code.replace(waitThenTimeout, '$1');

    // Remove waitForTimeout followed by waitForD365 (waitForD365 is sufficient)
    const timeoutThenWait = /(await\s+page\.waitForTimeout\(\d+\);?\s*\n\s*)await\s+waitForD365\(page\);?\s*\n/g;
    code = code.replace(timeoutThenWait, '$1await waitForD365(page);\n');

    // Remove waitForD365 after combobox click (only needed after Enter)
    // Pattern: combobox.click() -> waitForD365 (remove this wait)
    const comboboxClickWait = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]+\}\)\.click\(\)[^\n]*\n)\s*await\s+waitForD365\(page\);?\s*\n/g;
    code = code.replace(comboboxClickWait, '$1');

    // Remove waitForD365 after treeitem click (usually not needed, navigation handles it)
    const treeitemClickWait = /(await\s+page\.getByRole\(['"]treeitem['"],\s*\{[^}]+\}\)\.click\(\)[^\n]*\n)\s*await\s+waitForD365\(page\);?\s*\n/g;
    code = code.replace(treeitemClickWait, '$1');

    // Remove waitForD365 after button click that's not Save/OK/New (these buttons need waits)
    // But keep it for Save, OK, and New buttons
    const buttonClickWait = /(await\s+page\.getByRole\(['"]button['"],\s*\{[^}]*name:\s*['"](?!Save|OK|New|.*New)[^'"]*['"][^}]*\}\)\.click\(\)[^\n]*\n)\s*await\s+waitForD365\(page\);?\s*\n/g;
    code = code.replace(buttonClickWait, '$1');

    return code;
  }

  /**
   * Remove unnecessary waitForTimeout calls after combobox Enter presses and other redundant timeouts
   * Pattern: .press('Enter')\n await waitForD365(page);\n await page.waitForTimeout(1000);
   * Should become: .press('Enter')\n await waitForD365(page);
   */
  private removeRedundantTimeouts(code: string): string {
    // Remove waitForTimeout that appears after waitForD365 (waitForD365 is sufficient)
    // This handles the pattern: waitForD365 -> waitForTimeout
    let previousLength = 0;
    while (code.length !== previousLength) {
      previousLength = code.length;
      code = code.replace(/(await\s+waitForD365\(page\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g, '$1');
    }

    // Remove waitForTimeout that appears after combobox Enter + waitForD365
    // Pattern: .press('Enter')\n await waitForD365(page);\n await page.waitForTimeout(1000);
    const comboboxEnterPattern = /(\.press\(['"]Enter['"]\)[^\n]*\n\s*await\s+waitForD365\(page\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g;
    code = code.replace(comboboxEnterPattern, '$1');

    // Remove waitForTimeout between combobox operations and waitForD365
    // Pattern: .press('Enter')\n await page.waitForTimeout(1000);\n await waitForD365(page);
    const timeoutBeforeWait = /(\.press\(['"]Enter['"]\)[^\n]*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n\s*(await\s+waitForD365\(page\);?\s*\n)/g;
    code = code.replace(timeoutBeforeWait, '$1$2');

    // Remove waitForTimeout that appears right before waitForD365 (waitForD365 is sufficient)
    // Pattern: some action -> waitForTimeout -> waitForD365
    const timeoutBeforeWaitGeneral = /(await\s+page\.waitForTimeout\(\d+\);?\s*\n\s*)await\s+waitForD365\(page\);?\s*\n/g;
    code = code.replace(timeoutBeforeWaitGeneral, '$1await waitForD365(page);\n');

    // Remove double semicolons after waitForD365 (cleanup artifact)
    code = code.replace(/await\s+waitForD365\(page\);?\s*;+\s*\n/g, 'await waitForD365(page);\n');

    return code;
  }

  /**
   * Ensure expect is imported from @playwright/test
   * Also removes duplicate imports and optionally test.use() calls
   * @param shouldRemoveTestUse If false, keeps test.use() calls (for web-demo workspaces)
   */
  private ensureExpectImport(code: string, shouldRemoveTestUse: boolean = true): string {
    // Step 1: Remove test.use() calls only if requested (storage state should be in playwright.config.ts for D365)
    // For web-demo workspaces, keep test.use() in the spec file
    if (shouldRemoveTestUse) {
      code = code.replace(/test\.use\s*\(\s*\{[\s\S]*?\}\s*\);?\s*\n?/g, '');
    }
    
    // Step 2: Remove duplicate imports from @playwright/test
    const importPattern = /import\s+\{[^}]*\}\s+from\s+['"]@playwright\/test['"];?\s*\n?/g;
    const imports = code.match(importPattern) || [];
    
    if (imports.length > 1 && imports[0]) {
      // Keep only the first import, but ensure it has both test and expect
      const firstImport = imports[0];
      let cleanedImport = firstImport;
      
      // If first import doesn't have expect, add it
      if (!firstImport.includes('expect')) {
        cleanedImport = firstImport.replace(
          /import\s+\{\s*test\s*\}\s+from/,
          "import { test, expect } from"
        );
      } else if (!firstImport.includes('test')) {
        // If it has expect but not test, add test
        cleanedImport = firstImport.replace(
          /import\s+\{\s*expect\s*\}\s+from/,
          "import { test, expect } from"
        );
      }
      
      // Remove all duplicate imports
      code = code.replace(importPattern, '');
      // Add the cleaned import at the beginning (before any other imports)
      const firstNonImportIndex = code.search(/^(?!import)/m);
      if (firstNonImportIndex !== -1) {
        code = cleanedImport + '\n' + code.slice(firstNonImportIndex);
      } else {
        code = cleanedImport + '\n' + code;
      }
    }
    
    // Step 3: Check if expect is already imported
    if (code.includes("import { test, expect }") || code.includes("import { expect }")) {
      return code;
    }

    // Check if there's a test import we can extend
    const testImportRegex = /import\s+\{\s*test\s*\}\s+from\s+['"]@playwright\/test['"];?/;
    if (testImportRegex.test(code)) {
      code = code.replace(testImportRegex, "import { test, expect } from '@playwright/test';");
    } else {
      // Add expect import if no test import exists (unlikely but handle it)
      const firstImportIndex = code.indexOf('import');
      if (firstImportIndex !== -1) {
        const nextLineIndex = code.indexOf('\n', firstImportIndex);
        code = code.slice(0, nextLineIndex + 1) + 
               "import { expect } from '@playwright/test';\n" + 
               code.slice(nextLineIndex + 1);
      }
    }

    return code;
  }

  /**
   * Enhance combobox patterns to match perfect D365 pattern:
   * click -> wait 1000ms -> clear -> fill -> wait (8000ms for customer account, 5000ms for others) -> press Enter -> waitForD365
   */
  private enhanceComboboxPatterns(code: string): string {
    // Pattern 1: Customer account combobox (needs 8000ms wait)
    // Look for: combobox click -> (optional clear) -> fill -> (optional wait) -> press Enter
    const customerAccountClickPattern = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]*name:\s*['"]Customer account['"][^}]*\}\)\.click\(\)[^\n]*;?\s*\n)/i;
    
    code = code.replace(customerAccountClickPattern, (match) => {
      // Check if already has waitForTimeout(1000) after click
      const afterClick = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 200);
      if (afterClick.includes('waitForTimeout(1000)')) {
        return match;
      }
      
      // Add wait 1000ms after click
      return `${match}      await page.waitForTimeout(1000);

`;
    });

    // Pattern 2: Customer account fill - ensure clear() is before fill and add 8000ms wait
    const customerAccountFillPattern = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]*name:\s*['"]Customer account['"][^}]*\}\)\.fill\([^)]+\)[^\n]*;?\s*\n)/i;
    
    code = code.replace(customerAccountFillPattern, (match) => {
      // Check if already enhanced
      const beforeFill = code.substring(Math.max(0, code.indexOf(match) - 200), code.indexOf(match));
      const afterFill = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 200);
      
      if (beforeFill.includes('.clear()') && afterFill.includes('waitForTimeout(8000)')) {
        return match;
      }
      
      // Add clear() before fill if not present
      let enhanced = match;
      if (!beforeFill.includes('.clear()')) {
        enhanced = `      await page.getByRole('combobox', { name: 'Customer account' }).clear();

${enhanced}`;
      }
      
      // Add 8000ms wait after fill if not present
      if (!afterFill.includes('waitForTimeout(8000)')) {
        enhanced = enhanced.replace(/\);?\s*\n/, `);

      await page.waitForTimeout(8000);

`);
      }
      
      return enhanced;
    });

    // Pattern 3: Other comboboxes (need 5000ms wait)
    // Look for combobox patterns that aren't customer account
    const otherComboboxClickPattern = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]*name:\s*['"](?!Customer account)([^'"]+)['"][^}]*\}\)\.click\(\)[^\n]*;?\s*\n)/i;
    
    code = code.replace(otherComboboxClickPattern, (match, _, comboboxName) => {
      // Check if already has waitForTimeout(1000) after click
      const afterClick = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 200);
      if (afterClick.includes('waitForTimeout(1000)')) {
        return match;
      }
      
      // Add wait 1000ms after click
      return `${match}      await page.waitForTimeout(1000);

`;
    });

    // Pattern 4: Other combobox fill - ensure clear() is before fill and add 5000ms wait
    const otherComboboxFillPattern = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]*name:\s*['"](?!Customer account)([^'"]+)['"][^}]*\}\)\.fill\([^)]+\)[^\n]*;?\s*\n)/i;
    
    code = code.replace(otherComboboxFillPattern, (match, _, comboboxName) => {
      // Check if already enhanced
      const beforeFill = code.substring(Math.max(0, code.indexOf(match) - 200), code.indexOf(match));
      const afterFill = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 200);
      
      if (beforeFill.includes('.clear()') && afterFill.includes('waitForTimeout(5000)')) {
        return match;
      }
      
      // Add clear() before fill if not present
      let enhanced = match;
      if (!beforeFill.includes('.clear()')) {
        enhanced = `      await page.getByRole('combobox', { name: '${comboboxName}' }).clear();

${enhanced}`;
      }
      
      // Add 5000ms wait after fill if not present
      if (!afterFill.includes('waitForTimeout(5000)')) {
        enhanced = enhanced.replace(/\);?\s*\n/, `);

      await page.waitForTimeout(5000);

`);
      }
      
      return enhanced;
    });

    return code;
  }

  /**
   * Add automatic assertions for sales order creation patterns (PERFECT pattern)
   * 1. After customer account Enter + waitForD365, capture Sales Order ID
   * 2. After OK button + waitForD365, validate header contains captured ID
   */
  private addSalesOrderAssertions(code: string): string {
    // Pattern 1: After customer account combobox Enter + waitForD365, capture Sales Order ID
    // Pattern: await page.getByRole('combobox', { name: 'Customer account' }).press('Enter')
    //          await waitForD365(page);
    const customerAccountEnterPattern = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]*name:\s*['"]Customer account['"][^}]*\}\)\.press\(['"]Enter['"]\)[^\n]*\n\s*await\s+waitForD365\(page\);?\s*\n)/i;
    
    code = code.replace(customerAccountEnterPattern, (match) => {
      // Check if sales order ID capture already exists
      const afterMatch = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 500);
      if (afterMatch.includes('SalesTable_SalesId') || afterMatch.includes('salesOrderInput') || afterMatch.includes('Captured Sales Order ID')) {
        return match;
      }
      
      return `${match}      const salesOrderInput = page.locator('//input[@name="SalesTable_SalesId"]');

      await expect(salesOrderInput).not.toHaveValue('', { timeout: 20000 }); 

      const expectedValue = await salesOrderInput.inputValue(); 

      console.log(\`✅ Captured Sales Order ID for validation: \${expectedValue}\`);

`;
    });

    // Pattern 2: After OK button click + waitForD365, validate header contains captured Sales Order ID
    // Pattern: await page.getByRole('button', { name: 'OK' }).click()
    //          await waitForD365(page);
    const okButtonPattern = /(await\s+page\.getByRole\(['"]button['"],\s*\{[^}]*name:\s*['"]OK['"][^}]*\}\)\.click\(\)[^\n]*\n\s*await\s+waitForD365\(page\);?\s*\n)/i;
    
    code = code.replace(okButtonPattern, (match) => {
      // Check if header validation already exists
      const afterMatch = code.substring(code.indexOf(match) + match.length, code.indexOf(match) + match.length + 500);
      if (afterMatch.includes('HeaderTitle') || afterMatch.includes('headerTitleSpan') || afterMatch.includes('Final Validation Passed')) {
        return match;
      }
      
      return `${match}      const headerTitleSpan = page.locator('//span[@data-dyn-controlname="HeaderTitle"]');

      await headerTitleSpan.waitFor({ state: 'visible', timeout: 30000 }); 

      await expect(headerTitleSpan).toContainText(expectedValue, { timeout: 15000 });

      console.log(\`✅ Final Validation Passed: Confirmed header contains the dynamically captured ID: \${expectedValue}\`);

`;
    });

    return code;
  }

  /**
   * Remove redundant waitForTimeout calls for web workspaces
   * Web apps may have excessive waits that can be optimized
   */
  private removeRedundantWebWaits(code: string): string {
    // Remove consecutive waitForTimeout calls
    const duplicateTimeoutPattern = /(await\s+page\.waitForTimeout\(\d+\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g;
    code = code.replace(duplicateTimeoutPattern, '$1');

    // Remove waitForTimeout immediately after page.waitForLoadState (loadState is usually sufficient)
    const loadStateThenTimeout = /(await\s+page\.waitForLoadState\([^)]+\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g;
    code = code.replace(loadStateThenTimeout, '$1');

    // Remove waitForTimeout immediately after page.waitForSelector (selector wait is usually sufficient)
    const selectorThenTimeout = /(await\s+page\.waitForSelector\([^)]+\);?\s*\n\s*)await\s+page\.waitForTimeout\(\d+\);?\s*\n/g;
    code = code.replace(selectorThenTimeout, '$1');

    return code;
  }

  /**
   * Add common web assertions (can be extended based on specific needs)
   * For now, this is a placeholder for future web-specific assertion patterns
   */
  private addWebAssertions(code: string): string {
    // Placeholder for web-specific assertions
    // Examples could include:
    // - Form submission success checks
    // - Navigation URL validation
    // - Element visibility after actions
    // This can be extended as needed for web testing patterns

    return code;
  }
}

