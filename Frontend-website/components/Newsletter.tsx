"use client";

import { motion } from "framer-motion";
import { Github, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Newsletter() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            Explore the Codebase
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            This project is open source and fully documented. Dive into the architecture, explore the code, or reach out to discuss implementation details.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-6 text-lg border border-slate-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
              asChild
            >
              <a href="https://github.com/zkyko/RecorderApp" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent hover:bg-slate-800/50 text-white px-8 py-6 text-lg border border-slate-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
              asChild
            >
              <Link href="/docs/developer">
                <ExternalLink className="mr-2 h-5 w-5" />
                Developer Documentation
              </Link>
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/50">
            <p className="text-slate-500 mb-4">
              Interested in discussing this project or collaboration opportunities?
            </p>
            <a
              href="mailto:nischal@example.com"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>Get in Touch</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
