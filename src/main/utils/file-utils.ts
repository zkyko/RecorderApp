/**
 * Safe file system utilities with retry logic for Windows filesystem locks
 */
import * as fs from 'fs-extra';

/**
 * Maximum number of retry attempts for EBUSY errors
 */
const MAX_RETRIES = 3;

/**
 * Delay between retries (in milliseconds)
 */
const RETRY_DELAY = 500;

/**
 * Safely remove a file or directory with retry logic for Windows filesystem locks
 * Uses fs-extra's remove() which handles recursive deletes and Windows edge cases better than fs.rmSync
 * 
 * @param targetPath Path to file or directory to remove
 * @param options Optional configuration
 * @returns Promise that resolves when deletion is complete
 * @throws Error if deletion fails after all retries
 */
export async function safeRemove(
  targetPath: string,
  options: { maxRetries?: number; retryDelay?: number } = {}
): Promise<void> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const retryDelay = options.retryDelay ?? RETRY_DELAY;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use fs-extra's remove() which is more robust than fs.rmSync
      // It handles recursive deletes, locked files, and Windows edge cases
      await fs.remove(targetPath);
      return; // Success!
    } catch (error: any) {
      lastError = error;

      // Only retry on EBUSY (resource busy/locked) errors
      if (error.code === 'EBUSY' && attempt < maxRetries) {
        console.warn(
          `[FileUtils] Folder locked (EBUSY), retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // For other errors or if we've exhausted retries, throw
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error(`Failed to remove ${targetPath} after ${maxRetries + 1} attempts`);
}

/**
 * Synchronous version of safeRemove for use in synchronous contexts
 * 
 * @param targetPath Path to file or directory to remove
 * @param options Optional configuration
 * @throws Error if deletion fails after all retries
 */
export function safeRemoveSync(
  targetPath: string,
  options: { maxRetries?: number; retryDelay?: number } = {}
): void {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const retryDelay = options.retryDelay ?? RETRY_DELAY;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use fs-extra's removeSync() which is more robust than fs.rmSync
      fs.removeSync(targetPath);
      return; // Success!
    } catch (error: any) {
      lastError = error;

      // Only retry on EBUSY (resource busy/locked) errors
      if (error.code === 'EBUSY' && attempt < maxRetries) {
        console.warn(
          `[FileUtils] Folder locked (EBUSY), retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        // Synchronous sleep using a busy-wait (not ideal, but necessary for sync context)
        const start = Date.now();
        while (Date.now() - start < retryDelay) {
          // Busy wait
        }
        continue;
      }

      // For other errors or if we've exhausted retries, throw
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error(`Failed to remove ${targetPath} after ${maxRetries + 1} attempts`);
}

