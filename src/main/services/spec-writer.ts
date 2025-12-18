import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Project, SourceFile, Node, CallExpression, StringLiteral } from 'ts-morph';
import { SpecWriteRequest, SpecWriteResponse, SelectedParam, TestMeta, WorkspaceType, DataRow } from '../../types/v1.5';
import { D365WaitInjector } from './d365-wait-injector';
import { WebScrollInjector } from './web-scroll-injector';
import { WorkspaceManager } from './workspace-manager';
import { DataWriter } from './data-writer';
import { SpecGenerator } from '../../generators/spec-generator';
import { BrowserStackTmService } from './browserstackTmService';
import { BrowserStackTmClientError } from '../../types/browserstack-tm';

/**
 * Service for writing flat Playwright spec files.
 * 
 * The SpecWriter generates and writes Playwright test specifications with:
 * - Parameterized test data support
 * - Workspace-specific wait helpers (D365, Salesforce)
 * - Scroll injection for web workspaces
 * - BrowserStack Test Management integration
 * - Test metadata generation (.meta.md files)
 * - Data file creation and management
 * 
 * @remarks
 * Generates specs in bundle structure: tests/<platformDir>/specs/<TestName>/
 * Also creates associated data files and metadata files.
 */
export class SpecWriter {
  private workspaceManager: WorkspaceManager;
  private waitInjector: D365WaitInjector;
  private scrollInjector: WebScrollInjector;
  private dataWriter: DataWriter;
  private specGenerator: SpecGenerator;
  private browserStackTMService: BrowserStackTmService;

  constructor(workspaceManager: WorkspaceManager, browserStackTMService: BrowserStackTmService) {
    this.workspaceManager = workspaceManager;
    this.waitInjector = new D365WaitInjector();
    this.scrollInjector = new WebScrollInjector();
    this.dataWriter = new DataWriter();
    this.specGenerator = new SpecGenerator();
    this.browserStackTMService = browserStackTMService;
  }

  /**
   * Write spec file with parameterized values
   */
  async writeSpec(request: SpecWriteRequest): Promise<SpecWriteResponse> {
    try {
      // Ensure tests directory exists
      const testsDir = path.join(request.workspacePath, 'tests');
      fs.mkdirSync(testsDir, { recursive: true });

      // Get workspace type
      const workspace = await this.workspaceManager.loadWorkspace(request.workspacePath);
      const workspaceType: WorkspaceType = workspace?.type || 'd365';

      // Ensure storage state exists in workspace (for D365 and Salesforce workspaces)
      if (workspaceType === 'd365' || workspaceType === 'salesforce') {
        await this.ensureStorageState(request.workspacePath, workspaceType);
      }

      // Ensure runtime directory exists for D365 and Salesforce workspaces (they share auth)
      if (workspaceType === 'd365' || workspaceType === 'salesforce') {
        const runtimeDir = path.join(request.workspacePath, 'runtime');
        fs.mkdirSync(runtimeDir, { recursive: true });
        
        // Create or update waitForD365 helper (shared by D365 and Salesforce)
        const waitHelperPath = path.join(runtimeDir, 'd365-waits.ts');
        const waitHelperContent = `import type { Page } from '@playwright/test';

/**
 * Wait for D365 to stabilize after heavy actions
 * This helper ensures network requests complete and UI is ready
 */
export async function waitForD365(page: Page): Promise<void> {
  // 1. Wait for network to settle (best effort)
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  // 2. Wait for the D365 shell blocker overlay to disappear
  const blockingDiv = page.locator('#ShellBlockingDiv');
  try {
    if (await blockingDiv.count() > 0) {
      await blockingDiv.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    }
  } catch {
    // Ignore errors from locator lookups; we'll rely on the timeout below
  }

  // 3. Small buffer for UI animation / rendering
  await page.waitForTimeout(500);
}
`;
        const shouldWriteWaitHelper =
          !fs.existsSync(waitHelperPath) ||
          fs.readFileSync(waitHelperPath, 'utf-8') !== waitHelperContent;

        if (shouldWriteWaitHelper) {
          fs.writeFileSync(waitHelperPath, waitHelperContent, 'utf-8');
        }
      }

      // Parse cleaned code
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', request.cleanedCode, { overwrite: true });

      // Inject waitForD365 calls for D365 and Salesforce workspaces (they share auth)
      if (workspaceType === 'd365' || workspaceType === 'salesforce') {
        this.waitInjector.injectWaits(sourceFile, workspaceType);
      }

      // Create parameter map for quick lookup
      const paramMap = new Map<string, string>();
      for (const param of request.selectedParams) {
        paramMap.set(param.id, param.variableName);
      }

      // Replace parameterized values
      this.parameterizeCode(sourceFile, paramMap);

      // Get code content for scroll injection (for web workspaces)
      let codeContent = sourceFile.getFullText();
      
      // Inject scrollIntoViewIfNeeded for web workspaces
      if (workspaceType === 'web-demo' || workspaceType === 'generic') {
        codeContent = this.scrollInjector.injectScrolls(codeContent, workspaceType);
      }

      // Generate data-driven test structure
      const specContent = this.generateSpecContent(
        request.testName,
        request.module,
        codeContent,
        workspaceType
      );

      // Convert test name to kebab-case filename (same as SpecGenerator)
      const fileName = this.specGenerator.flowNameToFileName(request.testName);
      const formattedTestName = this.specGenerator.formatTestName(request.testName);

      // Choose platform-specific subfolder based on workspace type
      const platformDir = workspaceType === 'd365' ? 'd365' 
                        : workspaceType === 'salesforce' ? 'salesforce'
                        : workspaceType === 'koerber' ? 'koerber'
                        : 'web';

      // Create bundle directory structure: tests/<platformDir>/specs/<TestName>/
      const bundleDir = path.join(testsDir, platformDir, 'specs', fileName);
      fs.mkdirSync(bundleDir, { recursive: true });

      // Write spec file to bundle directory
      const specPath = path.join(bundleDir, `${fileName}.spec.ts`);
      fs.writeFileSync(specPath, specContent, 'utf-8');

      // Fix data import path in spec content (from ../data/ to ../../data/)
      // Since spec is now in tests/<platformDir>/specs/<TestName>/, data is at tests/<platformDir>/data/
      const fixedSpecContent = this.fixDataImportPath(specContent, specPath);
      if (fixedSpecContent !== specContent) {
        fs.writeFileSync(specPath, fixedSpecContent, 'utf-8');
      }

      // Generate data file path (at tests/<platformDir>/data/<TestName>Data.json)
      const dataDir = path.join(testsDir, platformDir, 'data');
      const dataFilePath = path.join(dataDir, `${fileName}Data.json`);

      // Generate and write meta.json using SpecGenerator
      const metaJsonContent = this.specGenerator.generateMetaJson(
        formattedTestName,
        request.module,
        dataFilePath,
        specPath
      );
      const metaJsonPath = path.join(bundleDir, `${fileName}.meta.json`);
      fs.writeFileSync(metaJsonPath, metaJsonContent, 'utf-8');

      // Generate and write meta.md using SpecGenerator
      const metaMdContent = this.specGenerator.generateMetaMd(
        formattedTestName,
        request.testName, // Use original test name for intent
        fixedSpecContent, // Use fixed content with correct import paths
        request.module
      );
      const metaMdPath = path.join(bundleDir, `${fileName}.meta.md`);
      fs.writeFileSync(metaMdPath, metaMdContent, 'utf-8');

      // Ensure BrowserStack TM test case is created/linked for this bundle (v2.0 demo)
      // Only attempt if TM is enabled on the account
      try {
        const isTmEnabled = await this.browserStackTMService.isTestManagementEnabled();
        if (!isTmEnabled) {
          console.log('[SpecWriter] BrowserStack Test Management is not enabled for this account. Skipping TM sync. (Automate execution is unaffected.)');
        } else {
          const bundleMeta = this.browserStackTMService.readBundleMeta(bundleDir);
          await this.browserStackTMService.ensureTestCaseForBundle(bundleMeta);
        }
      } catch (e: any) {
        // Check if it's a 404 (TM not enabled) and provide user-friendly message
        if (e instanceof BrowserStackTmClientError && e.statusCode === 404) {
          console.log('[SpecWriter] BrowserStack Test Management is not enabled for this account. Skipping TM sync. (Automate execution is unaffected.)');
        } else {
          console.warn('[SpecWriter] Failed to sync BrowserStack TM test case:', e.message);
        }
      }

      // Extract parameters from selectedParams or from the generated spec code
      let parameters: string[] = [];
      
      // First, try to use selectedParams from the request
      if (request.selectedParams.length > 0) {
        parameters = request.selectedParams.map(p => p.variableName);
      } else {
        // Fallback: Extract parameters from the generated spec code
        // Look for patterns like row.variableName or row['variableName']
        const rowPattern = /row\.([a-zA-Z_$][a-zA-Z0-9_$]*)|row\[['"]([a-zA-Z_$][a-zA-Z0-9_$]*)['"]\]/g;
        const foundParams = new Set<string>();
        let match;
        
        while ((match = rowPattern.exec(fixedSpecContent)) !== null) {
          const paramName = match[1] || match[2]; // match[1] for row.param, match[2] for row['param']
          if (paramName && paramName !== 'id' && paramName !== 'enabled' && paramName !== 'name') {
            foundParams.add(paramName);
          }
        }
        
        parameters = Array.from(foundParams);
      }

      // Always create or update data file (even if no parameters)
      // Data file should be at tests/<platformDir>/data/<TestName>Data.json
      // Use the dataDir we already defined above
      fs.mkdirSync(dataDir, { recursive: true });
      
      const dataPath = path.join(dataDir, `${fileName}Data.json`);
      
      let existingRows: DataRow[] = [];
      let existingColumns = new Set<string>();
      
      // Load existing data if file exists
      if (fs.existsSync(dataPath)) {
        try {
          const existingContent = fs.readFileSync(dataPath, 'utf-8');
          existingRows = JSON.parse(existingContent);
          if (Array.isArray(existingRows) && existingRows.length > 0) {
            existingColumns = new Set(Object.keys(existingRows[0]));
          }
        } catch (e) {
          // If can't parse, start fresh
          existingRows = [];
        }
      }
      
      // Create default row helper
      const createDefaultRow = (): DataRow => {
        const defaultRow: DataRow = {
          id: Date.now().toString(),
          enabled: true,
          name: 'Default',
        };
        
        // Dynamically add all parameter keys with empty strings (if parameters exist)
        parameters.forEach(paramName => {
          defaultRow[paramName] = '';
        });
        
        return defaultRow;
      };
      
      let updatedRows: DataRow[];
      
      if (parameters.length > 0) {
        // Get all parameter column names
        const paramColumnSet = new Set(parameters);
        
        // Merge with existing columns
        const allColumns = new Set([...existingColumns, ...paramColumnSet]);
        
        // Update existing rows to include all columns
        updatedRows = existingRows.length > 0 
          ? existingRows.map(row => {
              const updated: DataRow = { ...row };
              // Add missing parameter columns with empty values
              parameters.forEach(paramName => {
                if (!(paramName in updated)) {
                  updated[paramName] = '';
                }
              });
              return updated;
            })
          : [createDefaultRow()];
        
        // If no rows exist after processing, ensure we have at least one default row
        if (updatedRows.length === 0) {
          updatedRows.push(createDefaultRow());
        }
      } else {
        // No parameters - just ensure we have at least one default row
        updatedRows = existingRows.length > 0 ? existingRows : [createDefaultRow()];
      }
      
      // Write updated data file
      const dataContent = JSON.stringify(updatedRows, null, 2);
      fs.writeFileSync(dataPath, dataContent, 'utf-8');

      return {
        success: true,
        specPath: path.relative(request.workspacePath, specPath),
        metaPath: path.relative(request.workspacePath, metaJsonPath),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to write spec file',
      };
    }
  }

  /**
   * Parameterize code by replacing string literals with row.paramName
   */
  private parameterizeCode(sourceFile: SourceFile, paramMap: Map<string, string>): void {
    // This is a simplified version - in a full implementation,
    // we would track which candidates were selected and replace only those
    // For now, we'll leave the code as-is and let the user manually parameterize
    // The actual parameterization happens in the spec content generation
  }

  /**
   * Generate the final spec file content with data-driven structure
   */
  private generateSpecContent(testName: string, module: string | undefined, cleanedCode: string, workspaceType: WorkspaceType): string {
    // Check if code already has data-driven structure (from compileSteps)
    const hasDataDrivenStructure = cleanedCode.includes('test.describe') && cleanedCode.includes('for (const row of data)');
    
    if (hasDataDrivenStructure) {
      const testDescription = module 
        ? `${this.formatTestName(testName)} - ${module} - Data Driven`
        : `${this.formatTestName(testName)} - Data Driven`;

      let updatedCode = cleanedCode;

      // Replace the test.describe title
      updatedCode = updatedCode.replace(
        /test\.describe\(['"][^'"]*['"]/,
        `test.describe('${testDescription}'`
      );

      // Ensure data import points to the test's JSON file
      // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
      // Data structure: tests/d365/data/<TestName>Data.json
      // Import path: ../../data/<TestName>Data.json
      const fileName = this.specGenerator.flowNameToFileName(testName);
      // Match import with optional semicolon to avoid double semicolons
      const dataImportRegex = /import\s+data\s+from\s+['"][^'"]+['"]\s*;?/;
      if (dataImportRegex.test(updatedCode)) {
        updatedCode = updatedCode.replace(
          dataImportRegex,
          `import data from '../../data/${fileName}Data.json';`
        );
      } else {
        // If there was no data import (unlikely), prepend one
        updatedCode = `import data from '../../data/${fileName}Data.json';\n${updatedCode}`;
      }

      // Normalize or strip waitForD365 usage based on workspace type.
      // Old specs (from earlier generators) might have:
      //   import { waitForD365 } from '../runtime/d365-waits';
      //   import { waitForD365 } from '../../runtime/d365-waits';
      // In the bundle structure (tests/d365/specs/<TestName>/<TestName>.spec.ts)
      // the correct relative path is: ../../../../runtime/d365-waits
      if (workspaceType === 'd365' || workspaceType === 'salesforce') {
        const waitImportRegex = /import\s+\{\s*waitForD365\s*\}\s+from\s+['"].*?d365-waits['"];?/g;
        const platformDir = workspaceType === 'd365' ? 'd365' : 'salesforce';
        updatedCode = updatedCode.replace(
          waitImportRegex,
          `import { waitForD365 } from '../../../../runtime/d365-waits';`
        );
        
        // Ensure storage state is configured for D365 workspaces (use path.resolve)
        // For Salesforce, web-demo, and Koerber, use relative paths
        if (workspaceType === 'd365') {
          // Storage state is at workspace root: storage_state/d365.json
          // Use path.resolve(__dirname, ...) to resolve path dynamically
          const storageStatePattern = /test\.use\s*\(\s*\{[\s\S]*?storageState[\s\S]*?\}\s*\)/;
          if (!storageStatePattern.test(updatedCode)) {
            // Find the position after all imports (before test.describe)
            const importEndMatch = updatedCode.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
            if (importEndMatch) {
              const insertPos = importEndMatch[0].length;
              // Check if path import exists
              const hasPathImport = /import\s+.*path.*from\s+['"]path['"]/.test(updatedCode);
              const pathImport = hasPathImport ? '' : `import * as path from 'path';\n`;
              updatedCode = updatedCode.slice(0, insertPos) + 
                pathImport +
                `\n// 🔐 Resolve storage state dynamically (relative to THIS file)\n` +
                `const STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\n` +
                `test.use({ storageState: STORAGE_STATE });\n\n` +
                updatedCode.slice(insertPos);
            } else {
              // If no imports found, add it at the beginning
              updatedCode = `import * as path from 'path';\n\n` +
                `// 🔐 Resolve storage state dynamically (relative to THIS file)\n` +
                `const STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\n` +
                `test.use({ storageState: STORAGE_STATE });\n\n${updatedCode}`;
            }
          } else {
            // Replace existing storage state path with path.resolve pattern
            updatedCode = updatedCode.replace(
              /test\.use\s*\(\s*\{\s*storageState:\s*['"]([^'"]+)['"]\s*\}\s*\)/,
              `// 🔐 Resolve storage state dynamically (relative to THIS file)\nconst STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\ntest.use({ storageState: STORAGE_STATE })`
            );
            // Ensure path import exists
            if (!/import\s+.*path.*from\s+['"]path['"]/.test(updatedCode)) {
              // Add path import after other imports
              const importEndMatch = updatedCode.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
              if (importEndMatch) {
                const insertPos = importEndMatch[0].length;
                updatedCode = updatedCode.slice(0, insertPos) + 
                  `import * as path from 'path';\n` +
                  updatedCode.slice(insertPos);
              } else {
                updatedCode = `import * as path from 'path';\n${updatedCode}`;
              }
            }
          }
        } else if (workspaceType === 'salesforce') {
          // Salesforce uses d365.json but with relative path (not path.resolve)
          const storageStatePattern = /test\.use\s*\(\s*\{[\s\S]*?storageState[\s\S]*?\}\s*\)/;
          if (!storageStatePattern.test(updatedCode)) {
            const importEndMatch = updatedCode.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
            if (importEndMatch) {
              const insertPos = importEndMatch[0].length;
              updatedCode = updatedCode.slice(0, insertPos) + 
                `\ntest.use({ storageState: '../../../../storage_state/d365.json' });\n\n` +
                updatedCode.slice(insertPos);
            } else {
              updatedCode = `test.use({ storageState: '../../../../storage_state/d365.json' });\n\n${updatedCode}`;
            }
          }
        } else if (workspaceType === 'web-demo') {
          // Web-demo uses web.json with relative path
          const storageStatePattern = /test\.use\s*\(\s*\{[\s\S]*?storageState[\s\S]*?\}\s*\)/;
          if (!storageStatePattern.test(updatedCode)) {
            const importEndMatch = updatedCode.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
            if (importEndMatch) {
              const insertPos = importEndMatch[0].length;
              updatedCode = updatedCode.slice(0, insertPos) + 
                `\ntest.use({ storageState: '../../../../storage_state/web.json' });\n\n` +
                updatedCode.slice(insertPos);
            } else {
              updatedCode = `test.use({ storageState: '../../../../storage_state/web.json' });\n\n${updatedCode}`;
            }
          }
        }
        // Koerber and other types would use relative path for d365.json if needed
        
        // Fix combobox fill pattern: D365 comboboxes need to be cleared before filling
        // Also fix double await issues and add waiting logic for OK buttons after Enter
        
        // First, fix any double await issues
        updatedCode = updatedCode.replace(/await\s+await\s+/g, 'await ');
        
        // Then, fix combobox fill pattern
        // Match: await page.getByRole('combobox', { name: 'X' }).fill(Y)
        // But skip if the previous line already has .clear() for the same combobox
        const comboboxFillRegex = /(await\s+page\.getByRole\(['"]combobox['"],\s*\{[^}]+\}\))\.fill\(([^)]+)\)/g;
        updatedCode = updatedCode.replace(comboboxFillRegex, (match, locator, fillValue, offset) => {
          // Check if the previous lines already have .clear() for this combobox
          const beforeMatch = updatedCode.substring(Math.max(0, offset - 300), offset);
          const locatorPattern = locator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
          const hasClear = new RegExp(`${locatorPattern}\\.clear\\(\\)`).test(beforeMatch);
          
          if (hasClear) {
            // Already has .clear(), just return the fill line
            return `${locator}.fill(${fillValue})`;
          } else {
            // Add .clear() before .fill()
            return `${locator}.clear();\n      await ${locator}.fill(${fillValue})`;
          }
        });
        
        // Remove waitForTimeout calls that appear between waitForD365 and OK button clicks
        // Pattern: waitForD365(page); -> waitForTimeout(1000) -> OK button click
        // Replace with: waitForD365(page); -> OK button click
        const waitForD365ToOKPattern = /(await\s+waitForD365\(page\)[^\n]*;?\s*)\n\s*await\s+page\.waitForTimeout\(\d+\)[^\n]*;?\s*\n\s*(await\s+page\.getByRole\(['"]button['"],\s*\{[^}]*name:\s*['"]OK['"][^}]*\}\)\.click\(\))/g;
        updatedCode = updatedCode.replace(waitForD365ToOKPattern, (match, waitForD365, okClick) => {
          // Remove the waitForTimeout, keep just waitForD365 + OK click
          return `${waitForD365}\n      ${okClick}`;
        });
      } else {
        // Non-D365 workspaces (e.g., FH Web) should not depend on D365 runtime helpers.
        // 1) Remove any waitForD365 imports.
        const waitImportRegex = /import\s+\{\s*waitForD365\s*\}\s+from\s+['"].*?d365-waits['"];?\s*\n?/g;
        updatedCode = updatedCode.replace(waitImportRegex, '');

        // 2) Remove standalone waitForD365 calls.
        updatedCode = updatedCode.replace(/^\s*await\s+waitForD365\(page\);?\s*$/gm, '');
      }

      return updatedCode;
    }

    // Extract the test function body from cleaned code
    // This is a simplified extraction - assumes codegen output format
    let testBody = cleanedCode;

    // Remove imports and test wrapper if present
    testBody = testBody.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
    testBody = testBody.replace(/test\(['"].*?['"],\s*async\s*\([^)]*\)\s*=>\s*\{/, '');
    testBody = testBody.replace(/\}\s*\);?\s*$/, '');

    // Clean up invalid patterns that shouldn't be in test body:
    // 1. Remove test.setTimeout() calls (we set it at describe level)
    testBody = testBody.replace(/test\.setTimeout\([^)]*\);?\s*/g, '');
    
    // 2. Remove test.use() calls (we'll add storage state back for D365 workspaces)
    // Match test.use({ ... }) with proper handling of nested braces and multi-line
    testBody = testBody.replace(/test\.use\s*\(\s*\{[\s\S]*?\}\s*\);?\s*/g, '');
    
    // 3. Remove any standalone storageState assignments
    testBody = testBody.replace(/storageState\s*[:=]\s*['"][^'"]*['"];?\s*/gi, '');
    
    // 4. Clean up extra blank lines
    testBody = testBody.replace(/\n\s*\n\s*\n/g, '\n\n');
    testBody = testBody.trim();

    // Build the spec content
    // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
    // Data structure: tests/d365/data/<TestName>Data.json
    // Import path: ../../data/<TestName>Data.json
    const fileName = this.specGenerator.flowNameToFileName(testName);
    let content = `import { test } from '@playwright/test';\n`;
    content += `import data from '../../data/${fileName}Data.json';\n`;
    
    // Add waitForD365 import for D365 and Salesforce workspaces (they share auth)
    // Bundle structure: tests/<platformDir>/specs/<TestName>/<TestName>.spec.ts
    // Runtime structure: runtime/d365-waits.ts (at workspace root)
    // From bundle: Up 1 (TestName) -> Up 2 (specs) -> Up 3 (platformDir) -> Up 4 (tests) -> Root
    // Import path: ../../../../runtime/d365-waits
    if (workspaceType === 'd365' || workspaceType === 'salesforce') {
      content += `import { waitForD365 } from '../../../../runtime/d365-waits';\n`;
    }
    
    // Configure storage state based on workspace type
    // D365: use path.resolve pattern
    // Salesforce, web-demo, Koerber: use relative paths
    if (workspaceType === 'd365') {
      content += `import * as path from 'path';\n`;
      content += `\n`;
      content += `// 🔐 Resolve storage state dynamically (relative to THIS file)\n`;
      content += `const STORAGE_STATE = path.resolve(__dirname, '../../../../storage_state/d365.json');\n\n`;
      content += `test.use({ storageState: STORAGE_STATE });\n\n`;
    } else if (workspaceType === 'salesforce') {
      content += `test.use({ storageState: '../../../../storage_state/d365.json' });\n\n`;
    } else if (workspaceType === 'web-demo') {
      content += `test.use({ storageState: '../../../../storage_state/web.json' });\n\n`;
    } else if (workspaceType === 'koerber') {
      content += `test.use({ storageState: '../../../../storage_state/d365.json' });\n\n`;
    }
    
    const testDescription = module 
      ? `${this.formatTestName(testName)} - ${module} - Data Driven`
      : `${this.formatTestName(testName)} - Data Driven`;

    content += `test.describe('${testDescription}', () => {\n`;
    content += `  test.setTimeout(120_000); // 2 minutes for D365\n\n`;
    content += `  for (const row of data) {\n`;
    content += `    test(\`\${row.name || row.id || 'Test'}\`, async ({ page }) => {\n`;
    
    // Add test body (indented)
    const indentedBody = testBody
      .split('\n')
      .filter(line => line.trim().length > 0) // Remove empty lines
      .map(line => '      ' + line.trim())
      .join('\n');
    content += indentedBody;
    if (indentedBody.length > 0) {
      content += '\n';
    }
    
    content += `    });\n`;
    content += `  }\n`;
    content += `});\n`;

    // Clean up double semicolons (e.g., "import ...';;" or "await ...();;")
    content = content.replace(/;;+/g, ';');

    return content;
  }

  /**
   * Format test name for display
   */
  private formatTestName(name: string): string {
    return name
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Ensure storage state exists in workspace
   */
  private async ensureStorageState(workspacePath: string, workspaceType: WorkspaceType): Promise<void> {
    const storageStateFileName = workspaceType === 'web-demo' 
      ? 'web.json' 
      : 'd365.json'; // D365 and Salesforce share d365.json
    const workspaceStorageState = path.join(workspacePath, 'storage_state', storageStateFileName);
    
    if (fs.existsSync(workspaceStorageState)) {
      return; // Already exists
    }

    // For D365/Salesforce workspaces, try to copy from default location
    if (workspaceType !== 'web-demo') {
      // Try default FourHands Automation Suite location
      const defaultStorageState = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'FourHands-Automation-Suite',
        'storage_state',
        'd365.json'
      );

      if (fs.existsSync(defaultStorageState)) {
        const workspaceStorageStateDir = path.dirname(workspaceStorageState);
        fs.mkdirSync(workspaceStorageStateDir, { recursive: true });
        fs.copyFileSync(defaultStorageState, workspaceStorageState);
        console.log('[SpecWriter] Copied storage state to workspace');
      } else {
        console.warn('[SpecWriter] Storage state not found. Tests may fail without authentication.');
      }
    }
  }

  /**
   * Fix data import path from ../data/ to ../../data/
   * Since spec is now in tests/d365/specs/<TestName>/, data is at tests/d365/data/
   */
  private fixDataImportPath(specContent: string, specPath: string): string {
    // Match import statements like: import data from '../data/TestName.json';
    // Include optional semicolon in the match to avoid double semicolons
    const importRegex = /import\s+data\s+from\s+['"]\.\.\/data\/([^'"]+)['"]\s*;?/g;
    
    let fixedContent = specContent;
    let match;
    
    while ((match = importRegex.exec(specContent)) !== null) {
      const fileName = match[1];
      // Replace ../data/ with ../../data/ (include semicolon in replacement)
      const oldImport = match[0];
      const newImport = `import data from '../../data/${fileName}';`;
      fixedContent = fixedContent.replace(oldImport, newImport);
    }
    
    return fixedContent;
  }
}

