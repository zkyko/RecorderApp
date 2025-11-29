"use client";

import { motion } from "framer-motion";
import { ArchitectureDiagram } from "./docs/ArchitectureDiagram";

export function Architecture() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            QA Studio System Architecture
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            QA Studio is an Electron desktop application with a modular architecture. The system flows from recording user interactions, 
            through code generation, to test execution, and finally AI-powered debugging. Each layer builds upon the previous one, 
            creating a complete automation workbench for D365.
          </p>
        </motion.div>

        <ArchitectureDiagram />
      </div>
    </section>
  );
}

