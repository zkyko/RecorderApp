const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_ROOT = process.argv[2] || '/Users/zk/Documents/QA-Studio/d365-mii4m0bs-vmq7';
const OUTPUT_PATH = path.join(TARGET_ROOT, 'tests', 'd365', 'specs');
const DATA_PATH = path.join(TARGET_ROOT, 'tests', 'd365', 'data');

// Test name templates for professional names
const TEST_NAME_TEMPLATES = [
  'O2C_SalesOrder',
  'WMS_Shipment_Verify',
  'CRM_Lead_Capture',
  'Ecom_Cart_Add',
  'O2C_Invoice_Process',
  'WMS_Inventory_Check',
  'CRM_Contact_Update',
  'Ecom_Checkout_Flow',
  'O2C_Payment_Verify',
  'WMS_Picking_Order',
  'CRM_Account_Create',
  'Ecom_Product_Search',
  'O2C_Quote_Generate',
  'WMS_Receiving_Confirm',
  'CRM_Opportunity_Track',
  'Ecom_Order_Status',
  'O2C_Credit_Memo',
  'WMS_Transfer_Order',
  'CRM_Campaign_Execute',
  'Ecom_Wishlist_Manage',
  'O2C_Return_Process',
  'WMS_Location_Verify',
  'CRM_Case_Resolve',
  'Ecom_Review_Submit',
  'O2C_Discount_Apply',
  'WMS_Label_Print',
  'CRM_Activity_Log',
  'Ecom_Coupon_Apply',
  'O2C_Contract_Create',
  'WMS_Quality_Check'
];

// Status distribution: 20 passed, 5 failed, 5 never_run
const STATUSES = [
  ...Array(20).fill('passed'),
  ...Array(5).fill('failed'),
  ...Array(5).fill('never_run')
];

// Shuffle array function
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random timestamp within last 7 days
function getRandomTimestamp() {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const randomTime = Math.random() * (now - sevenDaysAgo) + sevenDaysAgo;
  return new Date(randomTime).toISOString();
}

// Generate random duration based on status
function getRandomDuration(status) {
  if (status === 'passed') {
    // Passed tests: 30s - 90s (faster)
    return Math.floor(Math.random() * (90 - 30 + 1) + 30);
  } else if (status === 'failed') {
    // Failed tests: either timeout (110s-120s) or crash (5s)
    return Math.random() < 0.5 
      ? Math.floor(Math.random() * (120 - 110 + 1) + 110) // Timeout
      : 5; // Crash
  }
  return 0; // never_run has no duration
}

// Generate random dataset count (1-5)
function getRandomDatasetCount() {
  return Math.floor(Math.random() * 5 + 1);
}

// Generate stability score based on status
function getStabilityScore(status) {
  if (status === 'passed') {
    return 95; // High stability for passed tests
  } else if (status === 'failed') {
    return 40; // Low stability for failed tests
  }
  return null; // never_run has no stability score
}

// Convert test name to kebab-case for folder/file names
function toKebabCase(str) {
  return str
    .replace(/_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

// Generate test name with number suffix
function generateTestName(template, index) {
  if (index < 10) {
    return `${template}_0${index + 1}`;
  }
  return `${template}_${index + 1}`;
}

// Create dummy data file content
function createDataFile(datasetCount, testName) {
  const dataRows = [];
  for (let i = 1; i <= datasetCount; i++) {
    dataRows.push({
      id: String(i),
      enabled: true,
      name: `Test Case ${i}`,
      testCaseId: `${testName}_TC${i}`,
      description: `Test data row ${i} for ${testName}`
    });
  }
  return JSON.stringify(dataRows, null, 2);
}

// Create .meta.json content
function createMetaJson(testName, kebabName, status, datasetCount, dataPath, duration, stability) {
  const createdAt = getRandomTimestamp();
  const meta = {
    testName: testName,
    module: testName.split('_')[0], // Extract module from prefix (O2C, WMS, CRM, Ecom)
    createdAt: createdAt,
    updatedAt: createdAt,
    dataPath: dataPath,
    datasetCount: datasetCount
  };

  if (status !== 'never_run') {
    // Ensure lastRunAt is distributed over the last week (not just now)
    meta.lastRunAt = getRandomTimestamp();
    meta.lastStatus = status;
    meta.duration = duration; // Duration in seconds
    meta.stability = stability; // Stability percentage
  } else {
    meta.lastStatus = 'never_run';
  }

  return JSON.stringify(meta, null, 2);
}

// Create .meta.md content
function createMetaMd(testName) {
  return `# ${testName}

## Test Intent

Verifies the end-to-end flow for ${testName}.

**Module:** ${testName.split('_')[0]}

## Key Locators & Strategy

This test validates the core functionality of the ${testName} process within the D365 Finance & Operations environment.

### Fixtures Used

- \`page\` - Playwright Page fixture
- \`browserStackWorker\` - BrowserStack worker fixture (if applicable)

### Runtime Helpers

Standard D365 wait helpers and navigation utilities are used throughout the test execution.
`;
}

// Create .spec.ts content
function createSpecTs(testName, kebabName, dataFileName) {
  return `import { test, expect } from '@playwright/test';
import data from '../../data/${dataFileName}';

test.describe('${testName} - Data Driven', () => {
  test.setTimeout(120_000); // 2 minutes for D365

  for (const row of data) {
    test(\`\${row.name || row.testCaseId || 'Test'}\`, async ({ page }) => {
      // Test implementation placeholder
      await page.goto('https://fourhands-test.sandbox.operations.dynamics.com/?cmp=FH&mi=DefaultDashboard');
      
      // Add your test steps here
      // await page.getByRole('button', { name: '...' }).click();
    });
  }
});
`;
}

// Main execution
function main() {
  console.log(`Target Root: ${TARGET_ROOT}`);
  console.log(`Output Path: ${OUTPUT_PATH}`);
  console.log(`Data Path: ${DATA_PATH}`);

  // Ensure directories exist
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    console.log(`Created directory: ${OUTPUT_PATH}`);
  }
  
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    console.log(`Created directory: ${DATA_PATH}`);
  }

  // Shuffle statuses for random distribution
  const shuffledStatuses = shuffleArray(STATUSES);

  // Generate 30 test bundles
  console.log('\nGenerating 30 test bundles with enterprise-grade data...\n');

  let totalDatasets = 0;

  for (let i = 0; i < 30; i++) {
    const template = TEST_NAME_TEMPLATES[i];
    const testName = generateTestName(template, i);
    const kebabName = toKebabCase(testName);
    const status = shuffledStatuses[i];
    const bundleDir = path.join(OUTPUT_PATH, kebabName);

    // Generate random dataset count (1-5)
    const datasetCount = getRandomDatasetCount();
    totalDatasets += datasetCount;

    // Create bundle directory
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }

    // Calculate duration and stability once
    const duration = status !== 'never_run' ? getRandomDuration(status) : null;
    const stability = status !== 'never_run' ? getStabilityScore(status) : null;

    // Create data file
    const dataFileName = `${kebabName}Data.json`;
    const dataFilePath = path.join(DATA_PATH, dataFileName);
    const dataContent = createDataFile(datasetCount, testName);
    fs.writeFileSync(dataFilePath, dataContent);

    // Create .meta.json with data path
    const dataPath = `../../data/${dataFileName}`;
    const metaJsonPath = path.join(bundleDir, `${kebabName}.meta.json`);
    fs.writeFileSync(metaJsonPath, createMetaJson(testName, kebabName, status, datasetCount, dataPath, duration, stability));

    // Create .meta.md
    const metaMdPath = path.join(bundleDir, `${kebabName}.meta.md`);
    fs.writeFileSync(metaMdPath, createMetaMd(testName));

    // Create .spec.ts with data import
    const specTsPath = path.join(bundleDir, `${kebabName}.spec.ts`);
    fs.writeFileSync(specTsPath, createSpecTs(testName, kebabName, dataFileName));

    const durationStr = duration !== null ? ` (${duration}s)` : '';
    const stabilityStr = stability !== null ? ` [${stability}%]` : '';
    console.log(`✓ Created bundle ${i + 1}/30: ${kebabName} (${status}${durationStr}${stabilityStr}) - ${datasetCount} dataset(s)`);
  }

  console.log(`\n✅ Successfully created 30 test bundles in ${OUTPUT_PATH}`);
  console.log(`\n📊 Summary:`);
  console.log(`  - Total Datasets: ${totalDatasets}`);
  console.log(`  - Status distribution:`);
  console.log(`    - passed: ${shuffledStatuses.filter(s => s === 'passed').length}`);
  console.log(`    - failed: ${shuffledStatuses.filter(s => s === 'failed').length}`);
  console.log(`    - never_run: ${shuffledStatuses.filter(s => s === 'never_run').length}`);
}

// Run the script
main();

