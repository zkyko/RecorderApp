import { Project, SourceFile, Node, CallExpression, StringLiteral, PropertyAccessExpression } from 'ts-morph';
import { RecordedStep, LocatorDefinition } from '../../types';

/**
 * Service for parsing Playwright codegen output into RecordedStep[] format
 * This allows codegen to use the same Step Editor workflow as QA Studio Recorder
 */
export class CodegenParser {
  /**
   * Parse Playwright codegen output into RecordedStep[] format
   */
  parseCodegenToSteps(rawCode: string): RecordedStep[] {
    try {
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', rawCode, { overwrite: true });

      const steps: RecordedStep[] = [];
      let stepOrder = 1;

      // Find the test function body
      // First, try to find test() calls
      sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
          const expr = node.getExpression().getText();
          
          // Check if this is a test() call
          if (expr === 'test' || expr.includes('test(')) {
            // Process the test body
            const args = node.getArguments();
            if (args.length >= 2) {
              const testBody = args[1];
              if (Node.isArrowFunction(testBody) || Node.isFunctionExpression(testBody)) {
                const body = testBody.getBody();
                if (Node.isBlock(body)) {
                  stepOrder = this.processStatements(body.getStatements(), steps, stepOrder);
                } else if (Node.isExpression(body)) {
                  // Single expression (no braces)
                  const step = this.processAwaitExpression(body, stepOrder);
                  if (step) {
                    steps.push(step);
                    stepOrder++;
                  }
                }
              }
            }
          }
        }
      });

      // If no test() found, try to process top-level statements
      // This handles codegen output that might not have test() wrapper
      if (steps.length === 0) {
        const statements = sourceFile.getStatements();
        this.processStatements(statements, steps, stepOrder);
      }

      return steps;
    } catch (error: any) {
      console.error('[CodegenParser] Error parsing codegen:', error);
      return [];
    }
  }

  /**
   * Process statements and extract steps
   */
  private processStatements(statements: Node[], steps: RecordedStep[], startOrder: number): number {
    let order = startOrder;

    for (const stmt of statements) {
      // Look for await statements
      if (Node.isExpressionStatement(stmt)) {
        const expr = stmt.getExpression();
        if (Node.isAwaitExpression(expr)) {
          const step = this.processAwaitExpression(expr, order);
          if (step) {
            steps.push(step);
            order++;
          }
        }
      }
    }

    return order;
  }

  /**
   * Process an await expression and extract step information
   */
  private processAwaitExpression(awaitExpr: Node, order: number): RecordedStep | null {
    // Handle both await expressions and direct call expressions
    let callExpr: CallExpression | null = null;
    
    if (Node.isAwaitExpression(awaitExpr)) {
      const expr = awaitExpr.getExpression();
      if (Node.isCallExpression(expr)) {
        callExpr = expr;
      } else {
        return null;
      }
    } else if (Node.isCallExpression(awaitExpr)) {
      callExpr = awaitExpr;
    } else {
      return null;
    }

    if (!callExpr) return null;

    const expression = callExpr.getExpression();
    const expressionText = expression.getText();

    // Check for page.goto() - navigation
    if (expressionText.includes('goto')) {
      const args = callExpr.getArguments();
      if (args.length > 0 && Node.isStringLiteral(args[0])) {
        const url = args[0].getText().slice(1, -1); // Remove quotes
        return {
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order,
          action: 'navigate',
          pageUrl: url,
          description: `Navigate to ${url}`,
          timestamp: new Date(),
          pageId: 'UnknownPage',
          locator: { strategy: 'css', selector: 'body' },
        };
      }
    }

    // Check for .click() - click action
    // For chained calls, check both the expression text and if it's a property access
    const isClick = expressionText.includes('.click') || 
                    this.isMethodCall(expression, 'click') ||
                    (Node.isPropertyAccessExpression(expression) && expression.getName() === 'click');
    
    if (isClick) {
      const locator = this.extractLocator(callExpr);
      if (locator) {
        return {
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order,
          action: 'click',
          locator,
          description: this.generateDescription('click', locator),
          timestamp: new Date(),
          pageId: 'UnknownPage',
        };
      }
    }

    // Check for .fill() - fill action
    const isFill = expressionText.includes('.fill') || 
                   this.isMethodCall(expression, 'fill') ||
                   (Node.isPropertyAccessExpression(expression) && expression.getName() === 'fill');
    
    if (isFill) {
      const locator = this.extractLocator(callExpr);
      const args = callExpr.getArguments();
      let value = '';
      
      if (args.length > 0 && Node.isStringLiteral(args[0])) {
        value = args[0].getText().slice(1, -1); // Remove quotes
      }

      if (locator) {
        return {
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order,
          action: 'fill',
          locator,
          value,
          description: this.generateDescription('fill', locator, value),
          timestamp: new Date(),
          pageId: 'UnknownPage',
        };
      }
    }

    // Check for .selectOption() - select action
    const isSelect = expressionText.includes('.selectOption') || 
                     this.isMethodCall(expression, 'selectOption') ||
                     (Node.isPropertyAccessExpression(expression) && expression.getName() === 'selectOption');
    
    if (isSelect) {
      const locator = this.extractLocator(callExpr);
      const args = callExpr.getArguments();
      let value = '';
      
      if (args.length > 0 && Node.isStringLiteral(args[0])) {
        value = args[0].getText().slice(1, -1); // Remove quotes
      }

      if (locator) {
        return {
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order,
          action: 'select',
          locator,
          value,
          description: this.generateDescription('select', locator, value),
          timestamp: new Date(),
          pageId: 'UnknownPage',
        };
      }
    }

    // Check for .press() - key press (usually after fill)
    const isPress = expressionText.includes('.press') || 
                    this.isMethodCall(expression, 'press') ||
                    (Node.isPropertyAccessExpression(expression) && expression.getName() === 'press');
    
    if (isPress) {
      const locator = this.extractLocator(callExpr);
      const args = callExpr.getArguments();
      let key = '';
      
      if (args.length > 0 && Node.isStringLiteral(args[0])) {
        key = args[0].getText().slice(1, -1);
      }

      if (locator && key) {
        return {
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order,
          action: 'wait', // Keypress is treated as wait
          locator,
          value: key,
          description: `Press '${key}' on ${this.locatorToText(locator)}`,
          timestamp: new Date(),
          pageId: 'UnknownPage',
        };
      }
    }

    return null;
  }

  /**
   * Check if expression is a method call with specific name
   */
  private isMethodCall(expression: Node, methodName: string): boolean {
    if (Node.isPropertyAccessExpression(expression)) {
      return expression.getName() === methodName;
    }
    return false;
  }

  /**
   * Extract locator from a call expression
   * Handles chained calls like page.getByRole(...).fill(...)
   */
  private extractLocator(callExpr: CallExpression): LocatorDefinition | null {
    const expression = callExpr.getExpression();
    const locatorCall = this.findLocatorCall(expression);

    if (!locatorCall) {
      return null;
    }

    const locatorExpr = locatorCall.getExpression();
    if (!Node.isPropertyAccessExpression(locatorExpr)) {
      return null;
    }

    const methodName = locatorExpr.getName();
    switch (methodName) {
      case 'getByRole':
        return this.extractRoleLocator(locatorCall);
      case 'getByLabel':
        return this.extractLabelLocator(locatorCall);
      case 'getByText':
        return this.extractTextLocator(locatorCall);
      case 'getByPlaceholder':
        return this.extractPlaceholderLocator(locatorCall);
      case 'locator':
        return this.extractCssLocator(locatorCall);
      default:
        return null;
    }
  }

  /**
   * Find the locator call (getByRole/getByLabel/etc.) in a chained expression
   */
  private findLocatorCall(node: Node | undefined, depth: number = 0): CallExpression | null {
    if (!node || depth > 10) {
      return null;
    }

    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        const methodName = expr.getName();
        if (['getByRole', 'getByLabel', 'getByText', 'getByPlaceholder', 'locator'].includes(methodName)) {
          return node;
        }
        // Continue searching up the chain (e.g., frameLocator().getByRole())
        return this.findLocatorCall(expr.getExpression(), depth + 1);
      }
    }

    if (Node.isPropertyAccessExpression(node)) {
      return this.findLocatorCall(node.getExpression(), depth + 1);
    }

    return null;
  }

  /**
   * Extract role locator from getByRole call
   */
  private extractRoleLocator(callExpr: CallExpression): LocatorDefinition | null {
    const args = callExpr.getArguments();
    if (args.length === 0) return null;

    const roleArg = args[0];
    if (!Node.isStringLiteral(roleArg)) return null;
    
    const role = roleArg.getText().slice(1, -1);
    let name = '';

    // Check for second argument with name
    if (args.length > 1) {
      const secondArg = args[1];
      if (Node.isObjectLiteralExpression(secondArg)) {
        const nameProp = secondArg.getProperty('name');
        if (nameProp && Node.isPropertyAssignment(nameProp)) {
          const initializer = nameProp.getInitializer();
          if (initializer && Node.isStringLiteral(initializer)) {
            name = initializer.getText().slice(1, -1);
          }
        }
      }
    }

    return {
      strategy: 'role',
      role,
      name,
    };
  }

  /**
   * Extract label locator from getByLabel call
   */
  private extractLabelLocator(callExpr: CallExpression): LocatorDefinition | null {
    const args = callExpr.getArguments();
    if (args.length === 0) return null;

    const labelArg = args[0];
    if (!Node.isStringLiteral(labelArg)) return null;
    
    const text = labelArg.getText().slice(1, -1);

    return {
      strategy: 'label',
      text,
    };
  }

  /**
   * Extract text locator from getByText call
   */
  private extractTextLocator(callExpr: CallExpression): LocatorDefinition | null {
    const args = callExpr.getArguments();
    if (args.length === 0) return null;

    const textArg = args[0];
    if (!Node.isStringLiteral(textArg)) return null;
    
    const text = textArg.getText().slice(1, -1);
    let exact = false;

    // Check for exact option
    if (args.length > 1) {
      const secondArg = args[1];
      if (Node.isObjectLiteralExpression(secondArg)) {
        const exactProp = secondArg.getProperty('exact');
        if (exactProp && Node.isPropertyAssignment(exactProp)) {
          const initializer = exactProp.getInitializer();
          if (initializer) {
            const text = initializer.getText();
            exact = text === 'true';
          }
        }
      }
    }

    return {
      strategy: 'text',
      text,
      exact,
    };
  }

  /**
   * Extract placeholder locator from getByPlaceholder call
   */
  private extractPlaceholderLocator(callExpr: CallExpression): LocatorDefinition | null {
    const args = callExpr.getArguments();
    if (args.length === 0) return null;

    const placeholderArg = args[0];
    if (!Node.isStringLiteral(placeholderArg)) return null;
    
    const text = placeholderArg.getText().slice(1, -1);

    return {
      strategy: 'placeholder',
      text,
    };
  }

  /**
   * Extract CSS locator from locator call
   */
  private extractCssLocator(callExpr: CallExpression): LocatorDefinition | null {
    const args = callExpr.getArguments();
    if (args.length === 0) return null;

    const selectorArg = args[0];
    if (!Node.isStringLiteral(selectorArg)) return null;
    
    const selector = selectorArg.getText().slice(1, -1);

    // Check if it's a D365 control name
    if (selector.includes('data-dyn-controlname')) {
      const match = selector.match(/data-dyn-controlname=["']([^"']+)["']/);
      if (match) {
        return {
          strategy: 'd365-controlname',
          controlName: match[1],
        };
      }
    }

    return {
      strategy: 'css',
      selector,
    };
  }

  /**
   * Generate description from locator and action
   */
  private generateDescription(action: string, locator: LocatorDefinition, value?: string): string {
    const locatorText = this.locatorToText(locator);
    
    if (action === 'fill') {
      return `Fill '${locatorText}'${value ? ` = '${value}'` : ''}`;
    }
    if (action === 'select') {
      return `Select '${locatorText}'${value ? ` = '${value}'` : ''}`;
    }
    if (action === 'click') {
      return `Click '${locatorText}'`;
    }
    
    return `${action} '${locatorText}'`;
  }

  /**
   * Convert locator to human-readable text
   */
  private locatorToText(locator: LocatorDefinition): string {
    if (locator.strategy === 'role' && locator.name) {
      return locator.name;
    }
    if (locator.strategy === 'label' && locator.text) {
      return locator.text;
    }
    if (locator.strategy === 'text' && locator.text) {
      return locator.text;
    }
    if (locator.strategy === 'placeholder' && locator.text) {
      return locator.text;
    }
    if (locator.strategy === 'd365-controlname' && locator.controlName) {
      return locator.controlName;
    }
    if (locator.strategy === 'css' && locator.selector) {
      return locator.selector;
    }
    return 'element';
  }
}

