import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Database, Code, FileJson } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParameterizationFlow } from "@/components/docs/ParameterizationFlow";

export default function ParameterizationPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs/core-features"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Core Features
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Parameterization
          </h1>
          <p className="text-xl text-zinc-400">
            How test data parameters are detected, mapped, and injected into test code
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
                Parameterization transforms hardcoded values in recorded tests into data-driven parameters,
                allowing the same test to run with multiple data scenarios. QA Studio uses AST parsing to
                intelligently detect parameterizable values and provides a user-friendly interface for mapping
                them to test data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">AST-Based Detection</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Uses TypeScript AST parsing to find fill() and selectOption() calls with string literals
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Context-Aware</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Extracts field labels from surrounding code context (getByRole, getByLabel)
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileJson className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Data-Driven</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Generates JSON data files and wraps test code in data-driven loop
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parameterization Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Parameterization Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <ParameterizationFlow />
            </CardContent>
          </Card>

          {/* Detection Process */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Detection Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">1. AST Parsing</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  The ParameterDetector uses ts-morph to parse the cleaned TypeScript code into an Abstract Syntax Tree (AST).
                </p>
                <div className="text-xs text-zinc-500 space-y-1 font-mono bg-zinc-900/50 p-3 rounded">
                  <div>• Creates a Project and SourceFile from cleaned code</div>
                  <div>• Walks the AST using forEachDescendant()</div>
                  <div>• Finds all CallExpression nodes</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">2. Method Identification</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Identifies calls to .fill() and .selectOption() methods, handling both direct and chained calls.
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>• Checks PropertyAccessExpression for method names</div>
                  <div>• Handles chained calls: page.getByRole(...).fill(...)</div>
                  <div>• Extracts the last argument (the value parameter)</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">3. Value Extraction</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Only processes StringLiteral nodes (hardcoded string values), ignoring variables and expressions.
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>• Filters for Node.isStringLiteral()</div>
                  <div>• Removes quotes (handles both 'value' and "value")</div>
                  <div>• Stores original value for mapping</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">4. Label Extraction</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Analyzes surrounding code context to extract field labels from locator selectors.
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>• Looks for getByRole('combobox', { name: '...' }) → extracts name</div>
                  <div>• Looks for getByLabel('...') → uses label directly</div>
                  <div>• Falls back to generic "Field" if no label found</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">5. Name Generation</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Generates camelCase parameter names from field labels.
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>• Converts "Customer account" → "customerAccount"</div>
                  <div>• Handles special characters and spaces</div>
                  <div>• Ensures valid JavaScript identifier</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Mapping */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">User Mapping Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                After detection, users review and select which values to parameterize:
              </p>
              
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Parameter Mapping Screen</h4>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Displays all detected candidates with label, original value, and suggested name</li>
                  <li>User can select/deselect which values to parameterize</li>
                  <li>User can rename parameter names before mapping</li>
                  <li>Creates a Map&lt;originalValue, paramName&gt; for code replacement</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Data Editor Screen</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  After mapping, users can add/edit test data rows:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Creates initial data file with one row (using original values)</li>
                  <li>User can add multiple rows for different scenarios</li>
                  <li>Data is saved to tests/d365/data/&lt;TestName&gt;Data.json</li>
                  <li>Supports editing existing rows and adding new columns</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Code Replacement */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Code Replacement & Data Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Code Replacement</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  During spec generation, hardcoded values are replaced with row.paramName references:
                </p>
                <div className="space-y-2">
                  <div className="text-xs font-mono bg-zinc-900/50 p-2 rounded text-zinc-300">
                    <div className="text-zinc-500 mb-1">Before:</div>
                    <div>{`await page.getByRole('combobox', { name: 'Customer account' }).fill('100001')`}</div>
                  </div>
                  <div className="text-xs font-mono bg-zinc-900/50 p-2 rounded text-zinc-300">
                    <div className="text-zinc-500 mb-1">After:</div>
                    <div>{`await page.getByRole('combobox', { name: 'Customer account' }).fill(row.customerAccount)`}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Data File Structure</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Data files are stored as JSON arrays, with each object representing one test execution:
                </p>
                <div className="text-xs font-mono bg-zinc-900/50 p-3 rounded text-zinc-300">
                  {`[
  {
    "id": "scenario-1",
    "customerAccount": "100001",
    "orderType": "Standard"
  },
  {
    "id": "scenario-2",
    "customerAccount": "100002",
    "orderType": "Express"
  }
]`}
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Test Execution Structure</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Generated test code wraps execution in a data-driven loop:
                </p>
                <div className="text-xs font-mono bg-zinc-900/50 p-3 rounded text-zinc-300">
                  {`test('test', async ({ page }) => {
  const data = require('./TestNameData.json');
  for (const row of data) {
    // Test steps use row.customerAccount, row.orderType, etc.
    await page.goto(...);
    await page.getByRole(...).fill(row.customerAccount);
    // ... rest of test steps
  }
});`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regeneration Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Regeneration & Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Users can regenerate tests to update parameters or add new ones:
              </p>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Regeneration Process</h4>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>User clicks "Regenerate" on an existing test</li>
                  <li>System loads existing spec content</li>
                  <li>Navigates back to Parameter Mapping screen with existing test name</li>
                  <li>Re-runs parameter detection on current code</li>
                  <li>User can add/remove/modify parameters</li>
                  <li>Existing data file is preserved and can be edited</li>
                </ol>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Data File Path</h4>
                <p className="text-sm text-zinc-400">
                  Data files are stored at: <code className="text-blue-400 bg-zinc-900/50 px-1 rounded">workspacePath/tests/d365/data/&lt;TestName&gt;Data.json</code>
                </p>
                <p className="text-sm text-zinc-400 mt-2">
                  This path is consistent across DataWriter, SpecWriter, and IPC handlers for reliable data persistence.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/core-features/studio-recorder"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Studio Recorder
              </Link>
              <Link
                href="/docs/core-features/test-execution"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Test Execution
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

