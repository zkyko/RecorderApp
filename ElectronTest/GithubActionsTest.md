# QA Studio - GitHub Actions CI/CD Setup Guide

## Overview

This guide sets up automated testing for QA Studio that runs on every push to `dev` branch and blocks merges to `main` until all tests pass.

## Test Strategy

### Test Types for QA Studio

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test service interactions and IPC calls
3. **UI Component Tests** - Test React components in isolation
4. **E2E Tests** - Test full Electron app workflows
5. **Linting & Type Checking** - Code quality gates

---

## Step 1: Project Test Structure Setup

### Directory Structure

```
QA-Studio/
├── .github/
│   └── workflows/
│       ├── ci-dev.yml           # Runs on push to dev
│       ├── ci-pr.yml            # Runs on PRs to main
│       └── release.yml          # Runs on merge to main
├── src/
│   ├── core/
│   │   └── __tests__/          # Unit tests for core
│   ├── main/
│   │   └── __tests__/          # Unit tests for main process
│   ├── generators/
│   │   └── __tests__/          # Unit tests for generators
│   └── ui/
│       ├── src/
│       │   └── __tests__/      # React component tests
│       └── e2e/                # E2E tests for UI
├── tests/
│   ├── integration/            # Integration tests
│   ├── e2e/                    # Full app E2E tests
│   └── fixtures/               # Test data
├── jest.config.js              # Jest for unit tests
├── playwright.config.ts        # Playwright for E2E
└── vitest.config.ts           # Vitest for UI tests
```

---

## Step 2: Install Testing Dependencies

### Package.json Updates

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:ui && npm run test:e2e",
    "test:unit": "jest --config jest.config.js",
    "test:ui": "cd src/ui && vitest run",
    "test:e2e": "playwright test",
    "test:integration": "jest --config jest.integration.config.js",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.{ts,tsx}",
    "lint:fix": "eslint src/**/*.{ts,tsx} --fix",
    "typecheck": "tsc --noEmit",
    "typecheck:ui": "cd src/ui && tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1"
  }
}
```

---

## Step 3: Jest Configuration (Unit Tests)

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/ui/**' // UI has separate testing
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### jest.integration.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000, // Integration tests take longer
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts']
};
```

---

## Step 4: Vitest Configuration (UI Tests)

### src/ui/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### src/ui/src/ **tests** /setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron IPC
global.window.electron = {
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn()
  }
};
```

---

## Step 5: Playwright Configuration (E2E Tests)

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Electron-specific config
      }
    }
  ]
});
```

---

## Step 6: Example Test Files

### Unit Test Example: src/core/locators/ **tests** /locator-extractor.test.ts

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocatorExtractor } from '../locator-extractor';

describe('LocatorExtractor', () => {
  let extractor: LocatorExtractor;

  beforeEach(() => {
    extractor = new LocatorExtractor();
  });

  describe('extractLocator', () => {
    it('should extract data-dyn-controlname attribute', () => {
      const element = {
        getAttribute: (attr: string) => {
          if (attr === 'data-dyn-controlname') return 'SalesOrderButton';
          return null;
        },
        tagName: 'BUTTON',
        textContent: 'Create Sales Order'
      };

      const locator = extractor.extractLocator(element as any);
    
      expect(locator.strategy).toBe('data-attribute');
      expect(locator.selector).toContain('data-dyn-controlname=SalesOrderButton');
    });

    it('should fallback to role-based locator', () => {
      const element = {
        getAttribute: () => null,
        tagName: 'BUTTON',
        textContent: 'Submit',
        role: 'button'
      };

      const locator = extractor.extractLocator(element as any);
    
      expect(locator.strategy).toBe('role');
      expect(locator.selector).toContain("getByRole('button'");
    });

    it('should sanitize special characters in text', () => {
      const element = {
        getAttribute: () => null,
        tagName: 'BUTTON',
        textContent: "Quote's & Special <chars>",
        role: 'button'
      };

      const locator = extractor.extractLocator(element as any);
    
      expect(locator.selector).not.toContain('<');
      expect(locator.selector).not.toContain('>');
    });
  });

  describe('calculateLocatorHealth', () => {
    it('should return high health for unique locators', () => {
      const locator = {
        selector: "[data-dyn-controlname='UniqueControl']",
        strategy: 'data-attribute'
      };

      const health = extractor.calculateHealth(locator);
    
      expect(health.score).toBeGreaterThan(80);
      expect(health.uniqueness).toBe(true);
    });

    it('should return low health for generic locators', () => {
      const locator = {
        selector: 'div > button',
        strategy: 'css'
      };

      const health = extractor.calculateHealth(locator);
    
      expect(health.score).toBeLessThan(50);
      expect(health.warnings).toContain('Generic selector');
    });
  });
});
```

### Integration Test Example: tests/integration/codegen-service.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CodegenService } from '../../src/main/services/codegen-service';
import { WorkspaceManager } from '../../src/main/services/workspace-manager';
import fs from 'fs/promises';
import path from 'path';

describe('CodegenService Integration', () => {
  let codegenService: CodegenService;
  let workspaceManager: WorkspaceManager;
  let testWorkspacePath: string;

  beforeAll(async () => {
    // Setup test workspace
    testWorkspacePath = path.join(__dirname, '../fixtures/test-workspace');
    await fs.mkdir(testWorkspacePath, { recursive: true });
  
    workspaceManager = new WorkspaceManager();
    await workspaceManager.createWorkspace('test', testWorkspacePath);
  
    codegenService = new CodegenService(workspaceManager);
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(testWorkspacePath, { recursive: true, force: true });
  });

  it('should generate spec file from recorded steps', async () => {
    const steps = [
      {
        action: 'click',
        selector: "getByRole('button', { name: 'Create' })",
        pageId: 'SalesOrderList',
        timestamp: Date.now()
      },
      {
        action: 'fill',
        selector: "getByLabel('Customer Account')",
        value: 'US-001',
        pageId: 'SalesOrderForm',
        timestamp: Date.now()
      }
    ];

    const result = await codegenService.generateSpec({
      name: 'CreateSalesOrder',
      steps,
      module: 'Sales',
      workspace: 'test'
    });

    expect(result.success).toBe(true);
    expect(result.filePath).toContain('CreateSalesOrder.spec.ts');
  
    // Verify file exists
    const fileExists = await fs.access(result.filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    // Verify content
    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain("test('Create Sales Order'");
    expect(content).toContain("getByRole('button', { name: 'Create' })");
    expect(content).toContain("getByLabel('Customer Account')");
  });

  it('should handle assertions in generated code', async () => {
    const steps = [
      {
        action: 'click',
        selector: "getByRole('button', { name: 'Submit' })",
        pageId: 'SalesOrderForm',
        timestamp: Date.now()
      },
      {
        action: 'assert',
        assertionType: 'toHaveText',
        selector: "getByRole('alert')",
        expectedValue: 'Order created successfully',
        pageId: 'SalesOrderForm',
        timestamp: Date.now()
      }
    ];

    const result = await codegenService.generateSpec({
      name: 'SubmitOrder',
      steps,
      module: 'Sales',
      workspace: 'test'
    });

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain("await expect(");
    expect(content).toContain(").toHaveText('Order created successfully')");
  });
});
```

### UI Component Test Example: src/ui/src/components/ **tests** /SettingsScreen.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsScreen } from '../SettingsScreen';
import { BrowserRouter } from 'react-router-dom';

const mockInvoke = vi.fn();
vi.mock('../../services/bridge', () => ({
  bridge: {
    getConfig: mockInvoke,
    updateConfig: mockInvoke,
    testConnection: mockInvoke
  }
}));

describe('SettingsScreen', () => {
  it('should render all tabs', () => {
    render(
      <BrowserRouter>
        <SettingsScreen />
      </BrowserRouter>
    );

    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Recording')).toBeInTheDocument();
    expect(screen.getByText('BrowserStack')).toBeInTheDocument();
    expect(screen.getByText('Jira')).toBeInTheDocument();
  });

  it('should load configuration on mount', async () => {
    mockInvoke.mockResolvedValue({
      d365Url: 'https://test.dynamics.com',
      module: 'Sales'
    });

    render(
      <BrowserRouter>
        <SettingsScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('getConfig');
    });
  });

  it('should test BrowserStack connection', async () => {
    mockInvoke.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <SettingsScreen />
      </BrowserRouter>
    );

    // Switch to BrowserStack tab
    const bsTab = screen.getByText('BrowserStack');
    fireEvent.click(bsTab);

    // Click test connection
    const testBtn = screen.getByText('Test Connection');
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('testBrowserStackConnection');
      expect(screen.getByText(/Connection successful/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid inputs', async () => {
    render(
      <BrowserRouter>
        <SettingsScreen />
      </BrowserRouter>
    );

    const urlInput = screen.getByLabelText(/D365 URL/i);
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    fireEvent.blur(urlInput);

    await waitFor(() => {
      expect(screen.getByText(/Invalid URL format/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example: tests/e2e/recording-flow.spec.ts

```typescript
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test.describe('Recording Flow E2E', () => {
  test('should complete full recording workflow', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')]
    });

    const window = await electronApp.firstWindow();

    // Navigate to Record screen
    await window.click('text=Record');
    await expect(window.locator('text=Start Recording')).toBeVisible();

    // Start recording
    await window.click('button:has-text("Start Recording")');
  
    // Wait for recorder to initialize
    await window.waitForSelector('text=Recording...', { timeout: 10000 });

    // Simulate some actions (this would interact with the spawned browser)
    // In practice, you'd need to coordinate with the Playwright browser

    // Stop recording
    await window.click('button:has-text("Stop Recording")');

    // Verify steps were captured
    await expect(window.locator('.step-item')).toHaveCount(3, { timeout: 5000 });

    // Generate code
    await window.click('button:has-text("Generate Code")');

    // Verify success notification
    await expect(window.locator('text=Code generated successfully')).toBeVisible();

    await electronApp.close();
  });

  test('should handle authentication expiry', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')]
    });

    const window = await electronApp.firstWindow();

    // Mock expired authentication
    await window.evaluate(() => {
      localStorage.setItem('authExpiry', String(Date.now() - 1000));
    });

    // Try to start recording
    await window.click('text=Record');
    await window.click('button:has-text("Start Recording")');

    // Should show authentication warning
    await expect(window.locator('text=Authentication Expired')).toBeVisible();

    // Should provide re-authenticate option
    await expect(window.locator('button:has-text("Re-authenticate")')).toBeVisible();

    await electronApp.close();
  });
});
```

---

## Step 7: GitHub Actions Workflows

### .github/workflows/ci-dev.yml (Runs on push to dev)

```yaml
name: CI - Dev Branch

on:
  push:
    branches: [dev]
  workflow_dispatch:

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: |
          npm ci
          cd src/ui && npm ci
    
      - name: Run ESLint
        run: npm run lint
    
      - name: Type check main
        run: npm run typecheck
    
      - name: Type check UI
        run: npm run typecheck:ui

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: npm ci
    
      - name: Run unit tests
        run: npm run test:unit -- --coverage
    
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit
          name: unit-tests

  ui-tests:
    name: UI Component Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: |
          npm ci
          cd src/ui && npm ci
    
      - name: Run UI tests
        run: npm run test:ui
    
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./src/ui/coverage/coverage-final.json
          flags: ui
          name: ui-tests

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, ui-tests]
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: npm ci
    
      - name: Run integration tests
        run: npm run test:integration
        env:
          CI: true

  e2e-tests:
    name: E2E Tests
    runs-on: ${{ matrix.os }}
    needs: integration-tests
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: npm ci
    
      - name: Install Playwright
        run: npx playwright install --with-deps
    
      - name: Build application
        run: npm run build:all
    
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
    
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.os }}
          path: playwright-report/
          retention-days: 7
    
      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-videos-${{ matrix.os }}
          path: test-results/
          retention-days: 7

  build-test:
    name: Build Application
    runs-on: ${{ matrix.os }}
    needs: [unit-tests, ui-tests, integration-tests]
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: npm ci
    
      - name: Build main and generators
        run: npm run build:all
    
      - name: Build Electron app (test)
        run: npm run dist:test
        env:
          CI: true
    
      - name: Verify build artifacts
        shell: bash
        run: |
          if [ "$RUNNER_OS" == "Windows" ]; then
            test -f release/*.exe
          elif [ "$RUNNER_OS" == "macOS" ]; then
            test -d release/*.app
          else
            test -f release/*.AppImage
          fi

  status-check:
    name: All Tests Passed
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests, ui-tests, integration-tests, e2e-tests, build-test]
    if: always()
    steps:
      - name: Check test results
        run: |
          if [ "${{ needs.lint-and-typecheck.result }}" != "success" ] || \
             [ "${{ needs.unit-tests.result }}" != "success" ] || \
             [ "${{ needs.ui-tests.result }}" != "success" ] || \
             [ "${{ needs.integration-tests.result }}" != "success" ] || \
             [ "${{ needs.e2e-tests.result }}" != "success" ] || \
             [ "${{ needs.build-test.result }}" != "success" ]; then
            echo "❌ Some tests failed"
            exit 1
          else
            echo "✅ All tests passed"
          fi
```

### .github/workflows/ci-pr.yml (Runs on PRs to main)

```yaml
name: CI - Pull Request

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

# Prevent multiple runs for same PR
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  pr-checks:
    name: PR Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for comparison
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: |
          npm ci
          cd src/ui && npm ci
    
      - name: Check PR title format
        run: |
          PR_TITLE="${{ github.event.pull_request.title }}"
          if ! echo "$PR_TITLE" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
            echo "❌ PR title must follow conventional commits format"
            echo "Examples: feat: add new feature, fix(ui): resolve button issue"
            exit 1
          fi
    
      - name: Check for merge conflicts
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git fetch origin main
          if ! git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -q "^"; then
            echo "❌ Merge conflicts detected"
            exit 1
          fi
    
      - name: Run all linters
        run: npm run lint
    
      - name: Type check
        run: |
          npm run typecheck
          npm run typecheck:ui
    
      - name: Check bundle size
        run: |
          npm run build:all
          BUNDLE_SIZE=$(du -sh dist | cut -f1)
          echo "Bundle size: $BUNDLE_SIZE"
          # Add size check logic here

  full-test-suite:
    name: Full Test Suite
    uses: ./.github/workflows/ci-dev.yml
    secrets: inherit

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
    
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
    
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  pr-ready:
    name: PR Ready for Review
    runs-on: ubuntu-latest
    needs: [pr-checks, full-test-suite, security-scan]
    if: always()
    steps:
      - name: Check all jobs
        run: |
          if [ "${{ needs.pr-checks.result }}" != "success" ] || \
             [ "${{ needs.full-test-suite.result }}" != "success" ]; then
            echo "❌ PR is not ready for merge - tests failed"
            exit 1
          else
            echo "✅ PR is ready for review"
          fi
    
      - name: Comment on PR
        uses: actions/github-script@v7
        if: success()
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ All tests passed! This PR is ready for review.'
            })
```

### .github/workflows/release.yml (Runs on merge to main)

```yaml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  create-release:
    name: Create Release
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
      release_created: ${{ steps.release.outputs.release_created }}
    steps:
      - uses: google-github-actions/release-please-action@v3
        id: release
        with:
          release-type: node
          package-name: qa-studio
    
      - id: version
        run: echo "version=${{ steps.release.outputs.major }}.${{ steps.release.outputs.minor }}.${{ steps.release.outputs.patch }}" >> $GITHUB_OUTPUT

  build-and-publish:
    name: Build & Publish
    needs: create-release
    if: needs.create-release.outputs.release_created
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
    
      - name: Install dependencies
        run: npm ci
    
      - name: Build application
        run: npm run build:all
    
      - name: Package Electron app
        run: npm run dist
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
      - name: Upload release assets
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./release/*
          asset_name: qa-studio-${{ matrix.os }}-${{ needs.create-release.outputs.version }}
          asset_content_type: application/octet-stream
```

---

## Step 8: Branch Protection Rules

### Configure in GitHub Repository Settings

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. **For `main` branch:**
   ```
   Branch name pattern: main

   ✅ Require a pull request before merging
      ✅ Require approvals: 1
      ✅ Dismiss stale pull request approvals when new commits are pushed

   ✅ Require status checks to pass before merging
      ✅ Require branches to be up to date before merging
      Required status checks:
         - Lint & Type Check
         - Unit Tests
         - UI Component Tests
         - Integration Tests
         - E2E Tests
         - Build Application
         - All Tests Passed

   ✅ Require conversation resolution before merging
   ✅ Require linear history
   ✅ Include administrators
   ```
3. **For `dev` branch:**
   ```
   Branch name pattern: dev

   ✅ Require status checks to pass before merging
      Required status checks:
         - Lint & Type Check
         - Unit Tests
         - All Tests Passed
   ```

---

## Step 9: PR Template

### .github/pull_request_template.md

```markdown
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Related Issues
<!-- Link related issues here. Use "Closes #123" to auto-close issues -->
Closes #

## Screenshots (if applicable)
<!-- Add screenshots to demonstrate UI changes -->

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Additional Notes
<!-- Any additional information that reviewers should know -->
```

---

## Step 10: Local Testing Commands

### Add to package.json scripts

```json
{
  "scripts": {
    "ci:local": "npm run lint && npm run typecheck && npm test",
    "ci:full": "npm run ci:local && npm run test:e2e",
    "pre-push": "npm run ci:local",
    "pre-commit": "npm run lint:fix && git add -A"
  }
}
```

### Setup Git Hooks (using Husky)

```bash
npm install --save-dev husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/pre-push "npm run pre-push"
```

### .lintstagedrc.json

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "git add"
  ],
  "*.{json,md}": [
    "prettier --write",
    "git add"
  ]
}
```

---

## Step 11: Monitoring & Notifications

### Add Slack Notifications (Optional)

Create `.github/workflows/notify.yml`:

```yaml
name: Test Notifications

on:
  workflow_run:
    workflows: ["CI - Dev Branch", "CI - Pull Request"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Workflow: ${{ github.workflow }}
            Status: ${{ job.status }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

---

## Step 12: Coverage Requirements

### Add coverage badge to README.md

```markdown
[![Coverage](https://codecov.io/gh/YOUR_USERNAME/qa-studio/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/qa-studio)
```

### Setup Codecov (Optional)

1. Sign up at codecov.io
2. Add repository
3. Get upload token
4. Add `CODECOV_TOKEN` to GitHub secrets

---

## Testing Workflow

### Developer Workflow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Make changes and test locally
npm run ci:local

# 3. Commit changes (pre-commit hook runs)
git add .
git commit -m "feat: add new feature"

# 4. Push to GitHub (pre-push hook runs)
git push origin feature/my-feature

# 5. Create PR to dev
# GitHub Actions runs full test suite

# 6. After approval and merge to dev
# Tests run again on dev branch

# 7. When ready for production, create PR from dev to main
# Full test suite + security scans run

# 8. After merge to main
# Release workflow builds and publishes
```

### CI/CD Flow

```
Push to dev
    ↓
Lint & Typecheck → Unit Tests → UI Tests → Integration Tests → E2E Tests → Build
    ↓
All pass → Merge allowed
    ↓
PR to main
    ↓
Full test suite + Security scan + Build verification
    ↓
All pass + Approval → Merge to main
    ↓
Release workflow → Build for all platforms → Publish to GitHub Releases
```

---

## Common Issues & Solutions

### Issue: Tests timeout in CI

 **Solution** : Increase timeout in test configs

```javascript
// jest.config.js
testTimeout: 30000,

// playwright.config.ts
timeout: 60000,
```

### Issue: E2E tests fail on Linux

 **Solution** : Install required dependencies

```yaml
- name: Install Playwright dependencies
  run: npx playwright install-deps
```

### Issue: Build fails on Windows

 **Solution** : Use cross-platform paths

```javascript
path.join(__dirname, 'relative', 'path')
// instead of
'./relative/path'
```

### Issue: Coverage not uploading

 **Solution** : Ensure codecov action has token

```yaml
- uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

---

## Maintenance Checklist

Weekly:

* [ ] Review failed test trends
* [ ] Update dependencies (`npm outdated`)
* [ ] Check Dependabot PRs

Monthly:

* [ ] Review test coverage trends
* [ ] Update GitHub Actions versions
* [ ] Audit and remove flaky tests
* [ ] Review and optimize slow tests

Quarterly:

* [ ] Major dependency updates
* [ ] Review and update test strategy
* [ ] Security audit (`npm audit`)
* [ ] Performance benchmarking

---

## Next Steps

1. **Implement unit tests** for core modules (locator-extractor, page-classifier)
2. **Add UI component tests** for all React components
3. **Create integration tests** for services (codegen, workspace-manager)
4. **Write E2E tests** for critical user flows
5. **Setup GitHub Actions** workflows
6. **Configure branch protection** rules
7. **Test the pipeline** with a sample PR
8. **Monitor and iterate** based on feedback

This comprehensive setup ensures code quality, prevents regressions, and maintains confidence when merging to production.
