# Assertions System — QA Studio

A complete guide to how assertions work in QA Studio, how they are stored, how the UI interacts with them, and how Playwright code is generated from structured steps.

## 1. Overview

QA Studio's assertion system is 100% UI-driven and data-model based.

Users never edit `.spec.ts` files manually — assertions are defined visually, stored as JSON step objects, and converted into Playwright `expect(...)` statements during code generation.

**Key principles:**

- Assertions are always created/edited from the Step Editor UI.
- The `.spec.ts` file is regenerated from steps every time (never patched manually).
- Assertions integrate with:
  - Playwright auto-retrying matchers
  - ErrorGrabber for failure capture
  - Jira defect creation
  - BrowserStack Test Management

## 2. Assertion Types

Assertion types are defined in the `AssertionKind` union type.

**Supported Playwright matchers:**

| Category | Types |
|----------|-------|
| Text | `toHaveText`, `toContainText` |
| Visibility | `toBeVisible` |
| Page-level | `toHaveURL`, `toHaveTitle` |
| Inputs | `toBeChecked`, `toHaveValue` |
| Attributes | `toHaveAttribute` |

These align with Playwright's auto-retrying web assertions.

## 3. Data Model

Assertions are stored as `RecordedStep` objects with `action: 'assert'`.

```typescript
{
  action: 'assert',
  assertion: AssertionKind,
  targetKind: 'locator' | 'page',
  target?: string,
  expected?: string,        // literal or {{param}}
  customMessage?: string,
  not?: boolean,            // optional inversion
  soft?: boolean            // optional soft assertion
}
```

**Features:**

- **targetKind**
  - `'locator'` → `expect(page.locator(...))`
  - `'page'` → `expect(page)`
- **expected**
  - Supports dynamic parameterization via `{{paramName}}`
- **customMessage**
  - Appended to Playwright expect calls
- **not**
  - Generates `.not.<matcher>()` (negated assertions)
- **soft**
  - Generates `expect.soft(...)` (soft assertions that don't stop the test)

## 4. Workflow

### 4.1 Creating Assertions (UI Driven)

Assertions are added on the Step Editor / Test Script Editor screen.

**Flow:**

1. User selects "Add Assertion" or chooses "Add assertion after this step".
2. The Assertion Editor Modal opens.
3. User selects:
   - Assertion type
   - Target (page or locator)
   - Expected value (if required)
   - Optional: custom message, **not**, **soft**
4. The assertion is added as a `RecordedStep`.

### 4.2 Storage

Assertions are saved in the test's structured JSON definition.

Tests are represented internally as an ordered list of steps (navigation, clicks, fills, assertions, etc.).

### 4.3 Code Generation

During spec generation:

- The generator loops over steps.
- For each assertion step, it produces a Playwright `expect(...)` statement.

**Example:**

```typescript
await expect(
  page.locator('[data-test="status"]'),
  'status should be Submitted'
).toHaveText('Submitted');
```

**Soft assertion:**

```typescript
await expect.soft(page.locator('.error-banner')).not.toBeVisible();
```

### 4.4 Test Execution and Failure Capture

Playwright runs the generated assertions.

If an assertion fails:

- ErrorGrabber parses the failure.
- Extracts assertion type, expected, actual, and locator.
- Adds structured entries to TestRun metadata.

## 5. Implementation Files

| Area | File |
|------|------|
| Types & Models | `src/types/index.ts`, `src/types/v1.5.ts` |
| UI / Assertion Modal | `src/ui/src/components/AssertionEditorModal.tsx` |
| Code Generation | `src/generators/spec-generator.ts` |
| Failure Capture | `src/main/services/reporters/ErrorGrabber.ts` |
| Jira Integration | `src/main/services/jiraService.ts` |
| BrowserStack Test Management | `src/main/services/browserstackTmService.ts` |

## 6. How Assertions Integrate Across QA Studio

### 6.1 BrowserStack Test Management

Assertions appear in:

- Test case descriptions
- Test run results
- Failure summaries

Assertion metadata is included when publishing runs.

### 6.2 Jira Defects

Defects created from failed runs include:

- Assertion type
- Locator or page
- Expected vs actual
- Custom message
- First failure message from run metadata

### 6.3 Error Reporting

ErrorGrabber scans Playwright error messages to extract structured assertion failure data.

## 7. Best Practices

✔ **Use auto-retrying assertions**

These reduce flakiness in Dynamics 365 environments:

- `toHaveText`
- `toBeVisible`
- `toHaveURL`
- `toHaveTitle`

✔ **Add assertions after major steps**

Examples:

- After clicking "Save"
- After confirming a sales order
- After posting or shipment creation

✔ **Use custom messages**

E.g. `"status should transition to Confirmed"`

✔ **Use parameterization**

Assertions with dynamic data: `"Order {{orderNumber}} created"`

✔ **Use soft assertions for non-blocking checks**

Avoids terminating the test early.

## 8. Summary

QA Studio's assertion system provides:

- A UI-first method of defining validations
- A structured JSON representation
- Automated Playwright code generation
- Rich failure capture and integration with Jira + BrowserStack TM
- Zero manual editing of `.spec.ts` files

Assertions are a core feature enabling stable, readable, maintainable automated testing across D365 and e-commerce platforms.
