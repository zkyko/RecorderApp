import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Code2, Database, FileText, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrichedText } from "@/components/docs/EnrichedText";

export default function AssertionEnginePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs/advanced"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advanced Docs
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Assertion Engine Architecture
            </h1>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              v2.0
            </Badge>
          </div>
          <p className="text-xl text-zinc-400">
            Universal assertion support integrated into flows and code generation
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The <EnrichedText text="Assertion Engine" /> provides first-class assertion support that works across all <EnrichedText text="workspaces" />. 
                Assertions are integrated into the flow model, step editor, and code generation pipeline, 
                enabling <EnrichedText text="data-driven" /> validation with <EnrichedText text="parameterized" /> expected values.
              </p>
              <ul className="space-y-2 text-zinc-300 list-disc list-inside">
                <li><strong className="text-white">Workspace-agnostic design</strong> - Works with D365, Web Demo, and future workspaces</li>
                <li><strong className="text-white">Parameterized assertions</strong> - Use {'{{param}}'} syntax to drive expected values from test data</li>
                <li><strong className="text-white">Locator and page-level checks</strong> - Support for both element assertions and page-level validations</li>
                <li><strong className="text-white">Visual editor integration</strong> - Add assertions directly in the step editor UI</li>
              </ul>
            </CardContent>
          </Card>

          {/* Assertion Types */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Supported Assertion Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-white mb-2">Text Assertions</h4>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• toHaveText - Exact text match</li>
                    <li>• toContainText - Partial text match</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">Visibility Assertions</h4>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• toBeVisible - Element visibility check</li>
                    <li>• toBeChecked - Checkbox/radio state</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <h4 className="font-semibold text-white mb-2">Value Assertions</h4>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• toHaveValue - Input field value</li>
                    <li>• toHaveAttribute - Element attribute</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <h4 className="font-semibold text-white mb-2">Page Assertions</h4>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    <li>• toHaveURL - Page URL validation</li>
                    <li>• toHaveTitle - Page title check</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow Model Integration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Flow Model Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Assertions are represented as <code className="text-blue-400 bg-zinc-800 px-1 rounded">AssertStep</code> in the flow model:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`interface AssertStep extends BaseStep {
  type: 'assert';
  assertion: AssertionKind;
  targetKind: 'locator' | 'page';
  target: string;      // POM locator name or 'page'
  expected?: string;   // literal or {{param}}
  customMessage?: string;
}`}</pre>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">targetKind: 'locator'</h4>
                  <p className="text-sm text-zinc-400">
                    Assertions against specific elements using locators from the Page Object Model. 
                    The target field references a locator name (e.g., "orderStatus", "submitButton").
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">targetKind: 'page'</h4>
                  <p className="text-sm text-zinc-400">
                    Page-level assertions for URL and title validation. The target field is set to "page".
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Parameterized Expected Values</h4>
                  <p className="text-sm text-zinc-400">
                    Use <code className="text-blue-400 bg-zinc-800 px-1 rounded">{'{{param}}'}</code> syntax in the expected field 
                    to drive assertions from test data. The SpecGenerator resolves these at code generation time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Generation */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Code Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The SpecGenerator processes AssertStep entries and emits Playwright expect() calls:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// Locator assertion with parameterized value
await expect(page.locator(pom.orderStatus))
  .toHaveText(row.status);

// Page-level assertion
await expect(page).toHaveURL(
  'https://example.com/orders'
);

// Assertion with custom message
await expect(page.locator(pom.submitButton), 
  'Submit button should be visible'
).toBeVisible();`}</pre>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Locator Resolution</h4>
                  <p className="text-sm text-zinc-400">
                    When targetKind is 'locator', the generator resolves the locator from the POM using the target field. 
                    The locator is then used in the expect() call.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Parameter Resolution</h4>
                  <p className="text-sm text-zinc-400">
                    If expected contains <code className="text-blue-400 bg-zinc-800 px-1 rounded">{'{{param}}'}</code>, 
                    it's replaced with <code className="text-blue-400 bg-zinc-800 px-1 rounded">row.param</code> from the test data file.
                  </p>
                </div>
                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Custom Messages</h4>
                  <p className="text-sm text-zinc-400">
                    Custom messages are injected as the second parameter to expect(), providing better failure context in test reports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Editor Integration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Step Editor Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The assertion editor is integrated into the step editor UI, allowing users to add assertions visually:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Assertion Dropdown</h4>
                  <p className="text-sm text-zinc-400">
                    Select from available assertion types (toHaveText, toContainText, toBeVisible, etc.) 
                    based on the target kind.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Target Picker</h4>
                  <p className="text-sm text-zinc-400">
                    Choose from existing locators in the POM or select "Page" for page-level assertions.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Expected Value Input</h4>
                  <p className="text-sm text-zinc-400">
                    Enter literal values or use <code className="text-blue-400 bg-zinc-800 px-1 rounded">{'{{param}}'}</code> 
                    syntax for parameterized assertions.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Custom Message</h4>
                  <p className="text-sm text-zinc-400">
                    Optional descriptive message that appears in test failure reports for better debugging context.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run Metadata */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Run Metadata & Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                When tests fail, assertion metadata is captured in run summaries for integration with BrowserStack TM and Jira:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`{
  "assertions": [
    {
      "stepId": "step-5",
      "assertion": "toHaveText",
      "expected": "Submitted",
      "actual": "Pending",
      "passed": false,
      "message": "Order status should be Submitted"
    }
  ]
}`}</pre>
              </div>

              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Integration Points</h4>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>BrowserStack TM receives assertion results in test run payloads</li>
                  <li>Jira defects include assertion failure details in repro steps</li>
                  <li>Test reports show assertion pass/fail status per step</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Architecture Overview
              </Link>
              <Link
                href="/docs/advanced/enterprise-integrations"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Enterprise Integrations
              </Link>
              <Link
                href="/docs/core-features"
                className="px-4 py-2 border border-green-500/50 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Core Features
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

