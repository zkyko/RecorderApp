/**
 * Custom error types for mock backend
 */

export class DesktopOnlyError extends Error {
  constructor(message: string = 'This action is available only in the Desktop App. Download QA Studio to run real tests.') {
    super(message);
    this.name = 'DesktopOnlyError';
  }
}

export function isDesktopOnlyError(error: unknown): error is DesktopOnlyError {
  return error instanceof DesktopOnlyError;
}

