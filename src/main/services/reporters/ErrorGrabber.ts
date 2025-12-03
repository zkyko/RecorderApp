import * as path from 'path';
import * as fs from 'fs';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Custom Playwright Reporter that captures test failure context
 * and saves it to the test bundle directory for AI-powered debugging.
 * 
 * This reporter implements the Forensics Engine as specified in
 * docs/specs/04-rag-architecture.md
 */
export class ErrorGrabber implements Reporter {
  private workspacePath: string | null = null;

  /**
   * Called once before running tests
   */
  onBegin(): void {
    // Try to detect workspace path from process environment or cwd
    // Playwright runs from workspace root, so we can use process.cwd()
    this.workspacePath = process.cwd();
    
    // Validate that workspace path exists and has tests directory
    if (this.workspacePath) {
      const testsDir = path.join(this.workspacePath, 'tests');
      if (!fs.existsSync(testsDir)) {
        console.warn(`[ErrorGrabber] Tests directory not found at: ${testsDir}`);
        console.warn(`[ErrorGrabber] Using cwd as workspace: ${this.workspacePath}`);
      }
    }
  }

  /**
   * Called after each test completes
   * Only processes failed or timed out tests
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    console.log(`[ErrorGrabber] Test finished with status: ${result.status}`);
    
    // Only process failures and timeouts
    if (result.status !== 'failed' && result.status !== 'timedOut') {
      return;
    }

    try {
      // Extract test name from test case
      const testName = this.extractTestName(test);
      if (!testName) {
        console.warn('[ErrorGrabber] Could not extract test name from test case');
        return;
      }

      // Use test.location.file to get the exact spec file path
      // This is more reliable than constructing the path from test name
      let bundlePath: string | null = null;
      
      if (test.location?.file) {
        // Get the directory where the spec file is located
        // e.g., /Users/zk/.../tests/d365/specs/order/order.spec.ts -> /Users/zk/.../tests/d365/specs/order
        const specFile = test.location.file;
        
        // Handle both absolute and relative paths
        let absoluteSpecPath: string;
        if (path.isAbsolute(specFile)) {
          absoluteSpecPath = specFile;
        } else {
          // If relative, resolve from workspace path or cwd
          const basePath = this.workspacePath || process.cwd();
          absoluteSpecPath = path.resolve(basePath, specFile);
        }
        
        bundlePath = path.dirname(absoluteSpecPath);
        console.log(`[ErrorGrabber] Resolved bundle path from spec file: ${bundlePath}`);
      }
      
      // Fallback: construct bundle path from test name if location.file is not available
      if (!bundlePath) {
        console.warn(`[ErrorGrabber] test.location.file not available, falling back to constructed path`);
        bundlePath = this.resolveBundlePath(testName);
        if (!bundlePath) {
          console.warn(`[ErrorGrabber] Could not resolve bundle path for test: ${test.title}`);
          return;
        }
      }

      // Ensure bundle directory exists
      if (!fs.existsSync(bundlePath)) {
        console.warn(`[ErrorGrabber] Bundle directory does not exist: ${bundlePath}`);
        // Try to create it (in case test was run before bundle was created)
        try {
          fs.mkdirSync(bundlePath, { recursive: true });
          console.log(`[ErrorGrabber] Created bundle directory: ${bundlePath}`);
        } catch (error: any) {
          console.error(`[ErrorGrabber] Failed to create bundle directory: ${error.message}`);
          return;
        }
      }

      // Extract error information
      const failureData = this.extractFailureData(test, result, testName, bundlePath);

      // Save failure artifact
      const failureFilePath = path.join(bundlePath, `${testName}_failure.json`);
      console.log(`[ErrorGrabber] Attempting to write to: ${failureFilePath}`);
      
      try {
        fs.writeFileSync(failureFilePath, JSON.stringify(failureData, null, 2), 'utf-8');
        console.log(`[ErrorGrabber] Successfully wrote failure file: ${failureFilePath}`);
      } catch (writeError: any) {
        console.error(`[ErrorGrabber] FAILED to write file: ${writeError.message}`);
        console.error(`[ErrorGrabber] Error details:`, writeError);
        throw writeError;
      }
    } catch (error: any) {
      // Gracefully handle errors - don't break test execution
      console.error(`[ErrorGrabber] Error processing test failure: ${error.message}`);
      if (error.stack) {
        console.error(`[ErrorGrabber] Stack trace:`, error.stack);
      }
    }
  }

  /**
   * Extract test name from test case
   * Test title format: "Create Sales Order - Data Driven > test-1"
   * We need to extract the base test name (kebab-case filename)
   * 
   * Bundle structure: tests/d365/specs/<TestName>/<TestName>.spec.ts
   */
  private extractTestName(test: TestCase): string | null {
    // Primary method: extract from file path
    // Test location file is like: "tests/d365/specs/create-sales-order/create-sales-order.spec.ts"
    if (test.location?.file) {
      const filePath = test.location.file;
      
      // Extract test name from bundle path: tests/d365/specs/<TestName>/<TestName>.spec.ts
      const bundleMatch = filePath.match(/tests\/d365\/specs\/([^\/]+)\/[^\/]+\.spec\.ts$/);
      if (bundleMatch) {
        return bundleMatch[1]; // Already in kebab-case
      }
      
      // Fallback: extract from filename
      const fileName = path.basename(test.location.file, '.spec.ts');
      if (fileName) {
        return fileName;
      }
    }

    // Secondary method: extract from test title
    // Test titles are like: "Create Sales Order - Data Driven > test-1"
    // We want the first part before " - " or " > "
    const title = test.title;
    const match = title.match(/^([^-]+?)(?:\s*-\s*|>)/);
    if (match) {
      const baseName = match[1].trim();
      // Convert to kebab-case (same as flowNameToFileName)
      return baseName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Last resort: use sanitized title
    const sanitized = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    // Limit length to avoid overly long names
    const parts = sanitized.split('-');
    return parts.slice(0, 5).join('-');
  }

  /**
   * Resolve bundle path from test name
   * Bundle structure: tests/d365/specs/<TestName>/
   */
  private resolveBundlePath(testName: string): string | null {
    if (!this.workspacePath) {
      return null;
    }

    // Bundle path: tests/d365/specs/<TestName>/
    const bundlePath = path.join(
      this.workspacePath,
      'tests',
      'd365',
      'specs',
      testName
    );

    return bundlePath;
  }

  /**
   * Extract failure data from test result
   */
  private extractFailureData(
    test: TestCase,
    result: TestResult,
    testName: string,
    bundlePath: string
  ): FailureArtifact {
    const error = result.error;
    
    // Extract error message (clean ANSI codes if present)
    // TestError has message property, but may not have name property like standard Error
    let errorMessage = 'Unknown error';
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }
    errorMessage = this.stripAnsiCodes(errorMessage);

    // Extract stack trace
    let stackTrace = '';
    if (error && typeof error !== 'string' && 'stack' in error && typeof error.stack === 'string') {
      stackTrace = error.stack;
    }
    stackTrace = this.stripAnsiCodes(stackTrace);

    // Extract location
    const location = this.extractLocation(test, error);

    // Extract screenshot path (relative to workspace)
    const screenshot = this.extractScreenshotPath(result, bundlePath);

    // Extract trace path (relative to workspace)
    const trace = this.extractTracePath(result, bundlePath);

    // Extract failed locator from error message
    const failedLocator = this.extractFailedLocator(errorMessage, stackTrace);

    // Extract assertion failure information
    const assertionFailure = this.extractAssertionFailure(errorMessage, stackTrace);

    // Build failure artifact
    const artifact: FailureArtifact = {
      testName,
      fullTitle: test.title,
      status: result.status,
      error: {
        message: errorMessage,
        stack: stackTrace,
        location,
      },
      duration: result.duration,
      retry: result.retry,
      timestamp: new Date().toISOString(),
    };

    // Add optional fields
    if (screenshot) {
      artifact.screenshot = screenshot;
    }
    if (trace) {
      artifact.trace = trace;
    }
    if (failedLocator) {
      artifact.failedLocator = failedLocator;
    }
    if (assertionFailure) {
      artifact.assertionFailure = assertionFailure;
    }

    return artifact;
  }

  /**
   * Extract error location from test and error
   */
  private extractLocation(test: TestCase, error: any): LocationInfo {
    // Prefer location from test case
    if (test.location) {
      return {
        file: test.location.file || 'unknown',
        line: test.location.line || 0,
        column: test.location.column || 0,
      };
    }

    // Fallback to error stack trace parsing
    if (error?.stack) {
      const stackMatch = error.stack.match(/at .+ \((.+):(\d+):(\d+)\)/);
      if (stackMatch) {
        return {
          file: stackMatch[1],
          line: parseInt(stackMatch[2], 10),
          column: parseInt(stackMatch[3], 10),
        };
      }
    }

    return {
      file: 'unknown',
      line: 0,
      column: 0,
    };
  }

  /**
   * Extract screenshot path from test result
   * Screenshots are typically in test-results/ directory
   */
  private extractScreenshotPath(result: TestResult, bundlePath: string): string | undefined {
    // Playwright attaches screenshots to test result
    // Check attachments for screenshot
    const screenshotAttachment = result.attachments?.find(
      (att) => att.name === 'screenshot' || att.path?.endsWith('.png')
    );

    if (screenshotAttachment?.path) {
      // Make path relative to workspace if possible
      if (this.workspacePath && screenshotAttachment.path.startsWith(this.workspacePath)) {
        return path.relative(this.workspacePath, screenshotAttachment.path).replace(/\\/g, '/');
      }
      return screenshotAttachment.path;
    }

    return undefined;
  }

  /**
   * Extract trace path from test result
   * Traces are typically in test-results/ directory
   */
  private extractTracePath(result: TestResult, bundlePath: string): string | undefined {
    // Playwright attaches traces to test result
    const traceAttachment = result.attachments?.find(
      (att) => att.name === 'trace' || att.path?.endsWith('.zip')
    );

    if (traceAttachment?.path) {
      // Make path relative to workspace if possible
      if (this.workspacePath && traceAttachment.path.startsWith(this.workspacePath)) {
        return path.relative(this.workspacePath, traceAttachment.path).replace(/\\/g, '/');
      }
      return traceAttachment.path;
    }

    return undefined;
  }

  /**
   * Strip ANSI color codes from string
   */
  private stripAnsiCodes(str: string): string {
    // Remove ANSI escape sequences
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  }

  /**
   * Extract failed locator from error message
   * Common patterns:
   * - "locator.click: Test timeout of 120000ms exceeded. Call log: - waiting for getByRole('button', { name: 'OK' })"
   * - "locator.fill: Element not found: page.getByRole('combobox', { name: 'Customer account' })"
   * - "Timeout 30000ms exceeded while waiting for getByLabel('Username')"
   */
  private extractFailedLocator(errorMessage: string, stackTrace: string): { locator: string; type: string; locatorKey: string } | undefined {
    // Combine error message and stack trace for better matching
    const combinedText = `${errorMessage}\n${stackTrace}`;

    // Pattern 1: "waiting for getByRole('button', { name: 'OK' })"
    const waitingPattern = /waiting for (getByRole\([^)]+\)|getByLabel\([^)]+\)|getByText\([^)]+\)|getByPlaceholder\([^)]+\)|locator\([^)]+\))/i;
    let match = combinedText.match(waitingPattern);
    if (match) {
      const locatorStr = match[1].trim();
      return this.parseLocatorString(locatorStr);
    }

    // Pattern 2: "getByRole('button', { name: 'OK' })" in error message
    const directPattern = /(getByRole\([^)]+\)|getByLabel\([^)]+\)|getByText\([^)]+\)|getByPlaceholder\([^)]+\)|locator\([^)]+\))/i;
    match = combinedText.match(directPattern);
    if (match) {
      const locatorStr = match[1].trim();
      return this.parseLocatorString(locatorStr);
    }

    // Pattern 3: "page.getByRole('button', { name: 'OK' })" or "page.locator('#id')"
    const pagePattern = /page\.(getByRole\([^)]+\)|getByLabel\([^)]+\)|getByText\([^)]+\)|getByPlaceholder\([^)]+\)|locator\([^)]+\))/i;
    match = combinedText.match(pagePattern);
    if (match) {
      const locatorStr = match[1].trim();
      return this.parseLocatorString(locatorStr);
    }

    return undefined;
  }

  /**
   * Extract assertion failure information from error message
   * Parses Playwright assertion errors like:
   * - "expect(locator).toHaveText(expected)" failed
   * - "expect(page).toHaveURL(expected)" failed
   */
  private extractAssertionFailure(errorMessage: string, stackTrace: string): {
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
  } | undefined {
    // Pattern 1: expect(...).toHaveText(...) failed
    // Pattern 2: expect(...).toBeVisible() failed
    // Pattern 3: expect(...).toHaveURL(...) failed
    const assertionPatterns = [
      /expect\(([^)]+)\)\.(toHaveText|toContainText|toBeVisible|toHaveURL|toHaveTitle|toBeChecked|toHaveValue|toHaveAttribute)\(([^)]*)\)/i,
      /expect\(([^)]+)\)\.(toHaveText|toContainText|toBeVisible|toHaveURL|toHaveTitle|toBeChecked|toHaveValue|toHaveAttribute)\(\)/i,
    ];

    for (const pattern of assertionPatterns) {
      const match = errorMessage.match(pattern) || stackTrace.match(pattern);
      if (match) {
        const target = match[1].trim();
        const assertionType = match[2];
        
        // Try to extract expected and actual values from error message
        let expected: string | undefined;
        let actual: string | undefined;

        // Look for "Expected: ..." and "Received: ..." patterns
        const expectedMatch = errorMessage.match(/Expected[:\s]+(?:'|"|`)?([^'"`\n]+)(?:'|"|`)?/i);
        if (expectedMatch) {
          expected = expectedMatch[1].trim();
        } else if (match[3]) {
          // Use the value from the assertion call
          expected = match[3].replace(/['"]/g, '').trim();
        }

        const actualMatch = errorMessage.match(/Received[:\s]+(?:'|"|`)?([^'"`\n]+)(?:'|"|`)?/i);
        if (actualMatch) {
          actual = actualMatch[1].trim();
        }

        return {
          assertionType,
          target,
          expected,
          actual,
        };
      }
    }

    return undefined;
  }

  /**
   * Parse locator string and extract type and key
   * Examples:
   * - "getByRole('button', { name: 'OK' })" -> type: 'role', key: "role:page.getByRole('button', { name: 'OK' })"
   * - "locator('#id')" -> type: 'css', key: "css:page.locator('#id')"
   */
  private parseLocatorString(locatorStr: string): { locator: string; type: string; locatorKey: string } | undefined {
    // Normalize: remove 'page.' prefix if present
    const normalized = locatorStr.replace(/^page\./, '');

    // Determine type
    let type = 'css';
    if (normalized.startsWith('getByRole(')) {
      type = 'role';
    } else if (normalized.startsWith('getByLabel(')) {
      type = 'label';
    } else if (normalized.startsWith('getByText(')) {
      type = 'text';
    } else if (normalized.startsWith('getByPlaceholder(')) {
      type = 'placeholder';
    } else if (normalized.startsWith('locator(')) {
      // Try to determine if it's CSS, XPath, or testid
      const locatorMatch = normalized.match(/locator\(['"]([^'"]+)['"]\)/);
      if (locatorMatch) {
        const selector = locatorMatch[1];
        if (selector.startsWith('//') || selector.startsWith('/')) {
          type = 'xpath';
        } else if (selector.includes('data-test-id')) {
          type = 'testid';
        } else if (selector.includes('data-dyn-controlname')) {
          type = 'd365-controlname';
        } else {
          type = 'css';
        }
      }
    } else {
      return undefined;
    }

    // Build full locator string with 'page.' prefix
    const fullLocator = `page.${normalized}`;
    const locatorKey = `${type}:${fullLocator}`;

    return {
      locator: fullLocator,
      type,
      locatorKey,
    };
  }
}

// Default export for Playwright reporter loading
export default ErrorGrabber;

/**
 * Failure artifact structure matching the spec
 */
interface FailureArtifact {
  testName: string;
  fullTitle: string;
  status: 'failed' | 'timedOut' | 'passed' | 'skipped' | 'interrupted';
  error: {
    message: string;
    stack: string;
    location: LocationInfo;
  };
  duration: number;
  retry: number;
  timestamp: string;
  screenshot?: string;
  trace?: string;
  failedLocator?: {
    locator: string;
    type: string;
    locatorKey: string;
  };
  assertionFailure?: {
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
  };
}

interface LocationInfo {
  file: string;
  line: number;
  column: number;
}

