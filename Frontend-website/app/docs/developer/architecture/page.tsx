import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Layers, GitBranch } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link href="/docs/developer" className="inline-flex items-center text-zinc-400 hover:text-blue-400 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Developer Docs
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Architecture Overview
          </h1>
          <p className="text-zinc-400 text-lg">
            QA Studio is built on a modular architecture with four collaborating branches that work together 
            to provide a complete test automation solution.
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Layers className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">System Architecture</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              QA Studio is an Electron desktop application that orchestrates four collaborating branches:
            </p>
            <ol className="list-decimal list-inside space-y-4 text-zinc-300">
              <li>
                <strong className="text-blue-400">Core Runtime</strong> – Playwright-powered recorder, locator extractor, 
                registry, and session utilities that run inside the browser context during capture.
              </li>
              <li>
                <strong className="text-green-400">Main Process</strong> – Electron orchestration layer that brokers device 
                capabilities (filesystem, config, BrowserStack credentials) and exposes them via IPC services.
              </li>
              <li>
                <strong className="text-yellow-400">Code Generation & Execution</strong> – Translates recorded steps into 
                TypeScript POMs/specs and executes them through Playwright.
              </li>
              <li>
                <strong className="text-violet-400">Studio UI</strong> – Mantine/React front-end that drives recording sessions, 
                artifact review, settings, and run management.
              </li>
            </ol>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <GitBranch className="h-6 w-6 text-violet-400 mr-3" />
              <h2 className="text-2xl font-semibold">Directory Structure</h2>
            </div>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/core/</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Browser-side recorder, locators, registry, and session utilities. These modules run inside 
                  the Playwright browser context during recording.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-zinc-500">recorder/</code> - Recording engine and event listeners</li>
                  <li><code className="text-zinc-500">locators/</code> - Locator extraction strategies</li>
                  <li><code className="text-zinc-500">classification/</code> - Page classification logic</li>
                  <li><code className="text-zinc-500">registry/</code> - Page registry management</li>
                  <li><code className="text-zinc-500">session/</code> - Session lifecycle management</li>
                  <li><code className="text-zinc-500">playwright/</code> - Browser manager</li>
                  <li><code className="text-zinc-500">utils/</code> - Identifier utilities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-green-400 mb-2">src/main/</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Electron main process that manages system resources, IPC communication, and backend services.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-zinc-500">index.ts</code> - Main entry point</li>
                  <li><code className="text-zinc-500">bridge.ts</code> - IPC handlers</li>
                  <li><code className="text-zinc-500">config-manager.ts</code> - Configuration management</li>
                  <li><code className="text-zinc-500">preload.ts</code> - Preload script</li>
                  <li><code className="text-zinc-500">test-executor.ts</code> - Test execution</li>
                  <li><code className="text-zinc-500">services/</code> - Backend services (recorder, test-runner, Jira, etc.)</li>
                  <li><code className="text-zinc-500">utils/</code> - Path resolver, file utils, Playwright runtime</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-400 mb-2">src/generators/</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Pure functions that translate recorded steps into executable code.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-zinc-500">spec-generator.ts</code> - Playwright test spec generation</li>
                  <li><code className="text-zinc-500">pom-generator.ts</code> - Page Object Model generation</li>
                  <li><code className="text-zinc-500">code-formatter.ts</code> - Code formatting utilities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-violet-400 mb-2">src/types/</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  TypeScript type definitions and interfaces used throughout the application.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-zinc-500">index.ts</code> - Core types (RecordedStep, LocatorDefinition, etc.)</li>
                  <li><code className="text-zinc-500">v1.5.ts</code> - v1.5+ type definitions</li>
                  <li><code className="text-zinc-500">execution-context.ts</code> - Execution context types</li>
                  <li><code className="text-zinc-500">browserstack-tm.ts</code> - BrowserStack TM types</li>
                  <li><code className="text-zinc-500">capabilities.ts</code> - Browser capabilities</li>
                  <li><code className="text-zinc-500">electron-api.ts</code> - Electron API types</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-pink-400 mb-2">src/ui/</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Mantine/React frontend providing the user interface.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-zinc-500">src/components/</code> - React UI components</li>
                  <li><code className="text-zinc-500">src/store/</code> - Zustand state management</li>
                  <li><code className="text-zinc-500">src/hooks/</code> - React hooks</li>
                  <li><code className="text-zinc-500">src/utils/</code> - UI utilities</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Data Flow</h2>
            <div className="space-y-3 text-zinc-300 text-sm">
              <div className="flex items-start">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">1</span>
                <div>
                  <strong>User Interaction</strong> - User interacts with D365/web application in the browser
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">2</span>
                <div>
                  <strong>Event Capture</strong> - RecorderEngine captures events via EventListeners
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">3</span>
                <div>
                  <strong>Step Creation</strong> - Events converted to RecordedStep objects with locators
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">4</span>
                <div>
                  <strong>Code Generation</strong> - SpecGenerator and POMGenerator create test files
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">5</span>
                <div>
                  <strong>Test Execution</strong> - TestRunner executes generated tests via Playwright
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <Link href="/docs/developer/core" className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
              <h3 className="font-semibold text-blue-400 mb-2">Next: Core Modules →</h3>
              <p className="text-sm text-zinc-400">Learn about the recording engine and browser-side components</p>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

