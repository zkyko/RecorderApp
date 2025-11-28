# D365 Auto-Recorder & POM Generator - Complete Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [How the UI Works](#how-the-ui-works)
3. [How Locators Are Extracted](#how-locators-are-extracted)
4. [Parameterization & Data-Driven Testing](#parameterization--data-driven-testing)
5. [Complete Workflow](#complete-workflow)

---

## 🎯 Project Overview

**D365 Auto-Recorder & POM Generator** is a standalone Windows desktop application built with Electron that automates the creation of Playwright test automation code for Microsoft Dynamics 365 Finance & Operations (F&O).

### What It Does
Instead of manually writing Page Object Models (POMs) and test specifications, QA engineers can:
1. **Record** their interactions with D365 in a browser
2. **Automatically generate** production-ready Playwright POM classes
3. **Create** data-driven test specifications
4. **Execute** tests locally or on BrowserStack cloud infrastructure

### Key Technologies
- **Desktop Framework**: Electron v27
- **Frontend**: React + TypeScript
- **Automation Engine**: Playwright v1.40
- **Configuration Storage**: electron-store
- **Build Tool**: electron-builder

---

## 🖥️ How the UI Works

The application has a **React-based UI** with multiple screens that guide users through the recording and test generation process.

### Main UI Components

#### 1. **Setup Screen** (`SetupScreen.tsx`)
**Purpose**: First-run configuration wizard

**What it does**:
- Prompts user to choose a recordings directory (where generated files will be saved)
- Collects D365 URL (e.g., `https://your-org.sandbox.operations.dynamics.com`)
- Handles initial authentication by launching a browser for login
- Saves authentication state (storage state) for future sessions
- Stores all configuration in `electron-store` (persists across app restarts)

**User Flow**:
```
1. User selects recordings directory
2. User enters D365 URL
3. User clicks "Sign in to D365"
4. Browser opens → User logs in → Storage state saved
5. Setup complete → User can start recording
```

#### 2. **Session Setup** (`SessionSetup.tsx`)
**Purpose**: Configure a new recording session

**What it does**:
- Collects **Flow Name** (e.g., "create_sales_order") - used for test file naming
- Collects **Module** (e.g., "sales", "purchasing") - organizes files by module
- Validates D365 URL and authentication state
- Launches browser with saved authentication
- Starts the recording engine

**User Flow**:
```
1. Enter flow name: "create_sales_order"
2. Select module: "sales"
3. Click "Start Recording"
4. Browser opens → Recording begins
```

#### 3. **Recording Panel** (`RecordingPanel.tsx`)
**Purpose**: Real-time display of captured steps during recording

**What it does**:
- Shows live list of recorded steps as user interacts with D365
- Displays step number, description, action type, and page ID
- Provides "Stop Recording" button
- Polls the main process every second to get updated steps

**What gets recorded**:
- **Clicks** on buttons, links, menu items
- **Form inputs** (fill operations)
- **Dropdown selections** (select operations)
- **Page transitions** (for page classification)

**User Flow**:
```
1. User interacts with D365 in browser window
2. Each interaction is captured as a "step"
3. Steps appear in real-time in the Recording Panel
4. User clicks "Stop Recording" when done
```

#### 4. **Step Review** (`StepReview.tsx`)
**Purpose**: Review and edit recorded steps before code generation

**What it does**:
- Displays all recorded steps in order
- Allows editing step descriptions
- Shows locator information for each step
- Provides "Generate Code" button to proceed

**User Flow**:
```
1. Review list of captured steps
2. Optionally edit step descriptions
3. Click "Generate Code" to create POMs and test specs
```

#### 5. **Code Generation** (`CodeGeneration.tsx`)
**Purpose**: Display generated files and their locations

**What it does**:
- Shows list of generated POM files (`.page.ts`)
- Shows generated test spec file (`.generated.spec.ts`)
- Shows generated data file (`.json`) for test data
- Provides file paths for easy access

**Generated Files Structure**:
```
Recordings/
├── pages/
│   └── d365/
│       └── sales/
│           ├── dashboard.page.ts
│           └── sales-order-list.page.ts
└── tests/
    └── d365/
        └── sales/
            ├── createsalesorder.generated.spec.ts
            └── data/
                └── createsalesorderData.json
```

#### 6. **Test Runner** (`TestRunner.tsx`)
**Purpose**: Execute generated tests with data-driven testing

**What it does**:
- Lists all generated test spec files
- Detects parameters from test specs
- Provides data editor (grid/form) for test data
- Allows running tests locally or on BrowserStack
- Shows real-time console output
- Displays test pass/fail status

**User Flow**:
```
1. Select a test spec file from dropdown
2. System detects parameters (e.g., "customerAccount", "itemId")
3. User edits test data in grid (multiple test cases)
4. User clicks "Run Locally" or "Run on BrowserStack"
5. Console shows real-time test execution output
6. Test status (pass/fail) displayed
```

### UI Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  (Node.js - handles file I/O, browser)  │
└─────────────────────────────────────────┘
              ↕ IPC (Inter-Process Communication)
┌─────────────────────────────────────────┐
│         React UI (Renderer Process)      │
│  (React components, user interactions)  │
└─────────────────────────────────────────┘
```

**Communication Flow**:
- UI components call `window.electronAPI.*` methods
- These methods send IPC messages to main process
- Main process executes operations (file I/O, browser control)
- Results sent back to UI via IPC callbacks

---

## 🎯 How Locators Are Extracted

The system uses a **smart locator extraction strategy** that prioritizes stable, maintainable locators specific to D365 F&O.

### Locator Extraction Priority Order

The `LocatorExtractor` class (`src/core/locators/locator-extractor.ts`) follows this priority:

#### 1. **D365-Specific: `data-dyn-controlname`** (Highest Priority)
**Why**: Most stable for D365 F&O controls

**Example**:
```typescript
// Element: <button data-dyn-controlname="NewButton">New</button>
// Generated locator:
page.locator('[data-dyn-controlname="NewButton"]')
```

**When used**: When D365 form controls have the `data-dyn-controlname` attribute (most D365 controls do)

#### 2. **Role + Name: `getByRole()`**
**Why**: Semantic, accessibility-friendly

**Example**:
```typescript
// Element: <button aria-label="New">New</button>
// Generated locator:
page.getByRole('button', { name: 'New' })
```

**When used**: When element has a clear role (button, link, textbox) and accessible name

#### 3. **Label: `getByLabel()`**
**Why**: Works with form labels

**Example**:
```typescript
// Element: <input id="customer" /> <label for="customer">Customer Account</label>
// Generated locator:
page.getByLabel('Customer Account')
```

**When used**: For form inputs with associated labels or `aria-label` attributes

#### 4. **Placeholder: `getByPlaceholder()`**
**Why**: Useful for input fields

**Example**:
```typescript
// Element: <input placeholder="Enter customer account" />
// Generated locator:
page.getByPlaceholder('Enter customer account')
```

#### 5. **Text: `getByText()`**
**Why**: For buttons/links with visible text

**Example**:
```typescript
// Element: <button>Save</button>
// Generated locator:
page.getByText('Save', { exact: true })
```

**Limitations**: Only used for short text (< 80 chars) on interactive elements

#### 6. **Test ID: `data-test-id`**
**Why**: Explicit test identifiers

**Example**:
```typescript
// Element: <div data-test-id="submit-button">Submit</div>
// Generated locator:
page.locator('[data-test-id="submit-button"]')
```

#### 7. **CSS Selector** (Fallback)
**Why**: Last resort when no semantic locators available

**Example**:
```typescript
// Element: <button id="save-btn" class="primary">Save</button>
// Generated locator:
page.locator('#save-btn')  // Prefers ID, then class
```

**Note**: CSS selectors are flagged as potentially fragile

### Locator Extraction Process

When a user clicks or interacts with an element:

1. **Event Capture**: Event listeners capture the click/input event
2. **Element Identification**: System finds the DOM element
3. **Metadata Extraction**: Extracts attributes (aria-label, data-dyn-controlname, role, etc.)
4. **Priority Check**: Tries each locator strategy in priority order
5. **Locator Selection**: Returns first successful locator
6. **Code Generation**: Locator is converted to Playwright code

### Example: Complete Locator Extraction Flow

**User Action**: Clicks "New" button in Sales Order list page

**Step 1 - Element Found**:
```html
<button data-dyn-controlname="NewButton" aria-label="New" class="btn-primary">
  New
</button>
```

**Step 2 - Priority Check**:
1. ✅ `data-dyn-controlname="NewButton"` → **SELECTED** (highest priority)

**Step 3 - Generated Locator Code**:
```typescript
// In POM class
this.newButton = this.contentFrame.locator('[data-dyn-controlname="NewButton"]');
```

**Step 4 - Generated Method**:
```typescript
async clickNew(): Promise<void> {
  await this.waitForNotBusy();
  await this.newButton.click();
  await this.waitForNotBusy();
}
```

### D365-Specific Considerations

#### Frame-Aware Locators
D365 F&O uses iframes extensively. The system generates frame-aware locators:

```typescript
// Uses contentFrame for D365 frame navigation
this.customerAccountInput = this.contentFrame.getByLabel('Customer account');
```

#### Wait Strategies
All generated methods include `waitForNotBusy()` calls to handle D365's asynchronous operations:

```typescript
async fillCustomerAccount(account: string): Promise<void> {
  await this.waitForNotBusy();  // Wait for D365 to be ready
  await this.customerAccountInput.fill(account);
  await this.customerAccountInput.press('Tab');  // Critical for D365 validation
  await this.waitForNotBusy();  // Wait for validation to complete
}
```

---

## 📊 Parameterization & Data-Driven Testing

The system automatically detects which fields should be parameterized and creates data-driven test specifications.

### How Parameters Are Detected

#### 1. **During Recording**
When a user fills a form field or selects a dropdown, the system:
- Records the **action type** (`fill` or `select`)
- Records the **field name** (from label/aria-label)
- Records the **value** entered
- Generates a **method name** (e.g., `fillCustomerAccount`)

**Example Recorded Step**:
```typescript
{
  action: 'fill',
  description: "Fill 'Customer account' = 'US-001'",
  methodName: 'fillCustomerAccount',
  fieldName: 'customerAccountInput',
  value: 'US-001'  // This value will be parameterized
}
```

#### 2. **During Code Generation**
The `SpecGenerator` class (`src/generators/spec-generator.ts`) detects parameters:

```typescript
detectParametersFromSteps(steps: RecordedStep[]): string[] {
  const parameters = new Set<string>();
  
  for (const step of steps) {
    if (step.action === 'fill' || step.action === 'select') {
      // Extract field name from method name
      // "fillCustomerAccount" → "customerAccount"
      const fieldName = this.extractFieldNameFromMethod(step.methodName);
      if (fieldName) {
        parameters.add(fieldName);
      }
    }
  }
  
  return Array.from(parameters).sort();
}
```

**Example Detection**:
- Step: `fillCustomerAccount('US-001')` → Parameter: `customerAccount`
- Step: `selectDeliveryMode('Standard')` → Parameter: `deliveryMode`
- Step: `fillItemId('A0001')` → Parameter: `itemId`

### Generated Test Spec Structure

#### 1. **Test Spec File** (`.generated.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import dataSet from './data/createsalesorderData.json';
import { SalesOrderListPage } from '../../pages/d365/sales/sales-order-list.page';
import { SalesOrderDetailsPage } from '../../pages/d365/sales/sales-order-details.page';

test.describe('Create Sales Order - Data Driven', () => {
  for (const data of dataSet) {
    test(`${data.testCaseId || 'Test'}`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      
      // Attach test data for audit trail
      await testInfo.attach('test-data', {
        body: JSON.stringify(data, null, 2),
        contentType: 'application/json'
      });

      // Navigate to first page
      await SalesOrderListPage.goto(page, { cmp: 'FH' });
      
      // Create page instances
      const salesOrderListPage = new SalesOrderListPage(page);
      const salesOrderDetailsPage = new SalesOrderDetailsPage(page);
      
      // Test steps with data-driven values
      await salesOrderListPage.clickNew();
      await salesOrderDetailsPage.fillCustomerAccount(data.customerAccount);
      await salesOrderDetailsPage.fillItemId(data.itemId);
      await salesOrderDetailsPage.fillQuantity(data.quantity);
      await salesOrderDetailsPage.clickSave();
      
      // TODO: add assertions manually
    });
  }
});
```

**Key Points**:
- Imports JSON data file
- Loops through each data object in the array
- Uses `data.parameterName` to access values
- Each data object creates one test case

#### 2. **Data File** (`.json`)

```json
[
  {
    "testCaseId": "SO-001",
    "customerAccount": "US-001",
    "itemId": "A0001",
    "quantity": "10"
  },
  {
    "testCaseId": "SO-002",
    "customerAccount": "US-002",
    "itemId": "A0002",
    "quantity": "20"
  }
]
```

**Key Points**:
- Array of objects (one per test case)
- Each object has `testCaseId` (for test naming)
- Parameter names match method parameter names (camelCase)

### How Data Is Passed Into Tests

#### 1. **Data File Location**
Data files are stored alongside test specs:
```
Recordings/tests/d365/sales/
├── createsalesorder.generated.spec.ts
└── data/
    └── createsalesorderData.json
```

#### 2. **Parameter Mapping**
The system maps JSON keys to POM method parameters:

**Mapping Logic** (`spec-generator.ts`):
```typescript
// Method: fillCustomerAccount(customerAccount: string)
// JSON key: "customerAccount" (camelCase)
// Usage: data.customerAccount

// The system tries multiple formats:
const possibleKeys = [
  'customerAccount',      // Exact match
  'customer_account',     // Snake case
  'CustomerAccount',      // Pascal case
  'customeraccount'       // Lowercase
];
```

#### 3. **Test Execution Flow**

**When user clicks "Run Locally" or "Run on BrowserStack"**:

1. **Data File Loaded**: System reads JSON data file
2. **Test Execution**: Playwright runs the test spec
3. **Data Iteration**: For each object in the JSON array:
   - Creates a test case with name from `testCaseId`
   - Passes data object to test function
   - Executes test steps with `data.parameterName` values
4. **Results**: Each test case passes or fails independently

**Example Execution**:
```
Test: SO-001
  - customerAccount = "US-001"
  - itemId = "A0001"
  - quantity = "10"
  ✅ PASSED

Test: SO-002
  - customerAccount = "US-002"
  - itemId = "A0002"
  - quantity = "20"
  ✅ PASSED
```

### Test Runner UI - Data Management

The **Test Runner** component provides a visual interface for managing test data:

#### 1. **Parameter Detection**
When a test spec is selected:
- System reads the spec file
- Detects `data.xxx` patterns
- Extracts parameter names
- Displays them in the UI

#### 2. **Data Editor**
- Grid/form interface for editing test data
- One row per test case
- Columns for each parameter
- Add/remove test cases
- Save to JSON file

#### 3. **Data File Management**
- **Auto-backup**: Creates `.bak` file before overwriting
- **Auto-create**: Creates data file if missing
- **Validation**: Ensures JSON structure is valid

### Complete Parameterization Example

**Recording Session**:
1. User fills "Customer account" = "US-001"
2. User fills "Item number" = "A0001"
3. User fills "Quantity" = "10"

**Generated POM Method**:
```typescript
async fillCustomerAccount(customerAccount: string): Promise<void> {
  await this.waitForNotBusy();
  await this.customerAccountInput.fill(customerAccount);
  await this.customerAccountInput.press('Tab');
  await this.waitForNotBusy();
}
```

**Generated Test Spec**:
```typescript
await salesOrderPage.fillCustomerAccount(data.customerAccount);
await salesOrderPage.fillItemNumber(data.itemNumber);
await salesOrderPage.fillQuantity(data.quantity);
```

**Generated Data File**:
```json
[
  {
    "testCaseId": "test-1",
    "customerAccount": "US-001",
    "itemNumber": "A0001",
    "quantity": "10"
  }
]
```

**User Edits Data in Test Runner**:
```json
[
  {
    "testCaseId": "SO-001",
    "customerAccount": "US-001",
    "itemNumber": "A0001",
    "quantity": "10"
  },
  {
    "testCaseId": "SO-002",
    "customerAccount": "US-002",
    "itemNumber": "A0002",
    "quantity": "20"
  }
]
```

**Test Execution**:
- Runs 2 test cases (SO-001 and SO-002)
- Each uses different data values
- Results tracked separately

---

## 🔄 Complete Workflow

### End-to-End User Journey

#### Phase 1: Setup (First Time Only)
1. **Launch Application**
2. **Setup Screen**:
   - Choose recordings directory
   - Enter D365 URL
   - Sign in to D365 (creates storage state)
3. **Setup Complete** → Ready to record

#### Phase 2: Recording
1. **Session Setup**:
   - Enter flow name: "create_sales_order"
   - Select module: "sales"
   - Click "Start Recording"
2. **Browser Opens** (with saved authentication)
3. **User Interacts with D365**:
   - Navigate to Sales Orders
   - Click "New"
   - Fill customer account: "US-001"
   - Fill item: "A0001"
   - Fill quantity: "10"
   - Click "Save"
4. **Recording Panel** shows steps in real-time
5. **Stop Recording** when done

#### Phase 3: Review & Generate
1. **Step Review**:
   - Review captured steps
   - Edit descriptions if needed
2. **Code Generation**:
   - Click "Generate Code"
   - System generates:
     - POM files (`.page.ts`)
     - Test spec (`.generated.spec.ts`)
     - Data file (`.json`)

#### Phase 4: Test Execution
1. **Test Runner**:
   - Select test spec file
   - System detects parameters
2. **Edit Test Data**:
   - Add multiple test cases
   - Fill in parameter values
   - Save data file
3. **Run Tests**:
   - Click "Run Locally" or "Run on BrowserStack"
   - Watch console output
   - View pass/fail status

### File Structure After Generation

```
Recordings/
├── pages/
│   └── d365/
│       └── sales/
│           ├── dashboard.page.ts
│           ├── sales-order-list.page.ts
│           └── sales-order-details.page.ts
└── tests/
    └── d365/
        └── sales/
            ├── createsalesorder.generated.spec.ts
            └── data/
                └── createsalesorderData.json
```

### Generated Code Examples

#### POM Class Example
```typescript
import { Page } from '@playwright/test';
import { D365BasePage } from '../../utils/d365-base';

export class SalesOrderDetailsPage extends D365BasePage {
  static pageId = 'SalesOrderDetailsPage';
  static mi = 'SalesTable';
  static type = 'DetailsPage';

  constructor(page: Page) {
    super(page);
    
    // Locators
    this.customerAccountInput = this.contentFrame.getByLabel('Customer account');
    this.itemNumberInput = this.contentFrame.getByLabel('Item number');
    this.quantityInput = this.contentFrame.getByLabel('Quantity');
    this.saveButton = this.contentFrame.getByRole('button', { name: 'Save' });
  }

  // Actions
  async fillCustomerAccount(customerAccount: string): Promise<void> {
    await this.waitForNotBusy();
    await this.customerAccountInput.fill(customerAccount);
    await this.customerAccountInput.press('Tab');
    await this.waitForNotBusy();
  }

  async fillItemNumber(itemNumber: string): Promise<void> {
    await this.waitForNotBusy();
    await this.itemNumberInput.fill(itemNumber);
    await this.itemNumberInput.press('Tab');
    await this.waitForNotBusy();
  }

  async fillQuantity(quantity: string): Promise<void> {
    await this.waitForNotBusy();
    await this.quantityInput.fill(quantity);
    await this.quantityInput.press('Tab');
    await this.waitForNotBusy();
  }

  async clickSave(): Promise<void> {
    await this.waitForNotBusy();
    await this.saveButton.click();
    await this.waitForNotBusy();
  }
}
```

#### Test Spec Example
```typescript
import { test, expect } from '@playwright/test';
import dataSet from './data/createsalesorderData.json';
import { SalesOrderListPage } from '../../pages/d365/sales/sales-order-list.page';
import { SalesOrderDetailsPage } from '../../pages/d365/sales/sales-order-details.page';

test.describe('Create Sales Order - Data Driven', () => {
  for (const data of dataSet) {
    test(`${data.testCaseId || 'Test'}`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      
      // Attach test data for audit trail
      await testInfo.attach('test-data', {
        body: JSON.stringify(data, null, 2),
        contentType: 'application/json'
      });

      // Navigate to Sales Orders
      await SalesOrderListPage.goto(page, { cmp: 'FH' });
      
      const salesOrderListPage = new SalesOrderListPage(page);
      const salesOrderDetailsPage = new SalesOrderDetailsPage(page);
      
      // Test steps
      await salesOrderListPage.clickNew();
      await salesOrderDetailsPage.fillCustomerAccount(data.customerAccount);
      await salesOrderDetailsPage.fillItemNumber(data.itemNumber);
      await salesOrderDetailsPage.fillQuantity(data.quantity);
      await salesOrderDetailsPage.clickSave();
      
      // TODO: add assertions manually
    });
  }
});
```

---

## 🎓 Key Concepts Summary

### Locator Extraction
- **Priority-based**: Tries most stable locators first
- **D365-aware**: Prioritizes `data-dyn-controlname` for D365 controls
- **Frame-aware**: Uses `contentFrame` for iframe navigation
- **Fallback**: CSS selectors as last resort (flagged as fragile)

### Parameterization
- **Automatic detection**: Identifies `fill` and `select` actions
- **Field name extraction**: Converts method names to parameter names
- **Data-driven tests**: One test case per JSON data object
- **Visual editor**: Test Runner UI for managing test data

### UI Flow
- **Setup** → **Record** → **Review** → **Generate** → **Run**
- Each screen has a specific purpose
- Real-time feedback during recording
- Visual test data management

### Generated Code Quality
- **Semantic method names**: `fillCustomerAccount()` not `fillField1()`
- **D365 patterns**: Includes `waitForNotBusy()` and Tab key presses
- **Type-safe**: TypeScript with proper types
- **Maintainable**: Stable locators reduce breakage

---

## 📚 Additional Resources

- **Main README**: `README.md` - Quick start guide
- **Project Overview**: `PROJECT_OVERVIEW.md` - Architecture details
- **POM Guidelines**: `D365 POM Design Guidelines.md` - Best practices
- **Standalone App Guide**: `STANDALONE_APP_GUIDE.md` - Distribution details

---

**Version**: 1.0.0  
**Last Updated**: 2024

