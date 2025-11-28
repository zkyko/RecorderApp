import { Project, SourceFile, Node, SyntaxKind, CallExpression, StringLiteral } from 'ts-morph';
import { LocatorCleanupRequest, LocatorCleanupResponse, LocatorMapping } from '../../types/v1.5';
import { NavigationCleanupService } from './navigation-cleanup-service';

/**
 * Service for cleaning up and upgrading locators in codegen output
 * Uses ts-morph to parse and transform TypeScript code
 */
export class LocatorCleanupService {
  private navigationCleanupService: NavigationCleanupService;

  constructor() {
    this.navigationCleanupService = new NavigationCleanupService();
  }

  /**
   * Clean up locators in raw codegen output
   * Also applies navigation cleanup first (removes login URLs, collapses duplicate gotos)
   */
  async cleanup(request: LocatorCleanupRequest): Promise<LocatorCleanupResponse> {
    try {
      // Step 1: Apply navigation cleanup first (remove login URLs, collapse duplicates)
      const originalCodeLength = request.rawCode.length;
      console.log('[LocatorCleanup] Before navigation cleanup, code length:', originalCodeLength);
      
      let code = await this.navigationCleanupService.cleanup(request.rawCode);
      
      const afterNavCleanupLength = code.length;
      console.log('[LocatorCleanup] After navigation cleanup, code length:', afterNavCleanupLength);
      console.log('[LocatorCleanup] Navigation cleanup removed:', originalCodeLength - afterNavCleanupLength, 'characters');

      // Step 2: Apply locator cleanup and upgrades
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', code, { overwrite: true });

      // Remove test.use() calls (storage state is configured in playwright.config.ts)
      const statementsToRemove: any[] = [];
      sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
          const expr = node.getExpression().getText();
          if (expr === 'test.use' || expr.includes('test.use')) {
            // Find the parent statement and mark it for removal
            let parent = node.getParent();
            while (parent && !Node.isStatement(parent)) {
              parent = parent.getParent();
            }
            if (parent && Node.isStatement(parent)) {
              statementsToRemove.push(parent);
            }
          }
        }
      });
      // Remove statements
      statementsToRemove.forEach(stmt => {
        if (Node.isStatement(stmt)) {
          stmt.remove();
        }
      });

      const mappings: LocatorMapping[] = [];
      
      // Walk AST to find locator calls
      sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
          this.processLocatorCall(node, mappings);
        }
      });

      // Get cleaned code
      const cleanedCode = sourceFile.getFullText();

      return {
        success: true,
        cleanedCode,
        mapping: mappings,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to clean up locators',
      };
    }
  }

  /**
   * Process a locator call expression and upgrade if needed
   */
  private processLocatorCall(node: CallExpression, mappings: LocatorMapping[]): void {
    const expression = node.getExpression();
    const expressionText = expression.getText();

    // Check if this is a locator call (page.locator, page.getByText, etc.)
    if (!expressionText.includes('locator') && 
        !expressionText.includes('getByText') &&
        !expressionText.includes('getByRole') &&
        !expressionText.includes('getByLabel') &&
        !expressionText.includes('getByPlaceholder')) {
      return;
    }

    // Get arguments
    const args = node.getArguments();
    if (args.length === 0) return;

    const firstArg = args[0];
    
    // Only process string literals
    if (!Node.isStringLiteral(firstArg)) {
      return;
    }

    const originalSelector = firstArg.getText().slice(1, -1); // Remove quotes
    const upgraded = this.upgradeLocator(originalSelector, expressionText);

    if (upgraded && upgraded !== originalSelector) {
      // Replace the string literal
      firstArg.replaceWithText(`'${upgraded}'`);
      
      mappings.push({
        original: originalSelector,
        upgraded: upgraded,
      });
    }
  }

  /**
   * Upgrade a locator string based on D365 priority rules
   * This is a simplified version - in a full implementation, we might need
   * to launch a browser and inspect elements to get the best locator
   */
  private upgradeLocator(selector: string, method: string): string | null {
    // If already using a good method, don't change
    if (method.includes('getByRole') || 
        method.includes('getByLabel') || 
        method.includes('getByPlaceholder') ||
        method.includes('getByText')) {
      return null; // Already good
    }

    // Check if selector is fragile (CSS with nth-child, complex selectors)
    const isFragile = selector.includes(':nth-child') || 
                      selector.includes(':nth-of-type') ||
                      selector.split(' ').length > 3; // Deep nesting

    if (!isFragile) {
      return null; // Not fragile, keep as is
    }

    // For now, we can't upgrade without a live page
    // In a full implementation, we would:
    // 1. Launch a browser
    // 2. Navigate to the page
    // 3. Find the element using the original selector
    // 4. Use LocatorExtractor to get the best locator
    // 5. Replace in code

    // For v1.5, we'll keep fragile selectors but flag them
    // The user can manually improve them later
    return selector;
  }
}

