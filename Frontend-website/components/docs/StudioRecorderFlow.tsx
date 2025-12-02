"use client";

import { motion } from "framer-motion";

export function StudioRecorderFlow() {
  return (
    <div className="my-8 bg-zinc-900/50 border border-white/10 rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-full">
        {/* Phase 1: Initialization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 1: Initialization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.1</div>
              <div className="text-zinc-300 text-sm font-medium">Browser Launch</div>
              <div className="text-xs text-zinc-500 mt-1">Loads storage state, creates Playwright context</div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.2</div>
              <div className="text-zinc-300 text-sm font-medium">RecorderEngine Init</div>
              <div className="text-xs text-zinc-500 mt-1">Creates LocatorExtractor, PageClassifier, PageRegistry</div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.3</div>
              <div className="text-zinc-300 text-sm font-medium">Event Listeners Inject</div>
              <div className="text-xs text-zinc-500 mt-1">Injects DOM listeners via context.addInitScript</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
        </div>

        {/* Phase 2: Event Capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 2: Event Capture</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <div className="text-purple-300 text-sm font-medium mb-2">User Interaction → DOM Event</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">Click Event</div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">Input/Fill Event</div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">Select Event</div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">Navigate Event</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-purple-500/30 rounded-lg">
              <div className="text-xs text-purple-400 font-semibold mb-1">Capture Phase Priority</div>
              <div className="text-zinc-300 text-sm">Event listeners use CAPTURE phase to intercept BEFORE D365 scripts can stop propagation</div>
              <div className="text-xs text-zinc-500 mt-2">Uses document.addEventListener('click', ..., true) for maximum reliability</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-indigo-500/50"></div>
        </div>

        {/* Phase 3: Locator Extraction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 3: Locator Extraction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
              <div className="text-indigo-300 text-sm font-medium mb-2">D365-Specific Heuristics</div>
              <div className="space-y-2 text-xs text-zinc-400">
                <div>1. data-dyn-controlname (highest priority)</div>
                <div>2. data-dyn-menutext (navigation links)</div>
                <div>3. Role-based selectors (button, combobox, etc.)</div>
                <div>4. Accessible name (ARIA labels)</div>
                <div>5. Spatial heuristics (left-side navigation)</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
              <div className="text-indigo-300 text-sm font-medium mb-2">Context-Aware Detection</div>
              <div className="space-y-2 text-xs text-zinc-400">
                <div>• Context-setting clicks (workspace navigation)</div>
                <div>• Toolbar button detection</div>
                <div>• Combobox vs regular input</div>
                <div>• Navigation pane vs workspace</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50"></div>
        </div>

        {/* Phase 4: Step Creation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 4: Step Creation</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <div className="text-cyan-300 text-sm font-medium mb-2">RecordedStep Structure</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                  <div className="font-semibold mb-1">action</div>
                  <div className="text-zinc-500">click, fill, select, navigate, wait</div>
                </div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                  <div className="font-semibold mb-1">locator</div>
                  <div className="text-zinc-500">LocatorDefinition with strategy + value</div>
                </div>
                <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                  <div className="font-semibold mb-1">metadata</div>
                  <div className="text-zinc-500">timestamp, pageIdentity, context</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-cyan-500/30 rounded-lg">
              <div className="text-xs text-cyan-400 font-semibold mb-1">Page Classification</div>
              <div className="text-zinc-300 text-sm">Each step includes PageIdentity (module, pageType, caption) for context tracking</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-green-500/50"></div>
        </div>

        {/* Phase 5: Code Generation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 5: Code Generation</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="px-4 py-3 bg-zinc-800/50 border border-green-500/30 rounded-lg">
                <div className="text-green-400 text-xs font-semibold mb-1">Step Compilation</div>
                <div className="text-zinc-300 text-sm">Converts RecordedStep[] to Playwright code</div>
              </div>
              <div className="px-4 py-3 bg-zinc-800/50 border border-green-500/30 rounded-lg">
                <div className="text-green-400 text-xs font-semibold mb-1">Context Logic</div>
                <div className="text-zinc-300 text-sm">Preserves navigation steps, validates toolbar context</div>
              </div>
              <div className="px-4 py-3 bg-zinc-800/50 border border-green-500/30 rounded-lg">
                <div className="text-green-400 text-xs font-semibold mb-1">D365 Waits</div>
                <div className="text-zinc-300 text-sm">Injects waitForD365() after heavy actions</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium">Live Code Updates</div>
              <div className="text-xs text-zinc-400 mt-1">Code is generated and sent to UI in real-time as user interacts</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

