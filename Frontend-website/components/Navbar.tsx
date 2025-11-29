"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (href.startsWith('#')) {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            QA Studio
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/features"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/"
              className="text-zinc-400 hover:text-blue-400 transition-colors hidden sm:inline"
            >
              Overview
            </Link>
            <Link
              href="/docs"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/updates"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Updates
            </Link>
            <Link
              href="/download"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Download
            </Link>
            <Link
              href="/faq"
              className="text-zinc-400 hover:text-blue-400 transition-colors hidden sm:inline"
            >
              FAQ
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/download">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

