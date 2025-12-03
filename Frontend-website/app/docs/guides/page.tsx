import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Play, FileText, Database, Bug, Cloud, Settings, CheckSquare, Globe, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrichedText } from "@/components/docs/EnrichedText";

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            User Guides
          </h1>
          <p className="text-xl text-zinc-400">
            Step-by-step guides to help you get the most out of QA Studio
          </p>
        </div>

        <div className="space-y-8">
          {/* Getting Started */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Getting Started</CardTitle>
                  <CardDescription>Initial setup and configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">1. Launch QA Studio</h4>
                  <p className="text-sm text-zinc-400">
                    Open the application. On first launch, you'll be prompted to configure your environment.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">2. Select Your Workspace</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Choose your target <EnrichedText text="workspace" /> from the workspace selector:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li><strong className="text-white">D365 Workspace</strong> - For Microsoft Dynamics 365 Finance & Operations</li>
                    <li><strong className="text-white">Web Demo Workspace</strong> - For testing and demonstrations</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">3. Configure Settings</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Open <strong className="text-white">Settings</strong> and configure:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li><strong className="text-white">D365 URL</strong> - Your Finance & Operations environment URL</li>
                    <li><strong className="text-white">Authentication</strong> - Sign in to D365 (authentication state is saved)</li>
                    <li><strong className="text-white">Default Module</strong> - Choose your primary module (e.g., Sales, Warehouse)</li>
                    <li><strong className="text-white">BrowserStack Credentials</strong> - For cloud test execution (optional)</li>
                    <li><strong className="text-white">Jira Integration</strong> - For defect creation (optional)</li>
                    <li><strong className="text-white">AI Provider</strong> - Configure LLM for debugging features (optional)</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">4. Verify Dependencies</h4>
                  <p className="text-sm text-zinc-400">
                    Check the Diagnostics panel to ensure Playwright browsers are installed and all services are reachable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recording a Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Recording Your First Flow</CardTitle>
                  <CardDescription>Capture user interactions and generate test code</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">1. Start Recording</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Click <strong className="text-white">Start Recording</strong> from the main screen. Enter:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li><strong className="text-white">Flow Name</strong> - Descriptive name (e.g., "Create Sales Order")</li>
                    <li><strong className="text-white">Module</strong> - Target module (e.g., Sales, Warehouse)</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">2. Interact with Your Application</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    QA Studio launches an embedded browser window. Interact with your D365 application normally. The recorder automatically captures:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Clicks, form fills, and selections</li>
                    <li>Navigation events and page transitions</li>
                    <li>Dynamic iframe interactions</li>
                    <li>D365-specific heuristics for stable <EnrichedText text="locators" /></li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">3. Add Assertions (Optional)</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Use the mini-toolbar or step editor to insert assertions. The <EnrichedText text="Assertion Engine" /> supports:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Locator-level checks (toHaveText, toBeVisible, etc.)</li>
                    <li>Page-level checks (toHaveURL, toHaveTitle)</li>
                    <li><EnrichedText text="Parameterized" /> expected values using {'{{param}}'} syntax</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">4. Stop Recording</h4>
                  <p className="text-sm text-zinc-400">
                    Click <strong className="text-white">Stop Recording</strong> when done. The captured steps are automatically processed and ready for code generation.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">5. Review and Refine</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    In the <strong className="text-white">Step Editor</strong>, you can:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Review all captured steps with metadata</li>
                    <li>Add, delete, or reorder steps</li>
                    <li>Edit <EnrichedText text="locators" /> and add assertions</li>
                    <li>Clean up redundant navigation steps</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">6. Generate Code</h4>
                  <p className="text-sm text-zinc-400">
                    Click <strong className="text-white">Generate Spec</strong> to create Playwright test files. The <EnrichedText text="SpecGenerator" /> produces:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Executable <code className="text-blue-400 bg-zinc-800 px-1 rounded">.spec.ts</code> files</li>
                    <li>Page Object Model classes (if applicable)</li>
                    <li>Metadata files (.meta.json, .meta.md)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adding Assertions */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Adding Assertions</CardTitle>
                  <CardDescription>Validate test outcomes with the Assertion Engine</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The <EnrichedText text="Assertion Engine" /> allows you to add validations directly in your test flows. Assertions can be added during recording or in the step editor.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-white mb-2">During Recording</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Use the mini-toolbar to insert assertions</li>
                    <li>Select target element or page</li>
                    <li>Choose assertion type</li>
                    <li>Enter expected value</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-white mb-2">In Step Editor</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Click "Add Assertion" button</li>
                    <li>Select assertion type from dropdown</li>
                    <li>Pick target (locator or page)</li>
                    <li>Enter expected value or use {'{{param}}'}</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Parameterized Assertions</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  Use <EnrichedText text="parameterized" /> assertions to drive expected values from <EnrichedText text="test data" />:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                  <li>Enter {'{{param}}'} in the expected value field</li>
                  <li>The parameter name should match a column in your test data file</li>
                  <li>At runtime, {'{{param}}'} is replaced with <code className="text-blue-400 bg-zinc-800 px-1 rounded">row.param</code></li>
                  <li>Enables <EnrichedText text="data-driven" /> testing with multiple scenarios</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Managing Test Data */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Managing Test Data</CardTitle>
                  <CardDescription>Create data-driven tests with multiple scenarios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">1. Create Test Data File</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Create a JSON or Excel file with your test data. Each row represents a test scenario:
                  </p>
                  <div className="p-3 bg-zinc-900 rounded font-mono text-xs text-zinc-300 mt-2">
                    <pre>{`{
  "scenarios": [
    {
      "customerName": "Acme Corp",
      "orderAmount": "1000",
      "status": "Submitted"
    },
    {
      "customerName": "Tech Solutions",
      "orderAmount": "2500",
      "status": "Pending"
    }
  ]
}`}</pre>
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">2. Import Test Data</h4>
                  <p className="text-sm text-zinc-400">
                    In the test details view, click <strong className="text-white">Import Data</strong> and select your file. QA Studio automatically detects parameters.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">3. Map Parameters</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    QA Studio automatically detects parameters in your recorded steps. You can:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Review detected parameters</li>
                    <li>Manually map parameters to data columns</li>
                    <li>Add new parameters for assertions</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">4. Run Data-Driven Tests</h4>
                  <p className="text-sm text-zinc-400">
                    When you run the test, it executes once for each row in your data file. Each execution uses the corresponding data values, enabling comprehensive <EnrichedText text="data-driven" /> testing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Running Tests */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Running Tests</CardTitle>
                  <CardDescription>Execute tests locally or in the cloud</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <h4 className="font-semibold text-white mb-2">Local Execution</h4>
                  <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                    <li>Select test from Test Library</li>
                    <li>Click <strong className="text-white">Run Locally</strong></li>
                    <li>View streaming output in real-time</li>
                    <li>Check results, traces, and screenshots</li>
                  </ol>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">BrowserStack Execution</h4>
                  <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                    <li>Configure <EnrichedText text="BrowserStack Automate" /> credentials in Settings</li>
                    <li>Select test and click <strong className="text-white">Run on BrowserStack</strong></li>
                    <li>Choose browser/OS combination</li>
                    <li>Monitor execution in BrowserStack dashboard</li>
                    <li>View results and session recordings</li>
                  </ol>
                </div>
              </div>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Viewing Results</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  After execution, you can view:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                  <li><strong className="text-white">Run Summary</strong> - Pass/fail status, duration, assertion results</li>
                  <li><strong className="text-white">Execution Logs</strong> - Detailed console output with timestamps</li>
                  <li><strong className="text-white">Trace Viewer</strong> - Step-through execution with DOM snapshots</li>
                  <li><strong className="text-white">Screenshots/Videos</strong> - Visual evidence of test execution</li>
                  <li><strong className="text-white">Performance Metrics</strong> - Execution time and resource usage</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Debugging */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Bug className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">AI-Powered Debugging</CardTitle>
                  <CardDescription>Get intelligent failure analysis and fix suggestions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">1. Configure AI Provider</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    In <strong className="text-white">Settings → AI Debugging</strong>, configure:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Provider (OpenAI, DeepSeek, or Custom)</li>
                    <li>API Key</li>
                    <li>Model name (e.g., gpt-4, gpt-3.5-turbo)</li>
                    <li>Base URL (for custom providers)</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">2. Diagnose Failed Test</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    When a test fails, navigate to the test details view and click <strong className="text-white">✨ Diagnose with AI</strong>. The <EnrichedText text="RAG" /> system:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Analyzes the test code (.spec.ts)</li>
                    <li>Reviews failure logs and error messages</li>
                    <li>Examines test metadata and context</li>
                    <li>Provides root cause analysis</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">3. Get Fix Suggestions</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    The AI assistant provides:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside ml-4">
                    <li>Explanation of why the test failed</li>
                    <li>Specific fix suggestions with code examples</li>
                    <li>Context-aware recommendations</li>
                    <li>Interactive chat for follow-up questions</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-zinc-400">
                    The <EnrichedText text="RAG" /> system uses the test bundle architecture (.spec.ts + .meta.json + .meta.md) to provide context-aware suggestions. Make sure your tests are properly generated to get the best results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Integrations */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Enterprise Integrations</CardTitle>
                  <CardDescription>BrowserStack TM and Jira integration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">BrowserStack Test Management</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Sync your tests to <EnrichedText text="BrowserStack Test Management" />:
                  </p>
                  <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                    <li>Configure TM Project ID in Settings</li>
                    <li>Test cases are automatically created/updated</li>
                    <li>Run results sync with assertion details</li>
                    <li>View test health in BrowserStack TM dashboard</li>
                  </ol>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">Jira Defect Creation</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Create defects from failed tests with <EnrichedText text="Jira Integration" />:
                  </p>
                  <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                    <li>Configure Jira credentials in Settings</li>
                    <li>Click <strong className="text-white">Create Jira Defect</strong> on failed test</li>
                    <li>Review pre-filled defect details</li>
                    <li>Edit and submit - defect is created with all context</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Workspace Usage */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Multi-Workspace Usage</CardTitle>
                  <CardDescription>Switch between different platform workspaces</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                QA Studio supports multiple <EnrichedText text="workspaces" />, each with its own configuration, flows, and data files. Switch between workspaces seamlessly:
              </p>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Switching Workspaces</h4>
                <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                  <li>Use the <strong className="text-white">Workspace Selector</strong> in the sidebar or header</li>
                  <li>Select your target workspace (D365, Web Demo, etc.)</li>
                  <li>QA Studio automatically loads workspace-specific:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li>Flows and test files</li>
                      <li>Data files</li>
                      <li>Configuration (baseUrl, module settings)</li>
                      <li>Locator library</li>
                    </ul>
                  </li>
                  <li>All features (recorder, editor, execution) work identically across workspaces</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Best Practices</CardTitle>
                  <CardDescription>Tips for effective test automation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-emerald-500/30">
                  <h4 className="font-semibold text-white mb-2">Recording</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Record the "happy path" first, then add validations</li>
                    <li>Keep recordings scoped (&lt;30 steps) for readability</li>
                    <li>Use clear, descriptive flow names</li>
                    <li>Review and clean up steps before generating code</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-emerald-500/30">
                  <h4 className="font-semibold text-white mb-2">Test Organization</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Group related tests by module or feature</li>
                    <li>Reuse <EnrichedText text="locators" /> across tests via Locator Library</li>
                    <li>Use <EnrichedText text="parameterization" /> for multiple scenarios</li>
                    <li>Commit both code and metadata to version control</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-emerald-500/30">
                  <h4 className="font-semibold text-white mb-2">Assertions</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Add assertions at key validation points</li>
                    <li>Use <EnrichedText text="parameterized" /> assertions for <EnrichedText text="data-driven" /> validation</li>
                    <li>Include custom messages for better failure context</li>
                    <li>Test both positive and negative scenarios</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-emerald-500/30">
                  <h4 className="font-semibold text-white mb-2">Maintenance</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Monitor <EnrichedText text="locator" /> health in Locator Library</li>
                    <li>Update failing <EnrichedText text="locators" /> promptly</li>
                    <li>Review test results regularly</li>
                    <li>Use AI debugging for complex failures</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/getting-started"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Getting Started
              </Link>
              <Link
                href="/docs/core-features"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Core Features
              </Link>
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Architecture
              </Link>
              <Link
                href="/docs/advanced/assertion-engine"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Assertion Engine
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
