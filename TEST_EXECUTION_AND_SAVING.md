# Test Execution and Saving - Implementation Details

## Where Tests Are Saved

Tests are saved in your **workspace directory** (not the QA Studio app directory):

```
<workspace>/
  tests/
    <TestName>.spec.ts      ← Test spec file
    <TestName>.meta.json     ← Test metadata
  data/
    <TestName>.json          ← Test data (parameters)
  storage_state/
    d365.json                ← Authentication state
```

**Default workspace location:**
- Windows: `Documents/QA-Studio`
- Or wherever you configured it during setup

## How Tests Are Executed

When you click "Run" on a test:

1. **Test file is copied** from workspace to project directory:
   - From: `<workspace>/tests/<TestName>.spec.ts`
   - To: `<project-root>/Recordings/tests/<TestName>.spec.ts`

2. **Data file is copied** (if referenced):
   - From: `<workspace>/data/<TestName>.json`
   - To: `<project-root>/Recordings/data/<TestName>.json`

3. **Storage state is copied**:
   - From: `<workspace>/storage_state/d365.json`
   - To: `<project-root>/storage_state/d365.json`

4. **Playwright test runs** from project root:
   ```bash
   npx playwright test Recordings/tests/<TestName>.spec.ts
   ```

5. **Results are streamed** back to QA Studio UI in real-time

## Why This Design?

- **Workspace**: Your tests live here (portable, version-controllable)
- **Project Root**: Where Playwright is installed and configured
- **Copy on Run**: Ensures tests run with the correct Playwright config and dependencies

## Generate Test Button

The "Generate Test" button is now **always enabled** when you enter a test name.

- **Before**: Required both test name AND at least one parameter selected
- **After**: Only requires test name (parameters are optional)

If no parameters are selected, the test will be generated with hardcoded values from the codegen output.

## Code Preview Not Showing?

If the code preview shows "Waiting for codegen output...":

1. **Check file watcher**: The service watches `<workspace>/tmp/codegen-output.ts`
2. **Polling fallback**: Added 1-second polling as backup if file watcher misses changes
3. **Check console**: Look for `[CodegenService]` logs in Electron console
4. **Verify file exists**: Check if `<workspace>/tmp/codegen-output.ts` is being created

**Debug steps:**
- Open Electron DevTools (if enabled)
- Check console for `[CodegenService]` messages
- Verify the tmp directory exists in your workspace
- Check that Playwright Codegen is actually writing to the file

## Test File Structure

Generated test files look like:

```typescript
import { test } from '@playwright/test';
import data from '../data/SalesOrder.json';

test.describe('Sales Order - Data Driven', () => {
  for (const row of data) {
    test(`${row.name || row.id || 'Test'}`, async ({ page }) => {
      test.setTimeout(120_000); // 2 minutes for D365

      // Your recorded actions here
      await page.goto('https://...');
      await page.getByRole('button', { name: '...' }).click();
      // etc.
    });
  }
});
```

## Running Tests Manually

You can also run tests manually from the command line:

```bash
# From the QA Studio project root
npx playwright test Recordings/tests/<TestName>.spec.ts
```

Make sure:
- Tests are copied to `Recordings/tests/`
- Data files are in `Recordings/data/`
- Storage state is in `storage_state/d365.json`

