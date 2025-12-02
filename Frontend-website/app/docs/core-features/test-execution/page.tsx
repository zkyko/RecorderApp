import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Play, Cloud, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestExecutionFlow } from "@/components/docs/TestExecutionFlow";

export default function TestExecutionPage() {
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
            Test Execution
          </h1>
          <p className="text-xl text-zinc-400">
            Complete test execution flow from preparation to results and debugging
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
                Test execution in QA Studio handles the complete lifecycle of running tests, from workspace setup
                to result collection and debugging. It supports both local execution and cloud execution via BrowserStack,
                with comprehensive logging, tracing, and reporting capabilities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Local Execution</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Runs tests locally using Playwright with real-time output streaming
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">BrowserStack</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Cloud execution with automatic config generation and credential management
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Comprehensive Logging</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Traces, screenshots, Allure reports, and failure artifacts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Execution Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <TestExecutionFlow />
            </CardContent>
          </Card>

          {/* Pre-Execution Setup */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Pre-Execution Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">1. Spec Path Resolution</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  The TestRunner intelligently resolves test file paths, handling multiple workspace structures:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>New bundle structure: tests/d365/specs/&lt;TestName&gt;/&lt;TestName&gt;.spec.ts</li>
                  <li>Old module structure: tests/d365/&lt;TestName&gt;/&lt;TestName&gt;.spec.ts</li>
                  <li>Legacy structure: tests/&lt;TestName&gt;.spec.ts</li>
                  <li>Tries multiple file name variations (camelCase, kebab-case, etc.)</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">2. Workspace Configuration</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Ensures workspace has required Playwright configuration:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Creates playwright.config.ts if missing</li>
                  <li>Installs allure-playwright and allure-commandline dependencies</li>
                  <li>Configures Allure reporter for HTML reports</li>
                  <li>Skips browser installation for BrowserStack mode</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">3. Storage State Management</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Copies authentication state to workspace for test execution:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Copies storage_state/d365.json from app data directory</li>
                  <li>Ensures tests can authenticate automatically</li>
                  <li>Handles BrowserStack local testing mode</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">4. Run Metadata Initialization</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Creates run tracking structure:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Generates unique runId (UUID)</li>
                  <li>Creates traces directory: traces/&lt;runId&gt;/</li>
                  <li>Initializes run metadata with status: 'running'</li>
                  <li>Records start time and test name</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Execution Modes */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Execution Modes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  Local Execution
                </h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Runs tests on the local machine using installed Playwright browsers:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Uses workspace playwright.config.ts</li>
                  <li>Runs: npx playwright test --config=playwright.config.ts &lt;specPath&gt;</li>
                  <li>Requires local browser installation (Chromium, Firefox, WebKit)</li>
                  <li>Streams stdout/stderr to UI in real-time via IPC</li>
                  <li>Generates traces and reports in workspace directory</li>
                </ul>
              </div>

              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-violet-400" />
                  BrowserStack Execution
                </h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Runs tests on BrowserStack cloud infrastructure:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Dynamically generates playwright.browserstack.config.ts</li>
                  <li>Sets BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY env vars</li>
                  <li>Enables BROWSERSTACK_LOCAL for storage state access</li>
                  <li>Supports multiple browser/OS targets (chromium-browserstack, firefox-browserstack, etc.)</li>
                  <li>Uses BrowserStack cloud browsers (no local installation needed)</li>
                  <li>Configures project name and build prefix from settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Reporter Integration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Reporter Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">ErrorGrabber Reporter</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Custom Playwright reporter that captures test failures and updates locator status:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Intercepts test.on('test-finished') events</li>
                  <li>Extracts failed locator from error messages</li>
                  <li>Parses locator string to determine type and key</li>
                  <li>Creates _failure.json artifacts with screenshots and context</li>
                  <li>Updates LocatorMaintenanceService to mark failed locators as 'failing'</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Allure Reporter</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Generates comprehensive HTML test reports:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Automatically installed in workspace package.json</li>
                  <li>Generates allure-results/ directory</li>
                  <li>Creates HTML reports with test history</li>
                  <li>Includes screenshots, traces, and failure details</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Post-Execution Results */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Post-Execution Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Run Metadata</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Run information is saved to runs.json:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>runId, testName, specRelPath</li>
                  <li>status: 'running' → 'passed' | 'failed' | 'skipped'</li>
                  <li>startedAt, finishedAt timestamps</li>
                  <li>source: 'local' | 'browserstack'</li>
                  <li>tracePaths array for trace file locations</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Artifacts</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Various artifacts are generated for debugging:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Traces: traces/&lt;runId&gt;/ directory with Playwright trace files</li>
                  <li>Failure artifacts: _failure.json files with screenshots and error context</li>
                  <li>Allure results: allure-results/ directory for HTML report generation</li>
                  <li>Console output: Streamed to UI in real-time</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* UI Feedback */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">UI Feedback & Debugging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The Run screen provides comprehensive feedback and debugging tools:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Console Output</h4>
                  <p className="text-sm text-zinc-400">
                    Real-time streaming of Playwright test output, including logs, errors, and execution details
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Trace Viewer</h4>
                  <p className="text-sm text-zinc-400">
                    Opens Playwright trace viewer for step-by-step debugging with DOM snapshots and network requests
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Allure Report</h4>
                  <p className="text-sm text-zinc-400">
                    Opens HTML test report with test history, failure analysis, and detailed execution information
                  </p>
                </div>
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
                href="/docs/core-features/locator-system"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Locator System
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

