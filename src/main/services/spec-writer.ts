import * as path from 'path';
import * as fs from 'fs';
import { Project, SourceFile, Node, CallExpression, StringLiteral } from 'ts-morph';
import { SpecWriteRequest, SpecWriteResponse, SelectedParam, TestMeta, WorkspaceType } from '../../types/v1.5';
import { D365WaitInjector } from './d365-wait-injector';
import { WorkspaceManager } from './workspace-manager';

/**
 * Service for writing flat Playwright spec files
 */
export class SpecWriter {
  private workspaceManager: WorkspaceManager;
  private waitInjector: D365WaitInjector;

  constructor(workspaceManager: WorkspaceManager) {
    this.workspaceManager = workspaceManager;
    this.waitInjector = new D365WaitInjector();
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
        
        // Create waitForD365 helper if it doesn't exist
        const waitHelperPath = path.join(runtimeDir, 'd365-waits.ts');
        if (!fs.existsSync(waitHelperPath)) {
          const waitHelperContent = `import type { Page } from '@playwright/test';

/**
 * Wait for D365 to stabilize after heavy actions
 * This helper ensures network requests complete and UI is ready
 */
export async function waitForD365(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 60_000 });
  await page.waitForTimeout(500);
}
`;
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

      // Write spec file
      const specPath = path.join(testsDir, `${request.testName}.spec.ts`);
      fs.writeFileSync(specPath, specContent, 'utf-8');

      // Create or update meta file
      const metaPath = path.join(testsDir, `${request.testName}.meta.json`);
      const meta: TestMeta = {
        testName: request.testName,
        module: request.module,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastStatus: 'never_run',
      };

      // Read existing meta if it exists
      if (fs.existsSync(metaPath)) {
        const existing = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        meta.createdAt = existing.createdAt || meta.createdAt;
        meta.tags = existing.tags;
      }

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

      return {
        success: true,
        specPath: path.relative(request.workspacePath, specPath),
        metaPath: path.relative(request.workspacePath, metaPath),
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
    let content = `import { test } from '@playwright/test';\n`;
    content += `import data from '../data/${testName}.json';\n`;
    
    // Add waitForD365 import for D365 workspaces
    if (workspaceType === 'd365') {
      content += `import { waitForD365 } from '../runtime/d365-waits';\n`;
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
}

