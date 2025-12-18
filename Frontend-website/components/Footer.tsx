"use client";

import { Github, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-900/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-center md:text-left">
            Designed & Built by{" "}
            <span className="text-blue-400 font-semibold">Nischal Bhandari</span>
          </p>
          <div className="flex flex-wrap gap-6 justify-center md:justify-end">
            <Link
              href="/features"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/docs"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/updates"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Updates
            </Link>
            <Link
              href="/faq"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/roadmap"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Roadmap
            </Link>
            <Link
              href="https://github.com/zkyko/RecorderApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

