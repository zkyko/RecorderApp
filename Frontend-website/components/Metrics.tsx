"use client";

import { motion } from "framer-motion";
import { Code2, Layers, Zap } from "lucide-react";

const metrics = [
  {
    value: "4 Core Modules",
    label: "Modular architecture with clear separation of concerns",
    sublabel: "Core Runtime, Main Process, Code Generation, UI",
    icon: Layers,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    value: "100% TypeScript",
    label: "Full type safety across the entire codebase",
    sublabel: "Comprehensive TSDoc documentation included",
    icon: Code2,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    value: "Self-Contained",
    label: "Bundled Playwright runtime with zero external dependencies",
    sublabel: "Works out of the box without Node.js installation",
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
  },
];

export function Metrics() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            Technical Highlights
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Key architectural decisions and technical achievements
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${metric.gradient} mb-6 shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                  {metric.value}
                </h3>
                <p className="text-lg text-slate-300 font-medium mb-2">
                  {metric.label}
                </p>
                <p className="text-sm text-slate-500">
                  {metric.sublabel}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
