import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Settings, MessageSquare, Database, Play, Folder } from "lucide-react";

export default function MainProcessPage() {
  const files = [
    {
      name: "Main Entry Point",
      file: "src/main/index.ts",
      icon: Play,
      color: "blue",
      description: "Electron main process entry point. Initializes the application, creates the main window, sets up IPC handlers, and manages the application lifecycle.",
      keyFeatures: [
        "Creates and configures the main BrowserWindow",
        "Initializes workspace manager and config manager",
        "Registers IPC handlers for test execution",
        "Sets up auto-updater service",
        "Handles application lifecycle events"
      ]
    },
    {
      name: "IPC Bridge",
      file: "src/main/bridge.ts",
      icon: MessageSquare,
      color: "violet",
      description: "IPC bridge between React UI and Node.js core. Handles all inter-process communication, providing a unified API for recording, code generation, test execution, workspace management, and integrations.",
      keyFeatures: [
        "3000+ lines of IPC handlers",
        "Recording sessions (start/stop)",
        "Code generation (specs, POMs)",
        "Test execution (local and BrowserStack)",
        "Workspace management",
        "Configuration management",
        "Integration services (Jira, BrowserStack TM, RAG)"
      ],
      keyHandlers: [
        "recorder:start / recorder:stop",
        "codegen:start / codegen:stop",
        "test:run / test:stop",
        "workspaces:list / workspaces:create",
        "jira:createDefectFromRun",
        "browserstackTm:syncTestCaseForBundle",
        "rag:chat"
      ]
    },
    {
      name: "Config Manager",
      file: "src/main/config-manager.ts",
      icon: Settings,
      color: "green",
      description: "Manages persistent application configuration using electron-store. Provides type-safe interface for storing workspace paths, D365 URLs, BrowserStack credentials, Jira settings, and AI provider configuration.",
      keyFeatures: [
        "Persists configuration to disk",
        "Workspace path management",
        "D365 environment URLs",
        "BrowserStack credentials and settings",
        "Jira integration settings",
        "AI provider configuration (OpenAI, DeepSeek, custom)",
        "Developer mode flags"
      ],
      keyMethods: [
        "getOrInitWorkspacePath() - Gets or creates workspace directory",
        "getD365Url() / setD365Url() - D365 environment URL",
        "getBrowserStackCredentials() - BrowserStack credentials",
        "getJiraConfig() / setJiraConfig() - Jira settings",
        "getAIConfig() / setAIConfig() - AI provider settings"
      ]
    },
    {
      name: "Preload Script",
      file: "src/main/preload.ts",
      icon: MessageSquare,
      color: "yellow",
      description: "Preload script that exposes safe IPC methods to renderer process via contextBridge. Follows Electron security best practices (context isolation enabled, nodeIntegration disabled).",
      keyFeatures: [
        "Exposes electronAPI global object to renderer",
        "Type-safe IPC communication",
        "All v1.5+ IPC methods",
        "Event listeners for real-time updates",
        "Jira, BrowserStack TM, and BrowserStack Automate APIs"
      ]
    },
    {
      name: "Test Executor",
      file: "src/main/test-executor.ts",
      icon: Play,
      color: "pink",
      description: "Executes Playwright tests in a child process. Provides simplified interface for running tests, syncing files from workspace to project directory, and streaming output to UI.",
      keyFeatures: [
        "Syncs test files from workspace to project",
        "Spawns Playwright test processes",
        "Streams output to UI in real-time",
        "Process lifecycle management",
        "Workspace-based execution context"
      ]
    }
  ];

  const services = [
    {
      name: "Recorder Service",
      file: "src/main/services/recorder-service.ts",
      description: "Orchestrates the recording process. Launches browser, starts/stops RecorderEngine, collects steps, converts to Playwright code in real-time, and sends updates to UI via IPC."
    },
    {
      name: "Test Runner",
      file: "src/main/services/test-runner.ts",
      description: "Executes Playwright tests with streaming output. Supports local and BrowserStack execution, test result aggregation, BrowserStack TM integration, and locator maintenance."
    },
    {
      name: "Workspace Manager",
      file: "src/main/services/workspace-manager.ts",
      description: "Manages multi-workspace architecture. Creates workspaces, lists existing ones, loads metadata, migrates between versions, and manages workspace types (D365, Web Demo, etc.)."
    },
    {
      name: "Jira Service",
      file: "src/main/services/jiraService.ts",
      description: "Jira integration for creating defect issues from failed test runs. Handles field schemas, uploads attachments, searches for duplicates using fingerprints, and generates defect descriptions."
    },
    {
      name: "RAG Service",
      file: "src/main/services/rag-service.ts",
      description: "AI-powered debugging service. Loads test context, builds system prompts, chats with LLM providers (OpenAI, DeepSeek, custom), and provides context-aware debugging suggestions."
    },
    {
      name: "BrowserStack TM Service",
      file: "src/main/services/browserstackTmService.ts",
      description: "BrowserStack Test Management integration. Handles test case creation/updates, test run publishing, bundle metadata integration, and connection testing."
    },
    {
      name: "BrowserStack Automate Service",
      file: "src/main/services/browserstackAutomateService.ts",
      description: "BrowserStack Automate API integration. Retrieves plan details, lists browsers/devices, fetches session information, and manages test sessions."
    },
    {
      name: "Codegen Service",
      file: "src/main/services/codegen-service.ts",
      description: "Launches and manages Playwright Codegen. Watches generated output file, parses code into RecordedStep objects, and sends code updates to UI in real-time."
    },
    {
      name: "Spec Writer",
      file: "src/main/services/spec-writer.ts",
      description: "Generates and writes Playwright test specifications. Creates parameterized tests, workspace-specific wait helpers, BrowserStack TM integration, and test metadata files."
    },
    {
      name: "Data Writer",
      file: "src/main/services/data-writer.ts",
      description: "Manages test data files for data-driven testing. Writes/reads JSON data files, creates backups, and organizes data by workspace type."
    },
    {
      name: "Locator Cleanup Service",
      file: "src/main/services/locator-cleanup-service.ts",
      description: "Cleans up and upgrades locators in codegen output. Uses ts-morph to parse TypeScript, upgrades CSS/XPath to semantic locators, and tracks locator mappings."
    }
  ];

  const utils = [
    {
      name: "Path Resolver",
      file: "src/main/utils/path-resolver.ts",
      description: "Handles file paths correctly in both Development and Production modes. Resolves runtime paths, reporter paths, and handles packaged vs development differences."
    },
    {
      name: "File Utils",
      file: "src/main/utils/file-utils.ts",
      description: "Safe file system utilities with retry logic for Windows filesystem locks. Handles EBUSY errors with automatic retries using fs-extra."
    },
    {
      name: "Playwright Runtime",
      file: "src/main/utils/playwrightRuntime.ts",
      description: "Provides fully self-contained Playwright runtime. Handles bundled Node.js and Playwright binaries, path resolution, and spawning Playwright processes."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link href="/docs/developer" className="inline-flex items-center text-zinc-400 hover:text-blue-400 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Developer Docs
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Main Process
          </h1>
          <p className="text-zinc-400 text-lg">
            The Electron main process orchestrates system resources, IPC communication, and backend services. 
            This is where all the heavy lifting happens.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Core Files</h2>
          <div className="space-y-6">
            {files.map((file, index) => {
              const Icon = file.icon;
              const colorClasses = {
                blue: "border-blue-500/30 bg-blue-500/10",
                violet: "border-violet-500/30 bg-violet-500/10",
                green: "border-green-500/30 bg-green-500/10",
                yellow: "border-yellow-500/30 bg-yellow-500/10",
                pink: "border-pink-500/30 bg-pink-500/10",
              };

              return (
                <div key={index} className={`border rounded-lg p-6 ${colorClasses[file.color as keyof typeof colorClasses]}`}>
                  <div className="flex items-start mb-4">
                    <Icon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
                      <code className="text-xs text-zinc-400 font-mono bg-zinc-900/50 px-2 py-1 rounded">
                        {file.file}
                      </code>
                    </div>
                  </div>
                  
                  <p className="text-zinc-300 mb-4">{file.description}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-zinc-200">Key Features</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                        {file.keyFeatures.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    {file.keyMethods && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-zinc-200">Key Methods</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                          {file.keyMethods.map((method, i) => (
                            <li key={i}><code className="text-zinc-300">{method}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {file.keyHandlers && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-zinc-200">IPC Handlers</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                          {file.keyHandlers.map((handler, i) => (
                            <li key={i}><code className="text-zinc-300">{handler}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-400 mb-2">{service.name}</h3>
                <code className="text-xs text-zinc-500 font-mono block mb-2">{service.file}</code>
                <p className="text-sm text-zinc-400">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Utilities</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {utils.map((util, index) => (
              <div key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-cyan-400 mb-2">{util.name}</h3>
                <code className="text-xs text-zinc-500 font-mono block mb-2">{util.file}</code>
                <p className="text-sm text-zinc-400">{util.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex gap-4">
          <Link href="/docs/developer/core" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-violet-500/50 transition-colors">
            <h3 className="font-semibold text-violet-400 mb-2">← Previous: Core Modules</h3>
            <p className="text-sm text-zinc-400">Browser-side recording components</p>
          </Link>
          <Link href="/docs/developer/generators" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-yellow-500/50 transition-colors">
            <h3 className="font-semibold text-yellow-400 mb-2">Next: Code Generators →</h3>
            <p className="text-sm text-zinc-400">Spec and POM generation</p>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

