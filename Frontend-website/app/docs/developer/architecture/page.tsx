import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Layers, GitBranch } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/docs/developer" className="inline-flex items-center text-slate-400 hover:text-blue-400 mb-8 transition-colors group">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Developer Docs
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            Architecture Overview
          </h1>
          <p className="text-slate-400 text-lg">
            FourHands Automation Suite is built on a modular architecture with four collaborating branches that work together 
            to provide a complete test automation solution.
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Layers className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold text-slate-100">System Architecture</h2>
            </div>
            <p className="text-slate-300 mb-4">
              FourHands Automation Suite is an Electron desktop application that orchestrates four collaborating branches:
            </p>
            <ol className="list-decimal list-inside space-y-4 text-slate-300">
              <li>
                <strong className="text-blue-400">Core Runtime</strong> – Playwright-powered recorder, locator extractor, 
                registry, and session utilities that run inside the browser context during capture.
              </li>
              <li>
                <strong className="text-blue-400">Main Process</strong> – Electron orchestration layer that brokers device 
                capabilities (filesystem, config, BrowserStack credentials) and exposes them via IPC services.
              </li>
              <li>
                <strong className="text-blue-400">Code Generation & Execution</strong> – Translates recorded steps into 
                TypeScript POMs/specs and executes them through Playwright.
              </li>
              <li>
                <strong className="text-blue-400">Studio UI</strong> – Mantine/React front-end that drives recording sessions, 
                artifact review, settings, and run management.
              </li>
            </ol>
          </section>

          <section className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <GitBranch className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold text-slate-100">Directory Structure</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/core/</h3>
                <p className="text-sm text-slate-400 mb-2">
                  Browser-side recorder, locators, registry, and session utilities. These modules run inside 
                  the Playwright browser context during recording.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-slate-500">recorder/</code> - Recording engine and event listeners</li>
                  <li><code className="text-slate-500">locators/</code> - Locator extraction strategies</li>
                  <li><code className="text-slate-500">classification/</code> - Page classification logic</li>
                  <li><code className="text-slate-500">registry/</code> - Page registry management</li>
                  <li><code className="text-slate-500">session/</code> - Session lifecycle management</li>
                  <li><code className="text-slate-500">playwright/</code> - Browser manager</li>
                  <li><code className="text-slate-500">utils/</code> - Identifier utilities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/main/</h3>
                <p className="text-sm text-slate-400 mb-2">
                  Electron main process that manages system resources, IPC communication, and backend services.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-slate-500">index.ts</code> - Main entry point</li>
                  <li><code className="text-slate-500">bridge.ts</code> - IPC handlers</li>
                  <li><code className="text-slate-500">config-manager.ts</code> - Configuration management</li>
                  <li><code className="text-slate-500">preload.ts</code> - Preload script</li>
                  <li><code className="text-slate-500">test-executor.ts</code> - Test execution</li>
                  <li><code className="text-slate-500">services/</code> - Backend services (recorder, test-runner, Jira, etc.)</li>
                  <li><code className="text-slate-500">utils/</code> - Path resolver, file utils, Playwright runtime</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/generators/</h3>
                <p className="text-sm text-slate-400 mb-2">
                  Pure functions that translate recorded steps into executable code.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-slate-500">spec-generator.ts</code> - Playwright test spec generation</li>
                  <li><code className="text-slate-500">pom-generator.ts</code> - Page Object Model generation</li>
                  <li><code className="text-slate-500">code-formatter.ts</code> - Code formatting utilities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/types/</h3>
                <p className="text-sm text-slate-400 mb-2">
                  TypeScript type definitions and interfaces used throughout the application.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-slate-500">index.ts</code> - Core types (RecordedStep, LocatorDefinition, etc.)</li>
                  <li><code className="text-slate-500">v1.5.ts</code> - v1.5+ type definitions</li>
                  <li><code className="text-slate-500">execution-context.ts</code> - Execution context types</li>
                  <li><code className="text-slate-500">browserstack-tm.ts</code> - BrowserStack TM types</li>
                  <li><code className="text-slate-500">capabilities.ts</code> - Browser capabilities</li>
                  <li><code className="text-slate-500">electron-api.ts</code> - Electron API types</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-400 mb-2">src/ui/</h3>
                <p className="text-sm text-slate-400 mb-2">
                  Mantine/React frontend providing the user interface.
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                  <li><code className="text-slate-500">src/components/</code> - React UI components</li>
                  <li><code className="text-slate-500">src/store/</code> - Zustand state management</li>
                  <li><code className="text-slate-500">src/hooks/</code> - React hooks</li>
                  <li><code className="text-slate-500">src/utils/</code> - UI utilities</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-slate-100">Data Flow</h2>
            <div className="space-y-3 text-slate-300 text-sm">
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
            <Link href="/docs/developer/core" className="flex-1 bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/50 hover:bg-blue-600/20 transition-all shadow-lg">
              <h3 className="font-semibold text-blue-400 mb-2">Next: Core Modules →</h3>
              <p className="text-sm text-slate-400">Learn about the recording engine and browser-side components</p>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}


