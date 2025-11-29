"use client";

import { Github, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-400 text-center md:text-left">
            Designed & Built by{" "}
            <span className="text-blue-400 font-semibold">Nischal Bhandari</span>
          </p>
          <div className="flex gap-6">
            <Link
              href="/updates"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Updates
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
            <Link
              href="https://fourhands.atlassian.net/wiki/spaces/QAAutomation/pages/4281532810/QA+Automation+Plan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Confluence</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

