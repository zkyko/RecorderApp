"use client";

import { motion } from "framer-motion";

export function LocatorSystemFlow() {
  return (
    <div className="my-8 bg-zinc-900/50 border border-white/10 rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-full">
        {/* Phase 1: Extraction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 1: Locator Extraction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.1 DOM Analysis</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Element Inspection</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Analyzes clicked/filled element</div>
                <div>• Checks parent hierarchy</div>
                <div>• Extracts attributes & roles</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.2 Priority Heuristics</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">D365-Specific Rules</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>1. data-dyn-controlname</div>
                <div>2. data-dyn-menutext</div>
                <div>3. Role-based (button, combobox)</div>
                <div>4. Accessible name</div>
                <div>5. Spatial heuristics</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
        </div>

        {/* Phase 2: Locator Definition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 2: Locator Definition</h3>
          <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
            <div className="text-purple-300 text-sm font-medium mb-2">LocatorDefinition Structure</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">strategy</div>
                <div className="text-zinc-500 text-[10px]">role, css, xpath</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">value</div>
                <div className="text-zinc-500 text-[10px]">Selector value</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">metadata</div>
                <div className="text-zinc-500 text-[10px]">Context info</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">locatorKey</div>
                <div className="text-zinc-500 text-[10px]">Unique key</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-indigo-500/50"></div>
        </div>

        {/* Phase 3: Cleanup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 3: Locator Cleanup</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
              <div className="text-indigo-300 text-sm font-medium mb-2">Library Lookup</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Checks LocatorLibrary for upgrades</div>
                <div>• Matches by locatorKey</div>
                <div>• Finds canonical locators</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
              <div className="text-indigo-300 text-sm font-medium mb-2">Code Replacement</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Replaces fragile locators</div>
                <div>• Uses ts-morph AST manipulation</div>
                <div>• Preserves code structure</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50"></div>
        </div>

        {/* Phase 4: Library Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 4: Locator Library</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <div className="text-cyan-300 text-sm font-medium mb-2">Storage Structure</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Stored in workspace/locators/library.json</div>
                <div>• Each locator has: key, strategy, value, status</div>
                <div>• Status: 'healthy' | 'warning' | 'failing'</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-cyan-500/30 rounded-lg">
              <div className="text-xs text-cyan-400 font-semibold mb-1">Status Tracking</div>
              <div className="text-zinc-300 text-sm">Locators marked as 'failing' when tests fail, enabling maintenance tracking</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-green-500/50"></div>
        </div>

        {/* Phase 5: Maintenance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 5: Maintenance & Updates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Auto-Update</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Failed locators marked automatically</div>
                <div>• ErrorGrabber extracts failures</div>
                <div>• Status updated in library</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Manual Edit</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Users can edit locators</div>
                <div>• Update status manually</div>
                <div>• Add new canonical locators</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Sync</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• Library syncs across tests</div>
                <div>• Upgrades apply automatically</div>
                <div>• Centralized maintenance</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


