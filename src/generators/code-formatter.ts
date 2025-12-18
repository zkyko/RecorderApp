import * as fs from 'fs';
import * as path from 'path';
import { GeneratedFile } from '../types';

/**
 * Handles file writing and optional code formatting.
 * 
 * The CodeFormatter is responsible for:
 * - Writing generated files (specs, POMs) to disk
 * - Ensuring directory structure exists
 * - Basic code formatting (normalizing line endings)
 * - Handling file conflicts (overwrite, append, skip)
 * 
 * @remarks
 * Currently provides basic formatting. Can be enhanced with Prettier or other
 * formatters in the future.
 */
export class CodeFormatter {
  /**
   * Writes generated files to disk.
   * 
   * Creates directories as needed and writes all files in the provided array.
   * Logs each generated file path to console.
   * 
   * @param files - Array of GeneratedFile objects to write
   */
  writeFiles(files: GeneratedFile[]): void {
    for (const file of files) {
      // Ensure directory exists
      const dir = path.dirname(file.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(file.path, file.content, 'utf-8');
      console.log(`Generated: ${file.path}`);
    }
  }

  /**
   * Formats code content.
   * 
   * Currently performs basic normalization (consistent line endings).
   * Can be enhanced with Prettier or other formatters in the future.
   * 
   * @param content - The code content to format
   * @returns Formatted code content
   */
  formatCode(content: string): string {
    // Basic formatting - can be enhanced with Prettier
    // For now, just ensure consistent line endings
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Checks if a file exists and handles conflicts based on strategy.
   * 
   * @param filePath - The path to check
   * @param strategy - Conflict resolution strategy: 'overwrite', 'append', or 'skip'
   * @returns true if file can be written, false if should be skipped
   */
  handleFileConflict(filePath: string, strategy: 'overwrite' | 'append' | 'skip' = 'overwrite'): boolean {
    if (!fs.existsSync(filePath)) {
      return true; // File doesn't exist, safe to write
    }

    if (strategy === 'skip') {
      return false; // Skip existing files
    }

    if (strategy === 'append') {
      // Could implement append logic here
      return true;
    }

    // Default: overwrite
    return true;
  }
}

