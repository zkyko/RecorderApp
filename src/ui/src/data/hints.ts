export interface Hint {
  title: string;
  message: string;
}

export const HINTS_BY_ROUTE: Record<string, Hint[]> = {
  dashboard: [
    {
      title: 'Welcome to QA Studio',
      message: 'Start by recording a new test, or browse your existing tests in the Test Library.',
    },
    {
      title: 'Workspace Overview',
      message: 'Your workspace contains all tests, recordings, and generated code. Keep it organized for better test management.',
    },
    {
      title: 'Quick Actions',
      message: 'Use the "Record New Test" button to quickly start capturing a new D365 flow. Review your stats to track test coverage.',
    },
  ],

  library: [
    {
      title: 'Test Organization',
      message: 'Organize your tests by module or feature. Use descriptive test names that clearly indicate what they verify.',
    },
    {
      title: 'Test Management',
      message: 'Click on any test to view details, edit data sets, or run the test. Keep your test library clean and up-to-date.',
    },
    {
      title: 'Test Data',
      message: 'Each test can have multiple data sets. This allows you to run the same test with different inputs for better coverage.',
    },
  ],

  record: [
    {
      title: 'Recording Best Practices',
      message: 'Wait for fields to finish updating before moving to the next action. The recorder captures inputs after 800ms of inactivity.',
    },
    {
      title: 'Tab vs Enter Keys',
      message: 'Press Tab after filling input fields to trigger D365 validation. The generated code automatically includes Tab key presses for proper field validation.',
    },
    {
      title: 'Edit Before Converting',
      message: 'After recording, make sure to edit your steps in the Step Editor before converting them to test scripts. Remove unnecessary steps and verify values.',
    },
    {
      title: 'Avoid Flaky Tests',
      message: 'Complete each action fully before moving to the next one. Wait for page loads and avoid rapid clicking. This ensures reliable test playback.',
    },
    {
      title: 'Recording Engine',
      message: 'You can switch between QA Studio Recorder and Playwright Codegen in Settings. Each has different strengths for different scenarios.',
    },
    {
      title: 'Live Code Preview',
      message: 'Watch the code preview update in real-time as you record. This helps you understand what\'s being captured before you stop recording.',
    },
    {
      title: 'Navigation Steps',
      message: 'The recorder automatically captures page navigation. Review these steps carefully as they define your test\'s starting point.',
    },
    {
      title: 'Locator Health',
      message: 'After recording, check the locator health summary. Green locators are most stable, while red ones may cause flaky tests.',
    },
  ],

  stepEditor: [
    {
      title: 'Step Review',
      message: 'Review each recorded step carefully. Delete any unnecessary actions like accidental clicks or duplicate steps.',
    },
    {
      title: 'Edit Values',
      message: 'Click the edit icon to modify field values before generating the test. This ensures your test data is correct.',
    },
    {
      title: 'Parameterize Fields',
      message: 'Use the "Parameterize" button on fill/select steps to mark them for data-driven testing. These will become test parameters.',
    },
    {
      title: 'Step Order Matters',
      message: 'Steps execute in order. Make sure the sequence matches your intended workflow. Delete or reorder steps as needed.',
    },
    {
      title: 'Clean Up Before Continuing',
      message: 'Take time to clean up steps before moving to locator cleanup. Well-organized steps lead to better generated code.',
    },
  ],

  locatorCleanup: [
    {
      title: 'Locator Stability',
      message: 'Prioritize stable locators like getByRole, getByLabel, and data-dyn-controlname. These are less likely to break when the UI changes.',
    },
    {
      title: 'Avoid Fragile Selectors',
      message: 'Replace CSS selectors with nth-child, IDs, or complex paths with more semantic locators. These break easily when the DOM changes.',
    },
    {
      title: 'D365-Specific Locators',
      message: 'For D365, data-dyn-controlname attributes are the most stable. Use these whenever available for better test reliability.',
    },
    {
      title: 'Test Your Locators',
      message: 'After updating locators, run a quick test to verify they work. Broken locators are a common cause of flaky tests.',
    },
    {
      title: 'Locator Strategy',
      message: 'Good: getByRole, getByLabel, data-dyn-controlname. Medium: getByText. Bad: CSS with nth-child, IDs, or complex selectors.',
    },
  ],

  parameterMapping: [
    {
      title: 'Parameter Naming',
      message: 'Use descriptive parameter names that clearly indicate what they represent. Good names make tests easier to understand and maintain.',
    },
    {
      title: 'Test Data Sets',
      message: 'Create multiple data sets with different values to test various scenarios. This increases test coverage without writing new tests.',
    },
    {
      title: 'Parameter Best Practices',
      message: 'Parameterize values that change between test runs (like customer numbers, item IDs). Keep static configuration values hardcoded.',
    },
    {
      title: 'Data Validation',
      message: 'Ensure your parameter values match expected formats. D365 fields often have specific validation rules that must be satisfied.',
    },
  ],

  runs: [
    {
      title: 'Test Execution',
      message: 'Monitor test runs to identify failures quickly. Use the trace viewer to debug issues and understand what went wrong.',
    },
    {
      title: 'Run History',
      message: 'Keep track of test run history to identify trends. Frequent failures might indicate flaky tests or environmental issues.',
    },
    {
      title: 'Debugging Failed Tests',
      message: 'Click on a failed test run to view detailed traces. The trace viewer shows exactly what happened during test execution.',
    },
    {
      title: 'Retry Logic',
      message: 'Some test failures are transient. Review the failure reason - network issues or timing problems might resolve on retry.',
    },
  ],

  report: [
    {
      title: 'Test Reports',
      message: 'Review test reports to understand overall test health. Look for patterns in failures to identify systemic issues.',
    },
    {
      title: 'Report Analysis',
      message: 'Use reports to track test metrics over time. Trends in pass/fail rates help identify areas that need attention.',
    },
    {
      title: 'Trace Integration',
      message: 'Reports link to detailed traces for each test run. Use these to understand exactly what happened during execution.',
    },
  ],

  locators: [
    {
      title: 'Locator Management',
      message: 'This screen shows all locators used in your tests. Review and update them to maintain test stability as the UI evolves.',
    },
    {
      title: 'Shared Locators',
      message: 'Common locators are shared across tests. Update them once here, and all tests using them will benefit from the improvement.',
    },
    {
      title: 'Locator Health',
      message: 'Monitor locator health across your test suite. Replace fragile locators proactively to prevent future test failures.',
    },
  ],

  settings: [
    {
      title: 'Configuration',
      message: 'Configure your D365 URL, workspace path, and recording preferences. These settings affect how tests are recorded and executed.',
    },
    {
      title: 'Recording Engine',
      message: 'Choose between QA Studio Recorder (custom) and Playwright Codegen. Each engine has different capabilities and use cases.',
    },
    {
      title: 'Workspace Settings',
      message: 'Your workspace path determines where tests, recordings, and generated code are stored. Keep this organized for better management.',
    },
    {
      title: 'Authentication',
      message: 'Configure authentication settings to ensure tests can log into D365. Store credentials securely for automated test runs.',
    },
  ],
};
