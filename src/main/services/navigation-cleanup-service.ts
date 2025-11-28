import { Project, SourceFile, Node, SyntaxKind, CallExpression, StringLiteral, ExpressionStatement, AwaitExpression } from 'ts-morph';

/**
 * Service for cleaning up navigation steps in recorder output
 * Removes login URLs, collapses duplicate gotos, and removes redundant navigations
 */
export class NavigationCleanupService {
  /**
   * Clean up navigation steps in raw recorder code
   */
  async cleanup(rawCode: string): Promise<string> {
    try {
      console.log('[NavCleanup] Starting navigation cleanup, original code length:', rawCode.length);
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', rawCode, { overwrite: true });

      // Step 1: Remove login URLs
      this.removeLoginUrls(sourceFile);

      // Step 2: Collapse consecutive duplicate gotos (keep last one)
      this.collapseConsecutiveDuplicates(sourceFile);

      // Step 3: Remove redundant gotos immediately after actions when URL didn't change
      this.removeRedundantGotosAfterActions(sourceFile);

      // Return cleaned code
      const cleanedCode = sourceFile.getFullText();
      console.log('[NavCleanup] Navigation cleanup complete, cleaned code length:', cleanedCode.length);
      console.log('[NavCleanup] Removed', rawCode.length - cleanedCode.length, 'characters');
      return cleanedCode;
    } catch (error: any) {
      console.error('[NavCleanup] Error cleaning navigation:', error);
      // Return original code if cleanup fails
      return rawCode;
    }
  }

  /**
   * Remove all login.microsoftonline.com URLs
   */
  private removeLoginUrls(sourceFile: SourceFile): void {
    const nodesToRemove: ExpressionStatement[] = [];
    let statementCount = 0;
    let gotoCount = 0;
    let awaitCount = 0;
    
    // First, let's see what we're actually finding
    const allNodes: any[] = [];
    sourceFile.forEachDescendant((node) => {
      allNodes.push({
        kind: node.getKindName(),
        text: node.getText().substring(0, 150),
      });
      
      if (Node.isExpressionStatement(node)) {
        statementCount++;
        const statementText = node.getText();
        
        // Check if it looks like a page.goto call
        if (statementText.includes('page.goto') || statementText.includes('await')) {
          awaitCount++;
          const preview = statementText.substring(0, 150);
          console.log('[NavCleanup] Checking statement:', preview);
        }
        
        const gotoCall = this.findPageGotoCall(node);
        if (gotoCall) {
          gotoCount++;
          const url = this.extractUrl(gotoCall);
          if (url) {
            const urlPreview = url.length > 100 ? url.substring(0, 100) + '...' : url;
            console.log('[NavCleanup] Found goto URL:', urlPreview);
            if (url.includes('login.microsoftonline.com')) {
              console.log('[NavCleanup] Removing login URL:', urlPreview);
              nodesToRemove.push(node);
            }
          } else {
            const callText = gotoCall.getText();
            const callPreview = callText.length > 100 ? callText.substring(0, 100) + '...' : callText;
            console.log('[NavCleanup] Found goto call but could not extract URL from:', callPreview);
          }
        }
      }
    });

    console.log('[NavCleanup] Total nodes in source file:', allNodes.length);
    console.log('[NavCleanup] Scanned', statementCount, 'ExpressionStatements, found', awaitCount, 'await statements,', gotoCount, 'goto calls, removing', nodesToRemove.length, 'login URLs');
    
    // Remove in reverse order to avoid position shifts
    for (const node of nodesToRemove.reverse()) {
      node.remove();
    }
  }

  /**
   * Find page.goto() call in a statement
   */
  private findPageGotoCall(statement: Node): CallExpression | null {
    // Check if statement is an ExpressionStatement containing an await expression
    if (!Node.isExpressionStatement(statement)) {
      return null;
    }

    const expression = statement.getExpression();
    if (!Node.isAwaitExpression(expression)) {
      return null;
    }

    const callExpr = expression.getExpression();
    if (!Node.isCallExpression(callExpr)) {
      return null;
    }

    const methodCall = callExpr.getExpression();
    if (!Node.isPropertyAccessExpression(methodCall)) {
      return null;
    }

    // Check if method name is 'goto'
    if (methodCall.getName() !== 'goto') {
      return null;
    }

    // Check if parent is page
    const parent = methodCall.getExpression();
    if (Node.isPropertyAccessExpression(parent)) {
      if (parent.getName() === 'page') {
        return callExpr;
      }
    } else if (Node.isIdentifier(parent)) {
      // Could be just 'page' identifier
      if (parent.getText() === 'page') {
        return callExpr;
      }
    }

    return null;
  }

  /**
   * Extract URL string from page.goto() call
   */
  private extractUrl(callExpr: CallExpression): string | null {
    const args = callExpr.getArguments();
    if (args.length >= 1 && Node.isStringLiteral(args[0])) {
      return args[0].getText().slice(1, -1); // Remove quotes
    }
    return null;
  }

  /**
   * Extract menu item (mi) parameter from D365 URL
   */
  private extractMenuItem(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('mi') || null;
    } catch {
      // Invalid URL, return null
      return null;
    }
  }

  /**
   * Collapse consecutive duplicate gotos to the same URL (keep last one)
   */
  private collapseConsecutiveDuplicates(sourceFile: SourceFile): void {
    // Get all statements in order with their positions
    interface StatementInfo {
      statement: ExpressionStatement;
      url: string | null;
      position: number;
    }

    const statements: StatementInfo[] = [];
    let position = 0;
    
    sourceFile.forEachDescendant((node) => {
      if (Node.isExpressionStatement(node)) {
        const gotoCall = this.findPageGotoCall(node);
        const url = gotoCall ? this.extractUrl(gotoCall) : null;
        statements.push({ statement: node, url, position: position++ });
      }
    });

    // Find consecutive duplicates and mark for removal (keep last one)
    const nodesToRemove: ExpressionStatement[] = [];
    
    for (let i = 0; i < statements.length - 1; i++) {
      const current = statements[i];
      if (!current.url) continue; // Not a goto, skip

      // Check if next statements are also gotos to the same URL
      const duplicates: StatementInfo[] = [current];
      for (let j = i + 1; j < statements.length; j++) {
        const next = statements[j];
        if (next.url === current.url) {
          duplicates.push(next);
        } else {
          // Different URL or not a goto, stop checking
          break;
        }
      }

      // If we have duplicates, remove all but the last one
      if (duplicates.length > 1) {
        for (let k = 0; k < duplicates.length - 1; k++) {
          nodesToRemove.push(duplicates[k].statement);
        }
      }
    }

    // Remove in reverse order to avoid position shifts
    for (const node of nodesToRemove.reverse()) {
      node.remove();
    }
  }

  /**
   * Remove redundant gotos immediately after actions when URL didn't change
   */
  private removeRedundantGotosAfterActions(sourceFile: SourceFile): void {
    // Get all statements in order
    const statements: ExpressionStatement[] = [];
    sourceFile.forEachDescendant((node) => {
      if (Node.isExpressionStatement(node)) {
        statements.push(node);
      }
    });

    // Track the last meaningful goto URL
    let lastGotoUrl: string | null = null;
    const nodesToRemove: ExpressionStatement[] = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const gotoCall = this.findPageGotoCall(statement);
      
      if (gotoCall) {
        const url = this.extractUrl(gotoCall);
        if (url && !url.includes('login.microsoftonline.com')) {
          // Check if previous statement was an action (click, fill, select, etc.)
          if (i > 0 && lastGotoUrl) {
            const prevStatement = statements[i - 1];
            const prevGoto = this.findPageGotoCall(prevStatement);
            
            // If previous was NOT a goto (it's an action), check if this goto is redundant
            if (!prevGoto) {
              // Check if URL is the same as last goto (same mi parameter for D365)
              const currentMi = this.extractMenuItem(url);
              const lastMi = this.extractMenuItem(lastGotoUrl);
              
              // If same menu item, mark for removal
              if (currentMi && lastMi && currentMi === lastMi) {
                nodesToRemove.push(statement);
                continue; // Skip updating lastGotoUrl
              }
              
              // Also check exact URL match
              if (url === lastGotoUrl) {
                nodesToRemove.push(statement);
                continue;
              }
            }
          }
          
          // Update last goto URL
          lastGotoUrl = url;
        }
      }
      // If it's an action (not a goto), keep lastGotoUrl for comparison
      // Don't reset it - we want to compare against the last meaningful navigation
    }

    // Remove redundant nodes in reverse order
    for (const node of nodesToRemove.reverse()) {
      node.remove();
    }
  }
}
