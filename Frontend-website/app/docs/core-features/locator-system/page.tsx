import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Crosshair, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocatorSystemFlow } from "@/components/docs/LocatorSystemFlow";

export default function LocatorSystemPage() {
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
            Locator System
          </h1>
          <p className="text-xl text-zinc-400">
            How locators are extracted, cleaned, and maintained across test suites
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
                The Locator System is QA Studio's intelligent locator extraction and maintenance system.
                It uses D365-specific heuristics to extract stable locators, maintains a centralized library
                of canonical locators, and automatically updates locator status based on test execution results.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Smart Extraction</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Uses D365-specific attributes and heuristics to extract stable locators
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Centralized Library</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Maintains a library of canonical locators for reuse and upgrades
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Auto-Maintenance</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Automatically tracks locator health and updates status on failures
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locator System Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Locator System Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <LocatorSystemFlow />
            </CardContent>
          </Card>

          {/* Extraction Heuristics */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Extraction Heuristics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                LocatorExtractor uses a priority-based system to extract the most stable locators:
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <h4 className="font-semibold text-white">data-dyn-controlname (Highest Priority)</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    D365's primary control identifier. Most stable and reliable locator for D365 elements.
                  </p>
                  <div className="text-xs text-zinc-500 font-mono bg-zinc-900/50 p-2 rounded mt-2">
                    page.locator('[data-dyn-controlname="SystemDefinedNewButton"]')
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <h4 className="font-semibold text-white">data-dyn-menutext</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Used for navigation links and menu items. Stable for navigation elements.
                  </p>
                  <div className="text-xs text-zinc-500 font-mono bg-zinc-900/50 p-2 rounded mt-2">
                    page.locator('[data-dyn-menutext="All sales orders"]')
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                    <h4 className="font-semibold text-white">Role-Based Selectors</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Uses Playwright's role-based locators (button, combobox, textbox) with accessible names.
                  </p>
                  <div className="text-xs text-zinc-500 font-mono bg-zinc-900/50 p-2 rounded mt-2">
                    page.getByRole('button', {'{'} name: 'OK' {'}'})
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                    <h4 className="font-semibold text-white">Accessible Name</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Uses ARIA labels, aria-label attributes, or visible text as fallback.
                  </p>
                  <div className="text-xs text-zinc-500 font-mono bg-zinc-900/50 p-2 rounded mt-2">
                    page.getByLabel('Customer account')
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">5</div>
                    <h4 className="font-semibold text-white">Spatial Heuristics</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Last resort: uses spatial positioning (e.g., left-side navigation pane detection).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locator Cleanup */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Locator Cleanup Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                After recording, LocatorCleanupService upgrades fragile locators using the library:
              </p>
              
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Cleanup Process</h4>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>Parses generated code using ts-morph AST</li>
                  <li>Finds all locator expressions (page.getByRole, page.locator, etc.)</li>
                  <li>Extracts locatorKey from each locator</li>
                  <li>Looks up locatorKey in LocatorLibrary</li>
                  <li>If upgrade found, replaces fragile locator with canonical one</li>
                  <li>Generates mapping report showing what was upgraded</li>
                </ol>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Example Upgrade</h4>
                <div className="space-y-2">
                  <div className="text-xs font-mono bg-zinc-900/50 p-2 rounded text-zinc-300">
                    <div className="text-zinc-500 mb-1">Before (Fragile):</div>
                    <div>page.getByText('OK')</div>
                  </div>
                  <div className="text-xs font-mono bg-zinc-900/50 p-2 rounded text-zinc-300">
                    <div className="text-zinc-500 mb-1">After (Canonical):</div>
                    <div>page.locator('[data-dyn-controlname="SystemDefinedOKButton"]')</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locator Library */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Locator Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Storage Structure</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Locators are stored in workspace/locators/library.json:
                </p>
                <div className="text-xs font-mono bg-zinc-900/50 p-3 rounded text-zinc-300">
                  {`{
  "locators": {
    "role:page.getByRole('button', { name: 'OK' })": {
      "strategy": "css",
      "value": "[data-dyn-controlname='SystemDefinedOKButton']",
      "status": "healthy",
      "lastUpdated": "2025-12-01T10:00:00Z"
    }
  }
}`}
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Status Tracking</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Each locator has a status that tracks its health:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="px-3 py-2 bg-green-500/20 border border-green-500/50 rounded text-xs text-zinc-300">
                    <div className="font-semibold text-green-400">healthy</div>
                    <div className="text-zinc-500">Working correctly</div>
                  </div>
                  <div className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-zinc-300">
                    <div className="font-semibold text-yellow-400">warning</div>
                    <div className="text-zinc-500">May be unstable</div>
                  </div>
                  <div className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-zinc-300">
                    <div className="font-semibold text-red-400">failing</div>
                    <div className="text-zinc-500">Test failures detected</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">Automatic Status Updates</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  When tests fail, ErrorGrabber automatically updates locator status:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Extracts failed locator from error message</li>
                  <li>Parses locator string to determine type and key</li>
                  <li>Looks up locator in library</li>
                  <li>Updates status to 'failing'</li>
                  <li>Enables users to identify problematic locators</li>
                </ul>
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

