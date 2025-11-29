"use client";

import { motion } from "framer-motion";
import { Code2, Users } from "lucide-react";

export function About() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
              About the Architect
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            About the Architect
          </h2>
          
          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed mb-8">
            QA Studio was designed to democratize automation, allowing teams to manage, maintain, and execute complex regression suites without the steep learning curve of traditional programming.
          </p>
          
          <p className="text-base text-zinc-500">
            Architected by <span className="text-violet-400 font-semibold">Nischal Bhandari</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
            <div className="flex items-center gap-3 text-zinc-400">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-sm">For QA Engineers & SDETs</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <Code2 className="h-5 w-5 text-purple-400" />
              <span className="text-sm">Open Source Foundation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

