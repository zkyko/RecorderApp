"use client";

import Link from "next/link";
import { Menu, X, Code2 } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              FourHands Automation
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/features"
              className={`nav-link px-4 py-2 rounded-lg ${isActive('/features') ? 'nav-link-active bg-slate-800/50' : ''}`}
            >
              Features
            </Link>
            <Link
              href="/docs"
              className={`nav-link px-4 py-2 rounded-lg ${isActive('/docs') ? 'nav-link-active bg-slate-800/50' : ''}`}
            >
              Documentation
            </Link>
            <Link
              href="/updates"
              className={`nav-link px-4 py-2 rounded-lg ${isActive('/updates') ? 'nav-link-active bg-slate-800/50' : ''}`}
            >
              Changelog
            </Link>
            <Link
              href="/demo"
              className={`nav-link px-4 py-2 rounded-lg ${isActive('/demo') ? 'nav-link-active bg-slate-800/50' : ''}`}
            >
              Demo
            </Link>
            <Link
              href="/download"
              className={`nav-link px-4 py-2 rounded-lg ${isActive('/download') ? 'nav-link-active bg-slate-800/50' : ''}`}
            >
              Download
            </Link>
            <Link 
              href="/docs/getting-started" 
              className="ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-400 hover:text-slate-100 transition-colors p-2 rounded-lg hover:bg-slate-800/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/50 py-4 space-y-2 bg-slate-900/95 backdrop-blur-xl">
            <Link
              href="/features"
              className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/features') ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/docs"
              className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/docs') ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </Link>
            <Link
              href="/updates"
              className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/updates') ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Changelog
            </Link>
            <Link
              href="/demo"
              className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/demo') ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Demo
            </Link>
            <Link
              href="/download"
              className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/download') ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Download
            </Link>
            <Link 
              href="/docs/getting-started" 
              className="block mt-4 mx-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium text-center shadow-lg shadow-blue-500/30 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
