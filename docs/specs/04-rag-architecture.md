# AI-Powered RAG Debugging Architecture

## Overview

This document specifies the architecture for an AI-powered Retrieval-Augmented Generation (RAG) system that enables intelligent test failure diagnosis and automated fix suggestions. The system leverages structured test metadata, failure forensics, and LLM inference to provide contextual debugging assistance without requiring Page Object Model (POM) abstractions.

## System Components

The RAG debugging system consists of four primary components:

1. **Test Bundle Architecture** (The Knowledge Base) - Structured test artifacts with rich metadata
2. **Forensics Engine** (The Data Source) - Custom Playwright reporter that captures failure context
3. **RAG Workflow** (The Brain) - Retrieval and inference pipeline for AI-powered diagnosis
4. **Settings & Configuration** - User-configurable LLM provider settings

---

## A. Test Bundle Architecture (The Knowledge Base)

### Overview

The Test Bundle Architecture replaces the previous flat file structure with a self-contained "bundle" for each test. This bundle serves as a complete knowledge base for AI-powered debugging, containing executable code, metadata, and rich context information.

### Directory Structure

```
tests/
└── d365/
    └── specs/
        └── <TestName>/
            ├── <TestName>.spec.ts      # Executable Playwright code
            ├── <TestName>.meta.json    # Structured metadata
            └── <TestName>.meta.md       # AI-readable context file
```

**Path Pattern:** `tests/d365/specs/<TestName>/`

Where `<TestName>` is the kebab-case filename derived from the test flow name (e.g., `create-sales-order`).

### Bundle Contents

#### 1. `<TestName>.spec.ts` - The Executable Code

The Playwright test specification file containing the actual test implementation. This file:

- Imports test data from `../../data/<TestName>Data.json`
- Contains data-driven test structure with `test.describe()` and parameterized test cases
- Uses inline locators directly (no POM abstraction)
- May import runtime helpers (e.g., `waitForD365` from `../../runtime/d365-waits`)
- Includes fixtures in test function parameters (e.g., `async ({ page, browserStackWorker, request })`)

**Example Structure:**
```typescript
import { test, expect } from '@playwright/test';
import dataSet from '../../data/create-sales-order-data.json';
import { waitForD365 } from '../../runtime/d365-waits';

test.describe('Create Sales Order - Data Driven', () => {
  for (const data of dataSet) {
    test(`\${data.testCaseId}`, async ({ page }, testInfo) => {
      // Test implementation with inline locators
      await page.goto('/');
      await waitForD365(page);
      await page.getByRole('button', { name: 'Sales' }).click();
      // ... more steps
    });
  }
});
```

#### 2. `<TestName>.meta.json` - Structured Metadata

A JSON file containing machine-readable metadata about the test:

```json
{
  "name": "Create Sales Order",
  "module": "sales",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "dataPath": "../../data/create-sales-order-data.json"
}
```

**Fields:**
- `name`: Human-readable test name (formatted from flow name)
- `module`: Optional module identifier (e.g., "sales", "purchasing")
- `createdAt`: ISO 8601 timestamp of test creation
- `dataPath`: Relative path from spec file to the test data JSON file

#### 3. `<TestName>.meta.md` - The AI Context File

A Markdown file designed for RAG retrieval, containing comprehensive context about the test. This file is **crucial** for AI debugging since we do not use Page Object Models.

**Structure:**

```markdown
# <TestName>

## Test Intent

<Flow name and description>
**Module:** <module name if applicable>

## Key Locators & Strategy

### Fixtures Used

- `page` - Playwright Page fixture
- `browserStackWorker` - BrowserStack worker fixture (if applicable)
- `request` - API request fixture (if applicable)

### Runtime Helpers

- `waitForD365` - Helper function for D365-specific waits
- `<other helpers>` - Additional imported runtime utilities

### Locators

#### role
- `page.getByRole('button', { name: 'Sales' })` (line 15)
- `page.getByRole('textbox', { name: 'Customer Account' })` (line 22)

#### label
- `page.getByLabel('Order Date')` (line 18)

#### css
- `page.locator('[data-dyn-controlname="SalesOrderHeader"]')` (line 25)

#### d365-controlname
- `page.locator('[data-dyn-controlname="CustAccount"]')` (line 20)

#### text
- `page.getByText('Submit')` (line 30)

#### placeholder
- `page.getByPlaceholder('Enter value')` (line 28)

## Code Preview

\`\`\`typescript
<Full source code of the spec file>
\`\`\`
```

**Context Strategy (Critical):**

Since we do **not** use Page Object Models, the `.meta.md` file must explicitly document:

1. **Fixtures Used**: All Playwright fixtures available to the test (extracted from test function parameters)
2. **Helpers Imported**: All runtime helper functions imported and available (e.g., `waitForD365`, `jsonDataSource`)
3. **Inline Locators**: A categorized summary of all raw selectors used in the test steps, grouped by type (role, label, CSS, d365-controlname, text, placeholder, xpath, etc.)
4. **Full Code Preview**: The complete source code in a markdown code block for reference

This ensures the AI debugger has complete visibility into:
- What tools (fixtures/helpers) are available
- What selectors are being used and where
- The exact code structure and flow

### Generation Process

The Test Bundle is generated by the `SpecGenerator` class (`src/generators/spec-generator.ts`):

1. **Spec Generation**: `generateSpec()` creates the bundle directory structure and generates the `.spec.ts` file
2. **Meta JSON Generation**: `generateMetaJson()` creates the structured metadata file
3. **Meta MD Generation**: `generateMetaMd()` extracts:
   - Fixtures from test function parameter destructuring
   - Runtime helpers from import statements (excluding `@playwright/test` and JSON imports)
   - Locators using regex-based parsing (similar to `bridge.ts` `test:parseLocators` handler)
   - Full code preview from the generated spec content

4. **File Writing**: The `handleGenerateCode()` method in `bridge.ts` writes all three files to the bundle directory

### Migration from Flat Structure

**Previous Structure:**
```
tests/d365/<module>/<TestName>.spec.ts
tests/d365/<module>/data/<TestName>Data.json
```

**New Structure:**
```
tests/d365/specs/<TestName>/<TestName>.spec.ts
tests/d365/specs/<TestName>/<TestName>.meta.json
tests/d365/specs/<TestName>/<TestName>.meta.md
tests/d365/data/<TestName>Data.json  (unchanged location)
```

**Import Path Updates:**
- Data imports change from `../data/` to `../../data/` (spec is now one level deeper)
- Page imports (if using POMs) are recalculated using `buildPageImportPath()` method

---

## B. Forensics Engine (The Data Source)

### Overview

The Forensics Engine is a custom Playwright Reporter that captures detailed failure context when tests fail. It hooks into Playwright's test lifecycle to extract error information and save it alongside the test bundle.

### Implementation Location

**File:** `src/main/services/reporters/ErrorGrabber.ts`

### Reporter Interface

The reporter implements Playwright's `Reporter` interface:

```typescript
import type { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';

export class ErrorGrabber implements Reporter {
  // Implementation details
}
```

### Key Methods

#### `onTestEnd(test: TestCase, result: TestResult): void`

This method is called after each test completes (whether passed or failed). It:

1. **Checks for Failures**: Only processes tests with `result.status === 'failed'`
2. **Extracts Error Information**:
   - Test name and full title
   - Error message (e.g., "ShellBlockingDiv intercepted click")
   - Error stack trace
   - Failure location (file path, line number, column)
   - Screenshot path (if available)
   - Trace file path (if available)
   - Test duration
   - Retry information

3. **Resolves Bundle Path**: 
   - Extracts test name from the test case
   - Constructs path to test bundle: `tests/d365/specs/<TestName>/`
   - Ensures directory exists

4. **Saves Failure Artifact**:
   - Creates `<TestName>_failure.json` in the test bundle directory
   - Contains structured failure data:

```json
{
  "testName": "create-sales-order",
  "fullTitle": "Create Sales Order - Data Driven > test-1",
  "status": "failed",
  "error": {
    "message": "ShellBlockingDiv intercepted click",
    "stack": "Error: ShellBlockingDiv intercepted click\n    at ...",
    "location": {
      "file": "tests/d365/specs/create-sales-order/create-sales-order.spec.ts",
      "line": 25,
      "column": 15
    }
  },
  "duration": 45230,
  "retry": 0,
  "screenshot": "test-results/create-sales-order-test-1/test-failed-1.png",
  "trace": "test-results/create-sales-order-test-1/trace.zip",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

### Error Message Extraction

The reporter extracts the specific error message from `result.error?.message`. Common D365-specific errors include:

- `"ShellBlockingDiv intercepted click"` - D365 blocking overlay prevented interaction
- `"Element not found"` - Locator could not find target element
- `"Timeout 30000ms exceeded"` - Action timed out
- `"Element is not attached to the DOM"` - Element was removed before interaction
- `"Element is not visible"` - Element exists but is hidden

### Integration with Playwright Config

The reporter is registered in the workspace-specific Playwright configuration:

```typescript
// Generated in test-runner.ts generateWorkspaceConfig()
reporter: [
  ['list'],
  ['allure-playwright', { /* ... */ }],
  ['./src/main/services/reporters/ErrorGrabber.ts'], // Custom reporter
],
```

### Failure Artifact Location

**Path Pattern:** `tests/d365/specs/<TestName>/<TestName>_failure.json`

This file is created **only** when a test fails, providing the AI system with the exact failure context needed for diagnosis.

### Multiple Failures

If a test fails multiple times (e.g., with retries), the reporter:
- Overwrites the previous failure file (latest failure is most relevant)
- Includes retry count in the failure JSON
- Preserves the most recent error context

---

## C. RAG Workflow (The Brain)

### Overview

The RAG Workflow orchestrates the retrieval of test context and failure information, then sends it to a configured LLM for intelligent diagnosis and fix suggestions.

### User Trigger

The workflow is initiated when a user clicks **"Diagnose with AI"** button in the Test Details or Test Runner UI, typically after a test failure.

### Workflow Steps

#### Step 1: Retrieval

**Location:** `src/main/services/rag-service.ts` (to be implemented)

**Process:**
1. User provides test name (e.g., `"create-sales-order"`)
2. Backend resolves test bundle path: `tests/d365/specs/<TestName>/`
3. Validates that bundle directory exists
4. Checks for required files:
   - `<TestName>.meta.md` (must exist)
   - `<TestName>_failure.json` (must exist for failure diagnosis)

#### Step 2: Context Loading

**Process:**
1. **Load AI Context File**: 
   - Reads `<TestName>.meta.md` from bundle directory
   - Parses Markdown to extract:
     - Test intent and description
     - Fixtures used
     - Runtime helpers
     - Locator summary
     - Full code preview

2. **Load Failure Data**:
   - Reads `<TestName>_failure.json` from bundle directory
   - Parses JSON to extract:
     - Error message
     - Stack trace
     - Failure location (file, line, column)
     - Screenshot/trace paths (if available)
     - Test metadata (duration, retry count)

3. **Load Test Data** (Optional):
   - Reads test data file from path in `meta.json`
   - Provides context about test parameters and data values

#### Step 3: Prompt Construction

**Process:**
1. Constructs a structured prompt for the LLM:

```
You are an expert Playwright test debugging assistant. A test has failed and needs diagnosis.

## Test Context

**Test Name:** <TestName>
**Module:** <module>
**Intent:** <test intent from meta.md>

## Available Tools

**Fixtures:**
- <list of fixtures>

**Runtime Helpers:**
- <list of helpers>

## Locators Used

<Categorized list of locators from meta.md>

## Test Code

\`\`\`typescript
<Full code from meta.md>
\`\`\`

## Failure Information

**Error Message:** <error message>
**Location:** <file>:<line>:<column>
**Stack Trace:**
\`\`\`
<stack trace>
\`\`\`

**Test Data:** <test data values if applicable>

## Task

Analyze the failure and provide:
1. Root cause analysis
2. Specific fix suggestions with code examples
3. Prevention strategies

Focus on D365-specific issues like ShellBlockingDiv, timing issues, and locator stability.
```

#### Step 4: Inference

**Process:**
1. **Retrieve LLM Configuration**:
   - Calls `configManager.getAIConfig()` to get:
     - Provider (OpenAI, DeepSeek, Custom)
     - API Key
     - Model name
     - Base URL

2. **Construct API Request**:
   - Uses base URL from config (e.g., `https://api.deepseek.com/v1` or `https://api.openai.com/v1`)
   - Formats request according to provider's API specification
   - Includes system prompt and user prompt with context

3. **Send to LLM**:
   - Makes HTTP request to configured provider
   - Handles authentication (API key in headers)
   - Streams response or waits for completion

4. **Parse Response**:
   - Extracts diagnosis and fix suggestions
   - Formats for display in UI

#### Step 5: Response Presentation

**Process:**
1. Returns structured response to UI:
   ```typescript
   {
     diagnosis: string,        // Root cause analysis
     fixes: Array<{
       description: string,    // What to change
       code: string,          // Code example
       location: string,      // Where to apply (file:line)
     }>,
     prevention: string,       // Prevention strategies
   }
   ```

2. UI displays:
   - Diagnosis in a readable format
   - Fix suggestions with code diffs
   - Option to apply fixes automatically (future enhancement)

### Error Handling

- **Missing Bundle**: Returns error if test bundle doesn't exist
- **Missing Failure Data**: Prompts user that test must fail first
- **LLM API Errors**: Handles rate limits, authentication failures, network errors
- **Invalid Response**: Validates LLM response format

### Caching Strategy (Future Enhancement)

- Cache successful diagnoses for common error patterns
- Store fix suggestions in bundle for offline reference
- Update cache when test code changes

---

## D. Settings & Configuration

### Overview

The Settings & Configuration system allows users to configure their preferred LLM provider for AI-powered debugging. Settings are stored securely using electron-store and never exposed to the renderer process.

### UI Location

**File:** `src/ui/src/components/SettingsScreen.tsx`

**Section:** "AI Debugging Assistant" (placed after "Recording Engine Settings")

### UI Components

#### 1. Provider Selector

**Component:** `Select` dropdown

**Options:**
- `openai` - OpenAI (GPT-4o, GPT-4, etc.)
- `deepseek` - DeepSeek (deepseek-chat model)
- `custom` - Custom provider (Ollama, local LLM, etc.)

**Behavior:**
- When provider changes, automatically updates model and base URL defaults (if they match previous provider's defaults)
- OpenAI → Model: "gpt-4o", Base URL: "https://api.openai.com/v1"
- DeepSeek → Model: "deepseek-chat", Base URL: "https://api.deepseek.com/v1"
- Custom → Clears defaults, allows manual entry

#### 2. API Key Input

**Component:** `TextInput` with `type="password"`

**Features:**
- Masked input for security
- Required for all providers
- Stored securely in electron-store (never in LocalStorage)

#### 3. Model Name Input

**Component:** `TextInput`

**Features:**
- Placeholder shows provider-specific default
- Description text shows default value
- User can override default
- Required field

**Defaults:**
- OpenAI: `"gpt-4o"`
- DeepSeek: `"deepseek-chat"`
- Custom: Empty (user must specify)

#### 4. Base URL Input

**Component:** `TextInput`

**Features:**
- Optional field (useful for DeepSeek, local LLMs, or custom providers)
- Placeholder shows provider-specific default
- Description explains use case
- Allows switching providers without code changes

**Defaults:**
- OpenAI: `"https://api.openai.com/v1"`
- DeepSeek: `"https://api.deepseek.com/v1"`
- Custom: Empty (user must specify)

### Backend Storage

#### Config Manager

**File:** `src/main/config-manager.ts`

**Schema Extension:**
```typescript
interface ConfigSchema {
  // ... existing fields
  aiProvider?: 'openai' | 'deepseek' | 'custom';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
}
```

**Methods:**
- `getAIConfig()`: Returns current AI configuration
- `setAIConfig(config)`: Saves AI configuration to electron-store

**Security:**
- API keys stored in electron-store (encrypted on disk by Electron)
- Never exposed to renderer process
- Never logged or transmitted except to configured LLM API

### IPC Handlers

**File:** `src/main/bridge.ts`

**Handlers:**
- `settings:getAIConfig` - Retrieves AI config from ConfigManager
- `settings:updateAIConfig` - Saves AI config via ConfigManager

**File:** `src/main/preload.ts`

**Exposed Methods:**
- `settingsGetAIConfig()` - IPC call to get config
- `settingsUpdateAIConfig(request)` - IPC call to update config

**File:** `src/ui/src/ipc.ts`

**Client Methods:**
- `settings.getAIConfig()` - Promise-based getter
- `settings.updateAIConfig(config)` - Promise-based setter

### Type Definitions

**File:** `src/ui/src/types/electron.d.ts`

**Added Types:**
```typescript
settingsGetAIConfig: () => Promise<{
  success: boolean;
  config?: {
    provider?: 'openai' | 'deepseek' | 'custom';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
  error?: string;
}>;

settingsUpdateAIConfig: (request: {
  provider?: 'openai' | 'deepseek' | 'custom';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}) => Promise<{ success: boolean; error?: string }>;
```

### Configuration Flow

1. **Load on Mount**: SettingsScreen calls `loadAIConfig()` on component mount
2. **User Edits**: User modifies provider, API key, model, or base URL
3. **Provider Change**: If provider changes, `handleProviderChange()` updates model/base URL defaults
4. **Save**: User clicks "Save Settings" → calls `handleSaveAIConfig()`
5. **Persistence**: Settings saved to electron-store via IPC → ConfigManager
6. **Validation**: Backend validates API key format (basic checks)
7. **Confirmation**: UI shows success/error alert

### Provider Compatibility

The Base URL field enables compatibility with:

- **OpenAI**: `https://api.openai.com/v1`
- **DeepSeek**: `https://api.deepseek.com/v1`
- **Ollama** (local): `http://localhost:11434/v1`
- **Any OpenAI-compatible API**: Just change the base URL

This makes the system future-proof and allows users to switch providers without code changes.

---

## Implementation Phases

### Phase 1: Test Bundle Architecture ✅ (Completed)

- [x] Modify `SpecGenerator` to create bundle structure
- [x] Generate `.meta.json` with test metadata
- [x] Generate `.meta.md` with fixtures, helpers, locators, and code preview
- [x] Fix import paths for new structure
- [x] Update `bridge.ts` to write all three files

### Phase 2: Forensics Engine (Pending)

- [ ] Create `ErrorGrabber` reporter class
- [ ] Implement `onTestEnd` hook
- [ ] Extract error information (message, stack, location)
- [ ] Save failure JSON to bundle directory
- [ ] Integrate reporter into Playwright config generation
- [ ] Test with various failure scenarios

### Phase 3: RAG Workflow (Pending)

- [ ] Create `RAGService` class
- [ ] Implement retrieval logic (load meta.md and failure.json)
- [ ] Construct LLM prompts with context
- [ ] Implement LLM API client (OpenAI/DeepSeek compatible)
- [ ] Parse and format LLM responses
- [ ] Add UI button "Diagnose with AI"
- [ ] Display diagnosis and fixes in UI

### Phase 4: Settings & Configuration ✅ (Completed)

- [x] Extend ConfigSchema with AI settings
- [x] Add getAIConfig/setAIConfig methods
- [x] Create IPC handlers
- [x] Add UI section with provider selector, API key, model, base URL
- [x] Implement provider change logic with defaults

---

## Future Enhancements

1. **Automatic Fix Application**: Allow AI to directly modify test code
2. **Fix Validation**: Run fixed test automatically to verify solution
3. **Pattern Learning**: Cache common fixes and suggest them for similar errors
4. **Multi-Provider Fallback**: Try multiple providers if one fails
5. **Context Enrichment**: Include trace files, screenshots, and network logs in prompts
6. **Batch Diagnosis**: Diagnose multiple failures at once
7. **Fix History**: Track which fixes were applied and their success rate

---

## Technical Notes

### Why No POMs?

The system explicitly avoids Page Object Models to:
- Reduce abstraction overhead
- Keep tests readable and maintainable
- Enable direct locator inspection
- Simplify AI context extraction

The `.meta.md` file compensates by explicitly documenting all fixtures, helpers, and locators.

### Base URL Strategy

Using a configurable Base URL allows:
- Switching between providers without code changes
- Supporting local LLMs (Ollama, LM Studio)
- Future-proofing for new providers
- Testing with different API endpoints

### Security Considerations

- API keys stored in electron-store (encrypted by Electron)
- Keys never logged or exposed to renderer
- Keys only sent to configured LLM API endpoint
- No key transmission to third-party services

### Performance Considerations

- LLM calls are async and non-blocking
- Large context files (meta.md) may need chunking for very long tests
- Consider rate limiting for API calls
- Cache successful diagnoses to reduce API usage

---

## References

- Playwright Reporter API: https://playwright.dev/docs/test-reporters
- OpenAI API: https://platform.openai.com/docs/api-reference
- DeepSeek API: https://platform.deepseek.com/api-docs/
- Electron Store: https://github.com/sindresorhus/electron-store

