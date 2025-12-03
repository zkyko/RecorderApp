"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            QA Studio
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Features
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
              Changelog
            </Link>
            <Link
              href="/demo"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Try Demo
            </Link>
            <Link
              href="/download"
              className="text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Download
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs/getting-started">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-zinc-400 hover:text-blue-400 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3">
            <Link
              href="/features"
              className="block text-zinc-400 hover:text-blue-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/docs"
              className="block text-zinc-400 hover:text-blue-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/updates"
              className="block text-zinc-400 hover:text-blue-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Changelog
            </Link>
            <Link
              href="/demo"
              className="block text-zinc-400 hover:text-blue-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Try Demo
            </Link>
            <Link
              href="/download"
              className="block text-zinc-400 hover:text-blue-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Download
            </Link>
            <Button variant="outline" size="sm" asChild className="w-full mt-2">
              <Link href="/docs/getting-started" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
