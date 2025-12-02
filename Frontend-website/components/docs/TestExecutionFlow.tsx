"use client";

import { motion } from "framer-motion";

export function TestExecutionFlow() {
  return (
    <div className="my-8 bg-zinc-900/50 border border-white/10 rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-full">
        {/* Pre-Execution Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Pre-Execution: Setup & Preparation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.1 Spec Path Resolution</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Find Test File</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Handles old/new bundle structures</div>
                <div>• Tries multiple file name variations</div>
                <div>• Validates file exists</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.2 Workspace Config</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Ensure playwright.config.ts</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Creates config if missing</div>
                <div>• Installs Allure reporter</div>
                <div>• Skips browser install for BrowserStack</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.3 Storage State</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Copy Auth State</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Copies storage_state/d365.json</div>
                <div>• Ensures authentication available</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.4 Run Metadata</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Create Run Record</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Generates unique runId</div>
                <div>• Creates traces directory</div>
                <div>• Initializes run metadata</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
        </div>

        {/* Execution Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Execution Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <div className="text-purple-300 text-sm font-medium mb-2">Local Execution</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Uses workspace playwright.config.ts</div>
                <div>• Runs npx playwright test locally</div>
                <div>• Requires local browser installation</div>
                <div>• Streams output to UI in real-time</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <div className="text-purple-300 text-sm font-medium mb-2">BrowserStack Execution</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Generates dynamic BrowserStack config</div>
                <div>• Sets BROWSERSTACK_* env variables</div>
                <div>• Uses BrowserStack cloud browsers</div>
                <div>• Supports multiple browser/OS targets</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-indigo-500/50"></div>
        </div>

        {/* Execution Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Execution: Test Run</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
              <div className="text-indigo-300 text-sm font-medium mb-2">Process Spawn</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">npx playwright test</div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">--config=...</div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">specPath</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-indigo-500/30 rounded-lg">
              <div className="text-xs text-indigo-400 font-semibold mb-1">Streaming Output</div>
              <div className="text-zinc-300 text-sm">stdout/stderr streamed to UI via IPC events in real-time</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50"></div>
        </div>

        {/* Reporter Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Reporter: ErrorGrabber</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <div className="text-cyan-300 text-sm font-medium mb-2">Failure Capture</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Captures test failures</div>
                <div>• Extracts failed locator from error</div>
                <div>• Creates _failure.json artifacts</div>
                <div>• Includes screenshots & traces</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <div className="text-cyan-300 text-sm font-medium mb-2">Locator Status Update</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Parses locator string</div>
                <div>• Updates locator library status</div>
                <div>• Marks failed locators as 'failing'</div>
                <div>• Enables maintenance tracking</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-green-500/50"></div>
        </div>

        {/* Post-Execution Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Post-Execution: Results & Artifacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Run Metadata</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Updates run status</div>
                <div>• Records finish time</div>
                <div>• Saves to runs.json</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Traces</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Playwright trace files</div>
                <div>• DOM snapshots</div>
                <div>• Network requests</div>
                <div>• Screenshots</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Allure Reports</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• HTML test reports</div>
                <div>• Test history</div>
                <div>• Failure analysis</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-green-500/50 to-yellow-500/50"></div>
        </div>

        {/* UI Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">UI Feedback & Debugging</h3>
          <div className="px-4 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="text-yellow-300 text-sm font-medium mb-2">Run Screen Features</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">Console Output</div>
                <div className="text-zinc-500 text-[10px]">Real-time logs</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">Trace Viewer</div>
                <div className="text-zinc-500 text-[10px]">Playwright traces</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">Allure Report</div>
                <div className="text-zinc-500 text-[10px]">HTML reports</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


