"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

export function AIFeature() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                The AI Brain
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Don't just see 'Failed'. See 'Why'.
            </h2>
            
            <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
              Our embedded AI agent analyzes your specific test code and error logs to explain the root cause instantly.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 font-medium">RAG-Powered Analysis</p>
                  <p className="text-zinc-500 text-sm">Context-aware debugging using your codebase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 font-medium">Instant Diagnosis</p>
                  <p className="text-zinc-500 text-sm">No more guessing why tests fail</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 font-medium">Self-Healing Tests</p>
                  <p className="text-zinc-500 text-sm">Turn flaky tests into solved problems</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-lg border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-2xl shadow-purple-500/20">
              <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
                <div className="relative z-10 text-center">
                  <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-zinc-500 text-sm">AI Debugger Interface</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

