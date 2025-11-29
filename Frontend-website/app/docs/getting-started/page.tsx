import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Download, Settings, Key, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Getting Started
          </h1>
          <p className="text-xl text-zinc-400">
            Get up and running with QA Studio in minutes
          </p>
        </div>

        <div className="space-y-8">
          {/* Installation */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Download className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl">Installation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Download QA Studio for your platform from the{" "}
                <Link href="/download" className="text-blue-400 hover:text-blue-300 transition-colors">
                  download page
                </Link>
                .
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Windows</h4>
                  <p className="text-sm text-zinc-400">Download the .zip file and extract to your preferred location</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Mac</h4>
                  <p className="text-sm text-zinc-400">Download the .zip file and extract to Applications</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Requirements</h4>
                  <p className="text-sm text-zinc-400">Node.js 20+, Playwright browsers (auto-installed)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initial Setup */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                  <Settings className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl">Initial Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Create or Load Workspace</h4>
                    <p className="text-zinc-400 text-sm">
                      On first launch, create a new workspace or load an existing one. Workspaces organize your tests, locators, and data files.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Configure Platform</h4>
                    <p className="text-zinc-400 text-sm">
                      Select your target platform workspace (currently D365 is available). Each workspace uses platform-specific locator algorithms.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Set Environment URL</h4>
                    <p className="text-zinc-400 text-sm">
                      Enter your platform URL (e.g., D365 tenant URL) in Settings. This will be used for recording and test execution.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Authenticate</h4>
                    <p className="text-zinc-400 text-sm">
                      Log in to your platform through QA Studio. Your authentication state will be saved securely for future sessions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Setup */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Key className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl">AI Debugger Setup (Optional)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                To use the AI Forensics Engine for intelligent test failure diagnosis, you'll need an API key from one of the supported providers.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    OpenAI API Key
                  </h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    Recommended for best results. Get your API key from{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                      OpenAI's platform
                    </a>
                    .
                  </p>
                  <p className="text-xs text-zinc-500">
                    The AI Debugger uses GPT-4 or GPT-3.5-turbo to analyze test failures and provide intelligent diagnosis.
                  </p>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                    DeepSeek API Key (Alternative)
                  </h4>
                  <p className="text-sm text-zinc-400 mb-3">
                    Cost-effective alternative. Get your API key from{" "}
                    <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                      DeepSeek's platform
                    </a>
                    .
                  </p>
                  <p className="text-xs text-zinc-500">
                    DeepSeek provides similar capabilities at a lower cost, making it ideal for high-volume debugging.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> The AI Debugger is optional. You can use QA Studio for recording, code generation, and test execution without an API key. The AI features enhance debugging but aren't required for core functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 list-decimal list-inside text-zinc-300">
                <li>
                  <strong className="text-white">Create Workspace:</strong> Click "New Workspace" and choose a location for your test files
                </li>
                <li>
                  <strong className="text-white">Configure Settings:</strong> Go to Settings → Authentication and log in to your platform
                </li>
                <li>
                  <strong className="text-white">Start Recording:</strong> Navigate to the Record tab and click "Start Recording"
                </li>
                <li>
                  <strong className="text-white">Interact with Your App:</strong> Perform your test scenario in the browser window
                </li>
                <li>
                  <strong className="text-white">Stop & Review:</strong> Click "Stop Recording" to review generated steps
                </li>
                <li>
                  <strong className="text-white">Edit & Clean:</strong> Use the Step Editor to refine steps, then proceed to Locator Cleanup
                </li>
                <li>
                  <strong className="text-white">Parameterize:</strong> Set up test data parameters in the Parameter Mapping screen
                </li>
                <li>
                  <strong className="text-white">Save Test:</strong> Enter a test name and generate your final test spec
                </li>
                <li>
                  <strong className="text-white">Run Tests:</strong> Execute your tests locally or on BrowserStack
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Next Steps</h3>
            <p className="text-zinc-300 mb-4">
              Now that you're set up, explore these resources:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Learn Architecture
              </Link>
              <Link
                href="/docs/guides"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Read Guides
              </Link>
              <Link
                href="/docs/advanced/rag-architecture"
                className="px-4 py-2 border border-violet-500/50 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                RAG System Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
