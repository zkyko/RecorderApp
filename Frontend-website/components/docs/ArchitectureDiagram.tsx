"use client";

import { motion } from "framer-motion";

export function ArchitectureDiagram() {
  return (
    <div className="my-8 bg-zinc-900/50 border border-white/10 rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-full">
        {/* Recording Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Recording Layer</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              RecorderEngine
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              LocatorExtractor
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              PageClassifier
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              PageRegistry
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">Captures user interactions and extracts D365-specific locators</p>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
        </div>

        {/* Recorded Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex justify-center"
        >
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-xs sm:text-sm font-medium">
            Recorded Steps (RecordedStep[])
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-indigo-500/50"></div>
        </div>

        {/* Code Processing Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Code Processing Layer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              LocatorCleanupService
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              ParameterDetector
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              D365WaitInjector
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">Cleans locators, detects parameters, injects D365-specific waits</p>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50"></div>
        </div>

        {/* Spec Writing Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Spec Writing Layer</h3>
          <div className="space-y-3">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg text-indigo-300 text-xs sm:text-sm text-center font-medium">
              SpecWriter
            </div>
            <div className="flex justify-center">
              <div className="text-zinc-500 text-lg sm:text-xl">↓</div>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
              Uses SpecGenerator
              <br />
              <span className="text-[10px] sm:text-xs text-zinc-500">(for metadata & formatting)</span>
            </div>
            <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-zinc-900/50 border border-indigo-500/30 rounded text-[10px] sm:text-xs text-zinc-400 text-center mt-2">
              Generates flat .spec.ts files (no POM abstraction)
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-green-500/50"></div>
        </div>

        {/* Generated Artifacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Generated Artifacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-300 text-xs sm:text-sm text-center">
              tests/d365/specs/&lt;TestName&gt;/
              <br />
              <span className="text-[10px] sm:text-xs text-cyan-400">.spec.ts, .meta.json, .meta.md</span>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-300 text-xs sm:text-sm text-center">
              tests/d365/data/
              <br />
              <span className="text-[10px] sm:text-xs text-cyan-400">&lt;TestName&gt;Data.json</span>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-green-500/50 to-yellow-500/50"></div>
        </div>

        {/* Test Execution Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Test Execution Layer</h3>
          <div className="flex gap-4 items-center justify-center flex-wrap">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm">
              TestRunner
            </div>
            <div className="text-zinc-500 text-xl sm:text-2xl">→</div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-xs sm:text-sm font-medium">
              Playwright Runner
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">Executes generated test specs (local or BrowserStack)</p>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-yellow-500/50 to-blue-500/50"></div>
        </div>

        {/* Output & Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Output & Feedback</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-xs sm:text-sm text-center">
              Test Results
              <br />
              <span className="text-[10px] sm:text-xs text-yellow-400">Logs, Screenshots, Traces</span>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-xs sm:text-sm text-center">
              Failure Forensics
              <br />
              <span className="text-[10px] sm:text-xs text-yellow-400">_failure.json files</span>
            </div>
          </div>
        </motion.div>

        {/* Arrow down (Feedback Loop) */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-yellow-500/50 to-blue-500/50"></div>
        </div>

        {/* AI/RAG Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">AI-Powered Debugging (RAG)</h3>
          <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="space-y-3">
              <div className="px-3 py-2 sm:px-4 sm:py-3 bg-[#2196F3] border border-white/20 rounded-lg text-white text-xs sm:text-sm text-center font-medium">
                RAGService
              </div>
              <div className="flex justify-center">
                <div className="text-zinc-500 text-lg sm:text-xl">↓</div>
              </div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
                Loads Test Context
                <br />
                <span className="text-[10px] sm:text-xs text-zinc-500">(.meta.md, _failure.json)</span>
              </div>
              <div className="flex justify-center">
                <div className="text-zinc-500 text-lg sm:text-xl">↓</div>
              </div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800/50 border border-white/20 rounded-lg text-zinc-300 text-xs sm:text-sm text-center">
                LLM Inference
                <br />
                <span className="text-[10px] sm:text-xs text-zinc-500">(OpenAI, DeepSeek, Custom)</span>
              </div>
              <div className="flex justify-center">
                <div className="text-zinc-500 text-lg sm:text-xl">↓</div>
              </div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-xs sm:text-sm text-center font-medium">
                AI Diagnosis & Fix Suggestions
              </div>
            </div>
          </div>
        </motion.div>

        {/* UI Layer (Side note) */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="text-xs text-zinc-500 text-center">
            <span className="text-purple-400 font-semibold">UI Layer:</span> React components (RecordScreen, StepEditorScreen, TestLibrary, SettingsScreen, etc.) orchestrate all layers via Electron IPC
          </div>
        </div>
      </div>
    </div>
  );
}
