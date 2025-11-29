import * as path from 'path';
import * as fs from 'fs';
import { SpecGenerator } from '../../generators/spec-generator';

export interface StepUpdate {
  line: number; // 1-based line number
  originalContent?: string; // Original line content (for validation)
  newContent: string; // New line content
}

export interface SpecUpdateRequest {
  workspacePath: string;
  testName: string;
  updates: StepUpdate[];
}

export interface SpecUpdateResponse {
  success: boolean;
  error?: string;
  updatedLines?: number[];
}

export interface AddStepRequest {
  workspacePath: string;
  testName: string;
  afterLine?: number; // Insert after this line (0 = beginning)
  stepContent: string; // The step code to insert
}

export interface DeleteStepRequest {
  workspacePath: string;
  testName: string;
  line: number; // Line to delete (1-based)
}

export interface ReorderStepsRequest {
  workspacePath: string;
  testName: string;
  stepLines: number[]; // New order of line numbers (1-based)
}

/**
 * Service for updating existing spec files
 */
export class SpecUpdater {
  private specGenerator: SpecGenerator;

  constructor() {
    this.specGenerator = new SpecGenerator();
  }

  /**
   * Get the spec file path for a test
   */
  private getSpecPath(workspacePath: string, testName: string): string {
    const fileName = this.specGenerator.flowNameToFileName(testName);
    return path.join(workspacePath, 'tests', 'd365', 'specs', fileName, `${fileName}.spec.ts`);
  }

  /**
   * Read spec file content
   */
  private readSpec(workspacePath: string, testName: string): { content: string; lines: string[] } {
    const specPath = this.getSpecPath(workspacePath, testName);
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec file not found: ${testName}`);
    }
    const content = fs.readFileSync(specPath, 'utf-8');
    return { content, lines: content.split('\n') };
  }

  /**
   * Write spec file content
   */
  private writeSpec(workspacePath: string, testName: string, lines: string[]): void {
    const specPath = this.getSpecPath(workspacePath, testName);
    const content = lines.join('\n');
    
    // Create backup
    if (fs.existsSync(specPath)) {
      const backupPath = `${specPath}.bak`;
      fs.copyFileSync(specPath, backupPath);
    }
    
    fs.writeFileSync(specPath, content, 'utf-8');
  }

  /**
   * Update specific lines in a spec file
   */
  async updateSpec(request: SpecUpdateRequest): Promise<SpecUpdateResponse> {
    try {
      const { content, lines } = this.readSpec(request.workspacePath, request.testName);
      const updatedLines: number[] = [];

      // Apply updates (process in reverse order to maintain line numbers)
      const sortedUpdates = [...request.updates].sort((a, b) => b.line - a.line);
      
      for (const update of sortedUpdates) {
        const lineIndex = update.line - 1; // Convert to 0-based
        
        if (lineIndex < 0 || lineIndex >= lines.length) {
          return { success: false, error: `Line ${update.line} is out of range` };
        }

        // Optional: validate original content matches
        if (update.originalContent !== undefined) {
          const currentLine = lines[lineIndex].trim();
          const expectedLine = update.originalContent.trim();
          if (currentLine !== expectedLine) {
            console.warn(`Line ${update.line} content mismatch. Expected: "${expectedLine}", Got: "${currentLine}"`);
            // Continue anyway - might have been edited externally
          }
        }

        lines[lineIndex] = update.newContent;
        updatedLines.push(update.line);
      }

      this.writeSpec(request.workspacePath, request.testName, lines);
      
      return { success: true, updatedLines };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update spec' };
    }
  }

  /**
   * Add a new step to a spec file
   */
  async addStep(request: AddStepRequest): Promise<SpecUpdateResponse> {
    try {
      const { lines } = this.readSpec(request.workspacePath, request.testName);
      
      // Find insertion point
      let insertIndex: number = lines.length - 1; // Default: before last line
      
      if (request.afterLine === undefined || request.afterLine === 0) {
        // Insert at beginning of test body
        // Find the test function body opening brace
        let foundTest = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('test(') || lines[i].includes('test.describe')) {
            foundTest = true;
          }
          if (foundTest && lines[i].includes('async ({ page })')) {
            // Find the opening brace
            for (let j = i; j < lines.length; j++) {
              if (lines[j].includes('{')) {
                insertIndex = j + 1;
                break;
              }
            }
            break;
          }
        }
      } else {
        insertIndex = request.afterLine; // Insert after this line (0-based)
      }

      // Ensure proper indentation (match the line after)
      const indentMatch = lines[insertIndex]?.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '    ';
      
      // Add the step with proper indentation
      const indentedStep = indent + request.stepContent.trim();
      lines.splice(insertIndex, 0, indentedStep);
      
      this.writeSpec(request.workspacePath, request.testName, lines);
      
      return { success: true, updatedLines: [insertIndex + 1] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add step' };
    }
  }

  /**
   * Delete a step from a spec file
   */
  async deleteStep(request: DeleteStepRequest): Promise<SpecUpdateResponse> {
    try {
      const { lines } = this.readSpec(request.workspacePath, request.testName);
      const lineIndex = request.line - 1; // Convert to 0-based
      
      if (lineIndex < 0 || lineIndex >= lines.length) {
        return { success: false, error: `Line ${request.line} is out of range` };
      }

      // Don't delete if it's not a step line (safety check)
      const lineContent = lines[lineIndex].trim();
      if (!lineContent.includes('await page.') && !lineContent.includes('page.')) {
        return { success: false, error: `Line ${request.line} does not appear to be a test step` };
      }

      lines.splice(lineIndex, 1);
      this.writeSpec(request.workspacePath, request.testName, lines);
      
      return { success: true, updatedLines: [request.line] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete step' };
    }
  }

  /**
   * Reorder steps in a spec file
   */
  async reorderSteps(request: ReorderStepsRequest): Promise<SpecUpdateResponse> {
    try {
      const { lines } = this.readSpec(request.workspacePath, request.testName);
      
      // Extract step lines
      const stepLines: Array<{ line: number; content: string }> = [];
      const nonStepLines: Array<{ line: number; content: string }> = [];
      
      lines.forEach((content, index) => {
        const lineNum = index + 1;
        const trimmed = content.trim();
        if (trimmed.startsWith('await page.') || trimmed.startsWith('page.')) {
          stepLines.push({ line: lineNum, content });
        } else {
          nonStepLines.push({ line: lineNum, content });
        }
      });

      // Validate reorder request
      if (request.stepLines.length !== stepLines.length) {
        return { 
          success: false, 
          error: `Expected ${stepLines.length} step lines, got ${request.stepLines.length}` 
        };
      }

      // Create new order
      const reorderedSteps = request.stepLines.map(lineNum => {
        const step = stepLines.find(s => s.line === lineNum);
        if (!step) {
          throw new Error(`Step line ${lineNum} not found`);
        }
        return step;
      });

      // Rebuild file: keep non-step lines in place, reorder steps
      const newLines: string[] = [];
      let stepIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const trimmed = lines[i].trim();
        
        if (trimmed.startsWith('await page.') || trimmed.startsWith('page.')) {
          // Insert reordered step
          if (stepIndex < reorderedSteps.length) {
            newLines.push(reorderedSteps[stepIndex].content);
            stepIndex++;
          }
        } else {
          // Keep non-step line as-is
          newLines.push(lines[i]);
        }
      }

      this.writeSpec(request.workspacePath, request.testName, newLines);
      
      return { success: true, updatedLines: request.stepLines };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to reorder steps' };
    }
  }
}

