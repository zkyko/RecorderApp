import { Footer } from "@/components/Footer";

import Link from "next/link";
import { ArrowLeft, Package, Zap, Globe, MessageSquare, Database, Code, FileText, Play, Folder } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      name: "Recorder Service",
      file: "src/main/services/recorder-service.ts",
      icon: Zap,
      color: "blue",
      description: "Orchestrates the recording process. Launches browser, starts/stops RecorderEngine, collects steps, converts to Playwright code in real-time, and sends updates to UI via IPC.",
      keyMethods: ["start()", "stop()", "compileSteps()"]
    },
    {
      name: "Test Runner",
      file: "src/main/services/test-runner.ts",
      icon: Play,
      color: "green",
      description: "Executes Playwright tests with streaming output. Supports local and BrowserStack execution, test result aggregation, BrowserStack TM integration, and locator maintenance.",
      keyMethods: ["runTest()", "stopTest()", "streamOutput()"]
    },
    {
      name: "Workspace Manager",
      file: "src/main/services/workspace-manager.ts",
      icon: Folder,
      color: "violet",
      description: "Manages multi-workspace architecture. Creates workspaces, lists existing ones, loads metadata, migrates between versions, and manages workspace types (D365, Web Demo, etc.).",
      keyMethods: ["listWorkspaces()", "createWorkspace()", "loadWorkspace()", "ensureWorkspaceMigrated()"]
    },
    {
      name: "Jira Service",
      file: "src/main/services/jiraService.ts",
      icon: MessageSquare,
      color: "yellow",
      description: "Jira integration for creating defect issues from failed test runs. Handles field schemas, uploads attachments, searches for duplicates using fingerprints, and generates defect descriptions.",
      keyMethods: ["createDefect()", "searchIssues()", "getIssue()", "testConnection()"]
    },
    {
      name: "RAG Service",
      file: "src/main/services/rag-service.ts",
      icon: Database,
      color: "pink",
      description: "AI-powered debugging service. Loads test context, builds system prompts, chats with LLM providers (OpenAI, DeepSeek, custom), and provides context-aware debugging suggestions.",
      keyMethods: ["chatWithTest()", "loadTestContext()", "buildSystemPrompt()", "callLLM()"]
    },
    {
      name: "BrowserStack TM Service",
      file: "src/main/services/browserstackTmService.ts",
      icon: Globe,
      color: "cyan",
      description: "BrowserStack Test Management integration. Handles test case creation/updates, test run publishing, bundle metadata integration, and connection testing.",
      keyMethods: ["createOrUpdateTestCase()", "publishTestRun()", "listTestCases()", "testConnection()"]
    },
    {
      name: "BrowserStack Automate Service",
      file: "src/main/services/browserstackAutomateService.ts",
      icon: Globe,
      color: "orange",
      description: "BrowserStack Automate API integration. Retrieves plan details, lists browsers/devices, fetches session information, and manages test sessions.",
      keyMethods: ["getPlan()", "getBrowsers()", "getSession()", "getBuilds()"]
    },
    {
      name: "Codegen Service",
      file: "src/main/services/codegen-service.ts",
      icon: Code,
      color: "purple",
      description: "Launches and manages Playwright Codegen. Watches generated output file, parses code into RecordedStep objects, and sends code updates to UI in real-time.",
      keyMethods: ["start()", "stop()", "watchOutputFile()"]
    },
    {
      name: "Spec Writer",
      file: "src/main/services/spec-writer.ts",
      icon: FileText,
      color: "indigo",
      description: "Generates and writes Playwright test specifications. Creates parameterized tests, workspace-specific wait helpers, BrowserStack TM integration, and test metadata files.",
      keyMethods: ["writeSpec()", "generateMetadata()", "ensureStorageState()"]
    },
    {
      name: "Data Writer",
      file: "src/main/services/data-writer.ts",
      icon: Database,
      color: "teal",
      description: "Manages test data files for data-driven testing. Writes/reads JSON data files, creates backups, and organizes data by workspace type.",
      keyMethods: ["writeData()", "readData()"]
    },
    {
      name: "Locator Cleanup Service",
      file: "src/main/services/locator-cleanup-service.ts",
      icon: Code,
      color: "rose",
      description: "Cleans up and upgrades locators in codegen output. Uses ts-morph to parse TypeScript, upgrades CSS/XPath to semantic locators, and tracks locator mappings.",
      keyMethods: ["cleanup()", "upgradeLocator()", "applyNavigationCleanup()"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link href="/docs/developer" className="inline-flex items-center text-slate-400 hover:text-blue-400 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Developer Docs
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Services
          </h1>
          <p className="text-slate-400 text-lg">
            Backend services that provide core functionality for recording, testing, workspace management, 
            and integrations with external systems like Jira and BrowserStack.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            const colorMap = {
              blue: "border-blue-500/30 bg-blue-500/10",
              green: "border-green-500/30 bg-green-500/10",
              violet: "border-violet-500/30 bg-violet-500/10",
              yellow: "border-yellow-500/30 bg-yellow-500/10",
              pink: "border-pink-500/30 bg-pink-500/10",
              cyan: "border-cyan-500/30 bg-cyan-500/10",
              orange: "border-orange-500/30 bg-orange-500/10",
              purple: "border-purple-500/30 bg-purple-500/10",
              indigo: "border-indigo-500/30 bg-indigo-500/10",
              teal: "border-teal-500/30 bg-teal-500/10",
              rose: "border-rose-500/30 bg-rose-500/10",
            };

            return (
              <div key={index} className={`border rounded-lg p-6 ${colorMap[service.color as keyof typeof colorMap]}`}>
                <div className="flex items-start mb-4">
                  <Icon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                    <code className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded block">
                      {service.file}
                    </code>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4 text-sm">{service.description}</p>

                <div>
                  <h3 className="font-semibold text-sm mb-2 text-slate-200">Key Methods</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.keyMethods.map((method, i) => (
                      <code key={i} className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-300">
                        {method}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/docs/developer/generators" className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:border-yellow-500/50 transition-colors">
            <h3 className="font-semibold text-yellow-400 mb-2">← Previous: Code Generators</h3>
            <p className="text-sm text-slate-400">Spec and POM generation</p>
          </Link>
          <Link href="/docs/developer/types" className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
            <h3 className="font-semibold text-cyan-400 mb-2">Next: Type Definitions →</h3>
            <p className="text-sm text-slate-400">TypeScript types and interfaces</p>
          </Link>
        </div></div><Footer /></>
  );
}


