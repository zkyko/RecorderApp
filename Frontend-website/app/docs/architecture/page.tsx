import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Layers, Code2, Cpu, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArchitecturePage() {
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
            Architecture
          </h1>
          <p className="text-xl text-zinc-400">
            Understanding how QA Studio is built and how it works
          </p>
        </div>

        <div className="space-y-8">
          {/* System Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                QA Studio is an Electron desktop application that orchestrates four collaborating branches:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Core Runtime</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Playwright-powered recorder, locator extractor, registry, and session utilities that run inside the browser context during capture.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Main Process</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Electron orchestration layer that brokers device capabilities (filesystem, config, credentials) and exposes them via IPC services.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Code Generation</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Translates recorded steps into TypeScript test specs and executes them through Playwright. Handles code formatting and safe merges.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Studio UI</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Mantine/React front-end that drives recording sessions, artifact review, settings, and run management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Architecture */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Workspace Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                QA Studio uses a <strong className="text-white">workspace-based architecture</strong> that makes it platform-agnostic and easily extensible.
              </p>
              
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">How Workspaces Work</h4>
                <ul className="space-y-2 text-sm text-zinc-300 list-disc list-inside">
                  <li>Each workspace contains platform-specific locator extraction algorithms</li>
                  <li>Workspaces define platform-specific page classification rules</li>
                  <li>Shared infrastructure (recorder, code generation, execution) works across all workspaces</li>
                  <li>To add a new platform, build the locator logic and plug it into the workspace system</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-white mb-2">Current: D365</h4>
                  <p className="text-sm text-zinc-400">
                    Optimized locator extraction for Microsoft Dynamics 365 with data-dyn-controlname priority, role-based selectors, and D365-specific heuristics.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">Coming: Koerber</h4>
                  <p className="text-sm text-zinc-400">
                    Koerber-specific locator algorithms will be added as a separate workspace, sharing the same recording and execution infrastructure.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <h4 className="font-semibold text-white mb-2">Coming: Salesforce</h4>
                  <p className="text-sm text-zinc-400">
                    Salesforce workspace with platform-specific locator strategies, leveraging Salesforce's component structure and data attributes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Data Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500"></div>
                  <div className="space-y-6 pl-10">
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-blue-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">1. Session Bootstrap</h4>
                        <p className="text-sm text-zinc-400">
                          Main process validates platform URLs, loads environment config, and initializes Playwright contexts with authentication state.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-violet-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">2. Recorder Attach</h4>
                        <p className="text-sm text-zinc-400">
                          RecorderEngine attaches to the browser page, injecting DOM listeners and CDP hooks. Applies platform-specific heuristics and enriches events with page identity.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-cyan-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">3. Classification & Registry</h4>
                        <p className="text-sm text-zinc-400">
                          Each navigation updates the page registry with platform-specific metadata (module, page identity, captions). Registry persists across sessions.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">4. Locator Intelligence</h4>
                        <p className="text-sm text-zinc-400">
                          Platform-specific locator extractor combines attribute probes (platform-specific attributes, roles, spatial hints) to produce stable selectors.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-amber-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">5. Code Generation</h4>
                        <p className="text-sm text-zinc-400">
                          Parses recorded steps, generates Playwright test specs with proper formatting, and writes to workspace test directory.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-rose-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">6. Execution & Feedback</h4>
                        <p className="text-sm text-zinc-400">
                          Test executor runs specs locally or on BrowserStack, streams logs back to UI, and captures traces for debugging.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Bundle Structure */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Test Bundle Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Each test is organized as a self-contained bundle with executable code, metadata, and context files.
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`workspace/
├── tests/
│   └── <TestName>/
│       ├── <TestName>.spec.ts    # Playwright test code
│       ├── <TestName>.meta.json   # Structured metadata
│       └── <TestName>.meta.md     # AI-readable context (for RAG)
├── data/
│   └── <TestName>.json            # Test data parameters
├── locators/
│   └── status.json                 # Locator status tracking
└── workspace.json                  # Workspace configuration`}</pre>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">.spec.ts Files</h4>
                  <p className="text-sm text-zinc-400">
                    The executable Playwright test code. Contains your test implementation with inline locators, data-driven test structure, and runtime helpers.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">.meta.json Files</h4>
                  <p className="text-sm text-zinc-400">
                    Machine-readable metadata about the test: name, module, creation date, data path, and execution history.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">.meta.md Files</h4>
                  <p className="text-sm text-zinc-400">
                    AI-readable context file used by the RAG system for intelligent debugging. Contains test intent, step descriptions, and failure context.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extension Points */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Extension Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-zinc-300">
                <div>
                  <strong className="text-white">Add a new platform workspace:</strong> Build platform-specific locator extraction algorithms and page classification rules, then register as a new workspace.
                </div>
                <div>
                  <strong className="text-white">Introduce a new artifact type:</strong> Create a generator in <code className="text-blue-400 bg-zinc-800 px-1 rounded">src/generators/</code> and register it in the codegen pipeline.
                </div>
                <div>
                  <strong className="text-white">Wire a new execution target:</strong> Implement a runner in <code className="text-blue-400 bg-zinc-800 px-1 rounded">src/main/test-executor.ts</code> and surface it as a selectable profile in Settings.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/advanced/rag-architecture"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                RAG Architecture
              </Link>
              <Link
                href="/docs/guides"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                User Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
