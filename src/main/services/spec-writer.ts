import * as path from 'path';
import * as fs from 'fs';
import { Project, SourceFile, Node, CallExpression, StringLiteral } from 'ts-morph';
import { SpecWriteRequest, SpecWriteResponse, SelectedParam, TestMeta, WorkspaceType, DataRow } from '../../types/v1.5';
import { D365WaitInjector } from './d365-wait-injector';
import { WorkspaceManager } from './workspace-manager';
import { DataWriter } from './data-writer';
import { SpecGenerator } from '../../generators/spec-generator';

/**
 * Service for writing flat Playwright spec files
 */
export class SpecWriter {
  private workspaceManager: WorkspaceManager;
  private waitInjector: D365WaitInjector;
  private dataWriter: DataWriter;
  private specGenerator: SpecGenerator;

  constructor(workspaceManager: WorkspaceManager) {
    this.workspaceManager = workspaceManager;
    this.waitInjector = new D365WaitInjector();
    this.dataWriter = new DataWriter();
    this.specGenerator = new SpecGenerator();
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

      // Ensure runtime directory exists for D365 workspaces
      if (workspaceType === 'd365') {
        const runtimeDir = path.join(request.workspacePath, 'runtime');
        fs.mkdirSync(runtimeDir, { recursive: true });
        
        // Create or update waitForD365 helper
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

      // Inject waitForD365 calls for D365 workspaces
      if (workspaceType === 'd365') {
        this.waitInjector.injectWaits(sourceFile, workspaceType);
      }

      // Create parameter map for quick lookup
      const paramMap = new Map<string, string>();
      for (const param of request.selectedParams) {
        paramMap.set(param.id, param.variableName);
      }

      // Replace parameterized values
      this.parameterizeCode(sourceFile, paramMap);

      // Generate data-driven test structure
      const specContent = this.generateSpecContent(
        request.testName,
        request.module,
        sourceFile.getFullText(),
        workspaceType
      );

      // Convert test name to kebab-case filename (same as SpecGenerator)
      const fileName = this.specGenerator.flowNameToFileName(request.testName);
      const formattedTestName = this.specGenerator.formatTestName(request.testName);

      // Create bundle directory structure: tests/d365/specs/<TestName>/
      const bundleDir = path.join(testsDir, 'd365', 'specs', fileName);
      fs.mkdirSync(bundleDir, { recursive: true });

      // Write spec file to bundle directory
      const specPath = path.join(bundleDir, `${fileName}.spec.ts`);
      fs.writeFileSync(specPath, specContent, 'utf-8');

      // Fix data import path in spec content (from ../data/ to ../../data/)
      // Since spec is now in tests/d365/specs/<TestName>/, data is at tests/d365/data/
      const fixedSpecContent = this.fixDataImportPath(specContent, specPath);
      if (fixedSpecContent !== specContent) {
        fs.writeFileSync(specPath, fixedSpecContent, 'utf-8');
      }

      // Generate data file path (at tests/d365/data/<TestName>Data.json)
      const dataDir = path.join(testsDir, 'd365', 'data');
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

      // Create or update data file with parameter columns
      // Data file should be at tests/d365/data/<TestName>Data.json
      if (parameters.length > 0) {
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
        
        // Get all parameter column names
        const paramColumnSet = new Set(parameters);
        
        // Merge with existing columns
        const allColumns = new Set([...existingColumns, ...paramColumnSet]);
        
        // Create default row with all parameters included
        const createDefaultRow = (): DataRow => {
          const defaultRow: DataRow = {
            id: Date.now().toString(),
            enabled: true,
            name: 'Default',
          };
          
          // Dynamically add all parameter keys with empty strings
          parameters.forEach(paramName => {
            defaultRow[paramName] = '';
          });
          
          return defaultRow;
        };
        
        // Update existing rows to include all columns
        const updatedRows = existingRows.length > 0 
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
        
        // Write updated data file
        const dataContent = JSON.stringify(updatedRows, null, 2);
        fs.writeFileSync(dataPath, dataContent, 'utf-8');
      }

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
    
    // 2. Remove test.use() calls (storage state is configured in playwright.config.ts)
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
    
    // Add waitForD365 import for D365 workspaces
    // Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
    // Runtime structure: runtime/d365-waits.ts (at workspace root)
    // From bundle: Up 1 (TestName) -> Up 2 (specs) -> Up 3 (d365) -> Up 4 (tests) -> Root
    // Import path: ../../../../runtime/d365-waits
    if (workspaceType === 'd365') {
      content += `import { waitForD365 } from '../../../../runtime/d365-waits';\n`;
    }
    content += `\n`;
    
    // Note: The data file path is relative to the spec file location
    // When tests run, they're copied to Recordings/tests, so data should be in Recordings/data
    // Storage state is configured globally in playwright.config.ts, so we don't set it here
    
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

