"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Layers, 
  Zap, 
  Settings, 
  FileCode, 
  Package, 
  Database,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/docs/developer",
    icon: BookOpen,
    description: "Developer documentation home"
  },
  {
    title: "Architecture",
    href: "/docs/developer/architecture",
    icon: Layers,
    description: "System architecture overview"
  },
  {
    title: "Core Modules",
    href: "/docs/developer/core",
    icon: Zap,
    description: "Browser-side recording components"
  },
  {
    title: "Main Process",
    href: "/docs/developer/main-process",
    icon: Settings,
    description: "Electron main process and IPC"
  },
  {
    title: "Code Generators",
    href: "/docs/developer/generators",
    icon: FileCode,
    description: "Spec and POM generation"
  },
  {
    title: "Services",
    href: "/docs/developer/services",
    icon: Package,
    description: "Backend services and integrations"
  },
  {
    title: "Type Definitions",
    href: "/docs/developer/types",
    icon: Database,
    description: "TypeScript types and interfaces"
  },
];

export function DeveloperSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/docs/developer") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <ChevronRight className={`h-5 w-5 transition-transform ${isMobileOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50
          z-30 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Developer Docs</h2>
            <p className="text-xs text-slate-400">Complete codebase reference</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                    ${active 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-slate-100' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${active ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'}`}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {active && (
                    <ChevronRight className="h-4 w-4 text-blue-400 flex-shrink-0 mt-1" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href="/docs"
                  className="block text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← User Documentation
                </Link>
                <Link
                  href="/docs/getting-started"
                  className="block text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Getting Started Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
