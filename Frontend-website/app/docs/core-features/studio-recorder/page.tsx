import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Code, Zap, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioRecorderFlow } from "@/components/docs/StudioRecorderFlow";

export default function StudioRecorderPage() {
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
            Studio Recorder
          </h1>
          <p className="text-xl text-zinc-400">
            How QA Studio's intelligent recorder captures and processes user interactions
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
                The Studio Recorder is QA Studio's core recording engine that captures user interactions in real-time
                and converts them into executable Playwright test code. Unlike simple recorders, it uses intelligent
                heuristics to extract stable locators, preserve context, and generate maintainable test code.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Real-Time Capture</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Captures interactions as they happen, with live code generation and preview
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">D365-Aware</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Uses platform-specific heuristics to extract stable D365 locators
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Context-Aware</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Preserves navigation steps and validates toolbar button context
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Recording Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <StudioRecorderFlow />
            </CardContent>
          </Card>

          {/* Key Components */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Key Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">RecorderEngine</h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    The main orchestrator that coordinates event capture, locator extraction, and step creation.
                  </p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>• Manages recording lifecycle (start/stop)</div>
                    <div>• Coordinates LocatorExtractor, PageClassifier, and PageRegistry</div>
                    <div>• Converts DOM events into RecordedStep objects</div>
                    <div>• Handles page navigation and iframe contexts</div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">EventListeners</h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    Injected scripts that intercept user interactions at the DOM level using capture phase listeners.
                  </p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>• Uses context.addInitScript() to inject before page load</div>
                    <div>• Captures events in CAPTURE phase (before D365 can stop propagation)</div>
                    <div>• Handles nested iframes and shadow DOM</div>
                    <div>• Includes spatial heuristics for navigation pane clicks</div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">LocatorExtractor</h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    Platform-specific service that extracts stable locators using D365 heuristics.
                  </p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>• Priority: data-dyn-controlname → data-dyn-menutext → role → accessible name</div>
                    <div>• Detects context-setting clicks (workspace navigation)</div>
                    <div>• Identifies toolbar buttons and validates context</div>
                    <div>• Handles comboboxes, navigation links, and form fields</div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">PageClassifier</h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    Analyzes page structure to identify module, page type, and context.
                  </p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>• Extracts module from navigation structure</div>
                    <div>• Identifies page type (list, form, dashboard, etc.)</div>
                    <div>• Captures page captions and metadata</div>
                    <div>• Updates PageRegistry with page identity</div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">RecorderService</h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    High-level service that manages browser lifecycle and converts RecordedStep[] to Playwright code.
                  </p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>• Launches browser with storage state</div>
                    <div>• Manages recording session lifecycle</div>
                    <div>• Compiles steps into Playwright code with context-aware logic</div>
                    <div>• Injects D365-specific waits and optimizations</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context-Aware Logic */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Context-Aware Recording Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The recorder uses a state machine to track workspace context and ensure recorded flows are correct:
              </p>
              
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Context States</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-white">None</div>
                      <div className="text-sm text-zinc-400">No workspace context established yet</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-white">PendingNav</div>
                      <div className="text-sm text-zinc-400">Context-setting click detected, expecting navigation step</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-white">Ready</div>
                      <div className="text-sm text-zinc-400">Workspace loaded, toolbar buttons can be used</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-2">How It Works</h4>
                <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
                  <li>When user clicks "All sales orders" → Detected as context-setting click → State: PendingNav</li>
                  <li>Navigation step is preserved (not optimized away) → State: Ready</li>
                  <li>Toolbar buttons (New, Save, etc.) are validated to ensure context is Ready</li>
                  <li>If toolbar button used without context → Warning logged (but still recorded)</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">DOM-Aware Detection</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  The recorder uses D365-specific attributes to detect context-setting clicks and toolbar buttons:
                </p>
                <div className="text-xs text-zinc-500 space-y-1 font-mono bg-zinc-900/50 p-3 rounded">
                  <div>• Context-setting: data-dyn-menutext, data-dyn-menuitemname, navigation regions</div>
                  <div>• Toolbar buttons: data-dyn-controlname (SystemDefinedNewButton, etc.), commandBar regions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Cleanup */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Step Cleanup & Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                After recording, steps go through cleanup to remove noise and optimize the flow:
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Navigation Cleanup</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Removes auth/redirect navigation steps</li>
                    <li>Skips intermediate navigations in redirect chains</li>
                    <li>Preserves navigation after context-setting clicks</li>
                    <li>Removes "ghost" navigations after regular clicks</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Wait Optimization</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Removes redundant waitForTimeout calls</li>
                    <li>Removes waitForD365 before OK button clicks after combobox Enter</li>
                    <li>Coerces wait values to numeric milliseconds (handles 'Enter' string bug)</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Combobox Handling</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Adds .clear() before .fill() for comboboxes</li>
                    <li>Adds .press('Enter') after combobox fill</li>
                    <li>Makes OK button clicks conditional (D365 sometimes auto-selects)</li>
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
                href="/docs/core-features/locator-system"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Locator System
              </Link>
              <Link
                href="/docs/core-features/parameterization"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Parameterization
              </Link>
              <Link
                href="/docs/architecture"
                className="px-4 py-2 border border-violet-500/50 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                System Architecture
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

