import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { FileCode, Folder, Package, Layers, Database, Settings, Zap } from "lucide-react";

export default function DeveloperDocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Developer Documentation
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl">
            Comprehensive guide to the QA Studio codebase. Learn about each module, file, and component 
            to understand how the application works and how to contribute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/docs/developer/architecture" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <Layers className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                Architecture Overview
              </h3>
              <p className="text-zinc-400 text-sm">
                Understand the overall architecture, module structure, and how components interact.
              </p>
            </div>
          </Link>

          <Link href="/docs/developer/core" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <Zap className="h-8 w-8 text-violet-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-violet-400 transition-colors">
                Core Modules
              </h3>
              <p className="text-zinc-400 text-sm">
                Recording engine, locator extraction, page classification, and session management.
              </p>
            </div>
          </Link>

          <Link href="/docs/developer/main-process" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <Settings className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-green-400 transition-colors">
                Main Process
              </h3>
              <p className="text-zinc-400 text-sm">
                Electron main process, IPC bridge, services, and configuration management.
              </p>
            </div>
          </Link>

          <Link href="/docs/developer/generators" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <FileCode className="h-8 w-8 text-yellow-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-yellow-400 transition-colors">
                Code Generators
              </h3>
              <p className="text-zinc-400 text-sm">
                Spec generation, Page Object Model creation, and code formatting utilities.
              </p>
            </div>
          </Link>

          <Link href="/docs/developer/services" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <Package className="h-8 w-8 text-pink-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-pink-400 transition-colors">
                Services
              </h3>
              <p className="text-zinc-400 text-sm">
                Recording service, test runner, workspace manager, Jira, BrowserStack, and RAG integration.
              </p>
            </div>
          </Link>

          <Link href="/docs/developer/types" className="group">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <Database className="h-8 w-8 text-cyan-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                Type Definitions
              </h3>
              <p className="text-zinc-400 text-sm">
                TypeScript interfaces, types, and data structures used throughout the application.
              </p>
            </div>
          </Link>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Start for New Developers</h2>
          <div className="space-y-4 text-zinc-300">
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">1. Understand the Architecture</h3>
              <p className="text-sm text-zinc-400">
                Start with the <Link href="/docs/developer/architecture" className="text-blue-400 hover:underline">Architecture Overview</Link> to understand 
                how the application is structured into four main branches: Core Runtime, Main Process, Code Generation, and Studio UI.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-violet-400 mb-2">2. Explore Core Modules</h3>
              <p className="text-sm text-zinc-400">
                The <Link href="/docs/developer/core" className="text-violet-400 hover:underline">Core Modules</Link> run inside the browser 
                context and handle recording, locator extraction, and page classification. This is where the magic happens.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-400 mb-2">3. Learn the Main Process</h3>
              <p className="text-sm text-zinc-400">
                The <Link href="/docs/developer/main-process" className="text-green-400 hover:underline">Main Process</Link> orchestrates 
                everything, manages IPC communication, and provides services for recording, testing, and integrations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">4. Study Code Generation</h3>
              <p className="text-sm text-zinc-400">
                <Link href="/docs/developer/generators" className="text-yellow-400 hover:underline">Code Generators</Link> transform 
                recorded steps into executable Playwright tests and Page Object Model classes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📚 All Documentation is TSDoc Generated</h3>
          <p className="text-zinc-300 text-sm">
            Every class, method, and function in the codebase includes comprehensive TSDoc comments. 
            Use your IDE's hover tooltips or generate documentation using TypeScript's compiler to see 
            detailed information about any component.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

