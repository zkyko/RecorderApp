import { Project, SourceFile, Node, CallExpression, StringLiteral } from 'ts-morph';
import { ParamDetectRequest, ParamDetectResponse, ParamCandidate } from '../../types/v1.5';
import { randomUUID } from 'crypto';

/**
 * Service for detecting parameterizable input values in cleaned code
 */
export class ParameterDetector {
  /**
   * Detect parameter candidates from cleaned code
   */
  async detect(request: ParamDetectRequest): Promise<ParamDetectResponse> {
    try {
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', request.cleanedCode, { overwrite: true });

      const candidates: ParamCandidate[] = [];
      
      // Walk AST to find fill/select calls
      sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
          this.processInputCall(node, candidates);
        }
      });

      return {
        success: true,
        candidates,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to detect parameters',
      };
    }
  }

  /**
   * Process a call expression that might contain parameterizable values
   */
  private processInputCall(node: CallExpression, candidates: ParamCandidate[]): void {
    const expression = node.getExpression();
    const expressionText = expression.getText();

    // Check if this is a fill or selectOption call
    const isFill = expressionText.includes('.fill(');
    const isSelect = expressionText.includes('.selectOption(');

    if (!isFill && !isSelect) {
      return;
    }

    // Get arguments
    const args = node.getArguments();
    if (args.length === 0) return;

    const valueArg = args[args.length - 1]; // Last argument is usually the value
    
    // Only process string literals (handles both single and double quotes)
    if (!Node.isStringLiteral(valueArg)) {
      return;
    }

    // Remove quotes - works for both 'value' and "value"
    const originalValue = valueArg.getText().slice(1, -1);

    // Try to derive label from context
    // Look for nearby getByLabel or getByRole calls (including chained calls)
    const label = this.extractLabelFromContext(node);
    const suggestedName = this.generateVariableName(label, originalValue);

    candidates.push({
      id: randomUUID(),
      label: label || 'Field',
      originalValue,
      suggestedName,
    });
  }

  /**
   * Extract label from context (nearby getByLabel/getByRole calls)
   * Handles both direct calls and chained calls like page.getByRole('combobox', { name: '...' }).fill('...')
   */
  private extractLabelFromContext(node: CallExpression): string {
    // Look at parent chain for locator calls
    // For chained calls like page.getByRole(...).fill(...), the fill node's parent is the getByRole call
    let parent = node.getParent();
    let depth = 0;
    const maxDepth = 10; // Increased depth to handle chained calls

    while (parent && depth < maxDepth) {
      if (Node.isCallExpression(parent)) {
        const expr = parent.getExpression().getText();
        
        // Check for getByLabel
        if (expr.includes('getByLabel')) {
          const args = parent.getArguments();
          if (args.length > 0 && Node.isStringLiteral(args[0])) {
            // Handle both single and double quotes
            const text = args[0].getText();
            return text.slice(1, -1); // Remove quotes
          }
        }
        
        // Check for getByRole with name (handles getByRole('combobox', { name: 'Customer account' }))
        if (expr.includes('getByRole')) {
          const args = parent.getArguments();
          if (args.length > 1) {
            // Second arg might be { name: "..." } or { name: '...' }
            const secondArg = args[1];
            if (Node.isObjectLiteralExpression(secondArg)) {
              const nameProp = secondArg.getProperty('name');
              if (nameProp && Node.isPropertyAssignment(nameProp)) {
                const initializer = nameProp.getInitializer();
                if (initializer && Node.isStringLiteral(initializer)) {
                  // Handle both single and double quotes
                  const text = initializer.getText();
                  return text.slice(1, -1); // Remove quotes
                }
              }
            }
          }
        }
        
        // Also check for getByPlaceholder
        if (expr.includes('getByPlaceholder')) {
          const args = parent.getArguments();
          if (args.length > 0 && Node.isStringLiteral(args[0])) {
            const text = args[0].getText();
            return text.slice(1, -1);
          }
        }
      }
      
      parent = parent.getParent();
      depth++;
    }

    return '';
  }

  /**
   * Generate a camelCase variable name from label or value
   */
  private generateVariableName(label: string, value: string): string {
    // Use label if available, otherwise use value
    const source = label || value;
    
    // Convert to camelCase
    return source
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 50); // Limit length
  }
}

