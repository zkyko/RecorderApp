import { Project, SourceFile, Node, SyntaxKind, CallExpression, PropertyAccessExpression, StringLiteral, ObjectLiteralExpression, PropertyAssignment, ExpressionStatement, AwaitExpression } from 'ts-morph';
import { WorkspaceType } from '../../types/v1.5';

/**
 * Service for injecting waitForD365 calls after heavy D365 actions
 */
export class D365WaitInjector {
  /**
   * Inject waitForD365 calls after heavy actions in the AST
   * Only applies to D365 workspaces
   */
  injectWaits(sourceFile: SourceFile, workspaceType: WorkspaceType): void {
    if (workspaceType !== 'd365') {
      return; // Only inject for D365 workspaces
    }

    // Collect positions where we need to inject waits (not the nodes themselves)
    // This prevents nodes from becoming invalid when we modify the AST
    interface WaitInjection {
      position: number;
      indent: string;
    }

    const injections: WaitInjection[] = [];

    // Find all call expressions and collect injection points
    sourceFile.forEachDescendant((node) => {
      if (Node.isCallExpression(node)) {
        if (this.isHeavyAction(node)) {
          const injection = this.getInjectionPoint(node);
          if (injection) {
            injections.push(injection);
          }
        }
      }
    });

    // Insert waits in reverse order (from bottom to top)
    // This ensures earlier insertions don't affect later positions
    injections.sort((a, b) => b.position - a.position);
    
    for (const injection of injections) {
      sourceFile.insertText(injection.position, `\n${injection.indent}await waitForD365(page);`);
    }
  }

  /**
   * Check if a call expression is a "heavy" D365 action that needs waiting
   */
  private isHeavyAction(callExpr: CallExpression): boolean {
    const expression = callExpr.getExpression();
    
    // Check if it's a method call on a locator (e.g., .click(), .press())
    if (!Node.isPropertyAccessExpression(expression)) {
      return false;
    }

    const methodName = expression.getName();
    
    // We're looking for .click() or .press() calls
    if (methodName !== 'click' && methodName !== 'press') {
      return false;
    }

    // Get the parent expression (the locator chain)
    const parentExpr = expression.getExpression();
    const parentText = parentExpr.getText();
    
    // Check for data-dyn-controlname locators first (D365-specific, priority)
    if (parentText.includes('page.locator') && parentText.includes('data-dyn-controlname')) {
      // Extract the controlname value using AST parsing
      const locatorCall = this.findLocatorCall(parentExpr);
      if (locatorCall && Node.isCallExpression(locatorCall)) {
        const args = locatorCall.getArguments();
        if (args.length >= 1 && Node.isStringLiteral(args[0])) {
          const selector = args[0].getText().slice(1, -1); // Remove quotes
          const controlNameMatch = selector.match(/data-dyn-controlname=["']([^"']+)["']/);
          if (controlNameMatch) {
            const controlName = controlNameMatch[1];
            // Check for heavy D365 actions: New, OK, Delete, Yes buttons
            const heavyControls = ['SystemDefinedNewButton', 'OK', 'SystemDefinedDeleteButton', 'Yes', 'No', 'Save'];
            return heavyControls.some(control => 
              controlName.toLowerCase() === control.toLowerCase() ||
              controlName.toLowerCase().includes(control.toLowerCase()) ||
              control.toLowerCase().includes(controlName.toLowerCase())
            );
          }
        }
      }
    }

    // Check if it's a page.getByRole(...) call
    if (parentText.includes('page.getByRole')) {
      // Check the role and name arguments
      const roleCall = this.findGetByRoleCall(parentExpr);
      if (roleCall) {
        const args = roleCall.getArguments();
        if (args.length >= 1) {
          const roleArg = args[0];
          if (Node.isStringLiteral(roleArg)) {
            const role = roleArg.getText().slice(1, -1); // Remove quotes
            
            // Check for heavy button actions
            if (role === 'button' && args.length >= 2) {
              const nameArg = args[1];
              if (Node.isObjectLiteralExpression(nameArg)) {
                const nameProp = nameArg.getProperty('name');
                if (nameProp && Node.isPropertyAssignment(nameProp)) {
                  const nameValue = nameProp.getInitializer();
                  if (Node.isStringLiteral(nameValue)) {
                    const name = nameValue.getText().slice(1, -1); // Remove quotes
                    const heavyButtons = ['OK', 'Save', 'New', 'Delete', 'Yes', 'No'];
                    // Check if name matches (case-insensitive, handle Unicode characters)
                    const normalizedName = name.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                    return heavyButtons.some(btn => 
                      normalizedName.toLowerCase() === btn.toLowerCase() ||
                      normalizedName.endsWith(btn)
                    );
                  }
                }
              }
            }
            
            // Check for tree navigation
            if (role === 'treeitem') {
              return true;
            }
          }
        }
      }
    }

    // Check for .press('Enter') on combobox (both getByRole and any combobox locator)
    if (methodName === 'press') {
      const args = callExpr.getArguments();
      if (args.length >= 1 && Node.isStringLiteral(args[0])) {
        const key = args[0].getText().slice(1, -1);
        if (key === 'Enter') {
          // Check for getByRole combobox
          if (parentText.includes('getByRole')) {
            const roleCall = this.findGetByRoleCall(parentExpr);
            if (roleCall) {
              const roleArgs = roleCall.getArguments();
              if (roleArgs.length >= 1 && Node.isStringLiteral(roleArgs[0])) {
                const role = roleArgs[0].getText().slice(1, -1);
                if (role === 'combobox') {
                  return true;
                }
              }
            }
          }
          // Also check if parent text mentions combobox (for data-dyn-controlname or other locators)
          if (parentText.includes('combobox')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Find the getByRole call in an expression chain
   */
  private findGetByRoleCall(expr: Node): CallExpression | null {
    if (Node.isCallExpression(expr)) {
      const expression = expr.getExpression();
      if (Node.isPropertyAccessExpression(expression)) {
        if (expression.getName() === 'getByRole') {
          return expr;
        }
      }
    }
    
    // Check parent if it's a property access
    if (Node.isPropertyAccessExpression(expr)) {
      const parent = expr.getExpression();
      return this.findGetByRoleCall(parent);
    }

    return null;
  }

  /**
   * Find the page.locator() call in an expression chain
   */
  private findLocatorCall(expr: Node): CallExpression | null {
    if (Node.isCallExpression(expr)) {
      const expression = expr.getExpression();
      if (Node.isPropertyAccessExpression(expression)) {
        if (expression.getName() === 'locator') {
          return expr;
        }
      }
    }
    
    // Check parent if it's a property access
    if (Node.isPropertyAccessExpression(expr)) {
      const parent = expr.getExpression();
      return this.findLocatorCall(parent);
    }

    return null;
  }

  /**
   * Get the injection point (position and indent) for a heavy action
   * Returns null if waitForD365 is already present or injection point can't be determined
   */
  private getInjectionPoint(callExpr: CallExpression): { position: number; indent: string } | null {
    // Check if waitForD365 is already present immediately after
    const parent = callExpr.getParent();
    if (!parent) return null;

    // Find the statement containing this call
    let statement: Node | null = null;
    let currentNode: Node | null = parent;
    
    while (currentNode) {
      if (Node.isExpressionStatement(currentNode) || 
          Node.isAwaitExpression(currentNode) ||
          Node.isVariableStatement(currentNode)) {
        statement = currentNode;
        break;
      }
      const parentNode = currentNode.getParent();
      currentNode = parentNode !== undefined ? parentNode : null;
    }

    if (!statement) return null;

    // Check the next sibling statement
    const nextSibling = statement.getNextSibling();
    if (nextSibling !== undefined) {
      const nextText = nextSibling.getText();
      // If waitForD365 is already there, skip
      if (nextText.includes('waitForD365')) {
        return null;
      }
    }

    // Get the end position of the statement
    const endPos = statement.getEnd();
    
    // Get the indentation from the current statement
    const statementText = statement.getText();
    const lines = statementText.split('\n');
    const firstLine = lines[0];
    const indentMatch = firstLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '      '; // Default to 6 spaces for test body
    
    return { position: endPos, indent };
  }
}

