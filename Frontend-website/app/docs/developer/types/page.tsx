import { Footer } from "@/components/Footer";

import Link from "next/link";
import { ArrowLeft, Database, Type, FileCode } from "lucide-react";

export default function TypesPage() {
  const typeFiles = [
    {
      name: "Core Types",
      file: "src/types/index.ts",
      icon: Database,
      color: "blue",
      description: "Core type definitions for FourHands Automation Suite. Contains all the fundamental TypeScript types and interfaces used throughout the application.",
      types: [
        {
          name: "RecordedStep",
          description: "Represents a single recorded step in a test flow. Can be an action (click, fill, select, navigate), a wait, a comment, or an assertion.",
          fields: ["id", "pageId", "action", "description", "locator", "value", "order", "timestamp", "fieldName", "methodName", "pageUrl", "mi", "cmp", "pageType", "assertion", "target", "expected"]
        },
        {
          name: "RecordingSession",
          description: "Represents a recording session containing multiple recorded steps. Tracks a complete user flow from start to finish.",
          fields: ["id", "flowName", "module", "steps", "startedAt", "finishedAt", "targetRepo", "d365Env"]
        },
        {
          name: "LocatorDefinition",
          description: "Defines how to locate an element on a page. Uses a discriminated union to represent different locator strategies (role, label, text, testid, d365-controlname, css, xpath).",
          strategies: ["role", "label", "placeholder", "text", "testid", "d365-controlname", "css", "xpath"]
        },
        {
          name: "PageClassification",
          description: "Represents the classification of a page. Contains information about page type, ID, name, and pattern (ListPage, DetailsPage, Dialog, etc.).",
          fields: ["pageId", "pageName", "pattern", "url", "title", "breadcrumbs", "ignoreForPOM"]
        },
        {
          name: "PageIdentity",
          description: "Page identity extracted from URL and page content. Contains D365-specific navigation parameters (MI, CMP) and page metadata.",
          fields: ["pageId", "mi", "cmp", "caption", "type", "routePath", "url"]
        },
        {
          name: "PageRegistryEntry",
          description: "Page registry entry stored in JSON. Extends PageIdentity with generated class name and file path for Page Object Model.",
          fields: ["className", "filePath", "...PageIdentity fields"]
        },
        {
          name: "SessionConfig",
          description: "Configuration for starting a new recording session.",
          fields: ["flowName", "module", "targetRepo", "d365Env", "d365Url", "storageStatePath", "tags"]
        },
        {
          name: "OutputConfig",
          description: "Configuration for code generation output. Specifies where to write generated files and formatting options.",
          fields: ["pagesDir", "testsDir", "module", "formatCode"]
        },
        {
          name: "GeneratedFile",
          description: "Represents a generated file (POM or spec). Contains the file path and content for code generation output.",
          fields: ["path", "content", "type"]
        },
        {
          name: "AssertionKind",
          description: "Supported assertion kinds for test steps. These correspond to Playwright's expect() matchers.",
          values: ["toHaveText", "toContainText", "toBeVisible", "toHaveURL", "toHaveTitle", "toBeChecked", "toHaveValue", "toHaveAttribute"]
        }
      ]
    },
    {
      name: "v1.5 Types",
      file: "src/types/v1.5.ts",
      icon: Type,
      color: "violet",
      description: "Type definitions for v1.5+ features including workspace management, test execution, and enhanced IPC communication.",
      keyTypes: [
        "WorkspaceMeta - Workspace metadata and configuration",
        "TestMeta - Test metadata and information",
        "TestRunRequest - Test execution request",
        "TestRunEvent - Real-time test execution events",
        "RecorderStartRequest/Response - Recording session control",
        "CodegenStartRequest/Response - Codegen session control",
        "SpecWriteRequest/Response - Spec file writing",
        "DataWriteRequest/Response - Data file writing",
        "LocatorCleanupRequest/Response - Locator cleanup operations"
      ]
    },
    {
      name: "Execution Context",
      file: "src/types/execution-context.ts",
      icon: FileCode,
      color: "green",
      description: "Provider-agnostic execution context types. Used for tracking test execution environment across different providers (local, BrowserStack).",
      keyTypes: [
        "ExecutionContext - Base execution context",
        "LocalExecutionContext - Local execution details",
        "BrowserStackExecutionContext - BrowserStack execution details"
      ]
    },
    {
      name: "BrowserStack TM Types",
      file: "src/types/browserstack-tm.ts",
      icon: Database,
      color: "yellow",
      description: "Type definitions for BrowserStack Test Management API integration.",
      keyTypes: [
        "BrowserStackTmConfig - Configuration",
        "TestCase - Test case structure",
        "TestRun - Test run structure",
        "BundleMeta - Bundle metadata",
        "PaginatedResult - Pagination support",
        "BrowserStackTmError - Error types"
      ]
    },
    {
      name: "Capabilities",
      file: "src/types/capabilities.ts",
      icon: Type,
      color: "pink",
      description: "Browser capabilities types for test execution configuration.",
      keyTypes: [
        "BrowserCapability - Browser configuration",
        "OSCapability - Operating system configuration",
        "DeviceCapability - Device configuration"
      ]
    },
    {
      name: "Electron API Types",
      file: "src/types/electron-api.ts",
      icon: FileCode,
      color: "cyan",
      description: "TypeScript definitions for the Electron API exposed to the renderer process via preload script.",
      keyTypes: [
        "ElectronAPI - Main API interface",
        "IPC method signatures",
        "Event listener types"
      ]
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Type Definitions
          </h1>
          <p className="text-slate-400 text-lg">
            TypeScript type definitions and interfaces used throughout the application. These types provide 
            type safety and serve as documentation for the data structures used in FourHands Automation Suite.
          </p>
        </div>

        <div className="space-y-8">
          {typeFiles.map((typeFile, index) => {
            const Icon = typeFile.icon;
            const colorClasses = {
              blue: "border-blue-500/30 bg-blue-500/10",
              violet: "border-violet-500/30 bg-violet-500/10",
              green: "border-green-500/30 bg-green-500/10",
              yellow: "border-yellow-500/30 bg-yellow-500/10",
              pink: "border-pink-500/30 bg-pink-500/10",
              cyan: "border-cyan-500/30 bg-cyan-500/10",
            };

            return (
              <div key={index} className={`border rounded-lg p-6 ${colorClasses[typeFile.color as keyof typeof colorClasses]}`}>
                <div className="flex items-start mb-4">
                  <Icon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{typeFile.name}</h2>
                    <code className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                      {typeFile.file}
                    </code>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4">{typeFile.description}</p>

                {typeFile.types && (
                  <div className="space-y-4">
                    {typeFile.types.map((type, i) => (
                      <div key={i} className="bg-slate-900/50 rounded p-4">
                        <h3 className="font-semibold text-blue-400 mb-2">{type.name}</h3>
                        <p className="text-sm text-slate-400 mb-2">{type.description}</p>
                        {type.fields && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-300 mb-1">Fields:</h4>
                            <div className="flex flex-wrap gap-1">
                              {type.fields.map((field, j) => (
                                <code key={j} className="text-xs bg-zinc-800 px-2 py-1 rounded text-slate-300">
                                  {field}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {type.strategies && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-300 mb-1">Strategies:</h4>
                            <div className="flex flex-wrap gap-1">
                              {type.strategies.map((strategy, j) => (
                                <code key={j} className="text-xs bg-zinc-800 px-2 py-1 rounded text-slate-300">
                                  {strategy}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {type.values && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-300 mb-1">Values:</h4>
                            <div className="flex flex-wrap gap-1">
                              {type.values.map((value, j) => (
                                <code key={j} className="text-xs bg-zinc-800 px-2 py-1 rounded text-slate-300">
                                  {value}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {typeFile.keyTypes && (
                  <div className="space-y-2">
                    {typeFile.keyTypes.map((keyType, i) => (
                      <div key={i} className="bg-slate-900/50 rounded p-3">
                        <code className="text-sm text-slate-300">{keyType}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Type Safety Benefits</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✅ <strong>Compile-time checks</strong> - Catch errors before runtime</li>
            <li>✅ <strong>IDE autocomplete</strong> - Better developer experience</li>
            <li>✅ <strong>Self-documenting code</strong> - Types serve as documentation</li>
            <li>✅ <strong>Refactoring safety</strong> - TypeScript ensures consistency</li>
            <li>✅ <strong>API contracts</strong> - Clear interfaces between modules</li>
          </ul>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/docs/developer/services" className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:border-pink-500/50 transition-colors">
            <h3 className="font-semibold text-pink-400 mb-2">← Previous: Services</h3>
            <p className="text-sm text-slate-400">Backend services and integrations</p>
          </Link>
          <Link href="/docs/developer" className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
            <h3 className="font-semibold text-blue-400 mb-2">Back to Developer Docs →</h3>
            <p className="text-sm text-slate-400">Developer documentation overview</p>
          </Link>
        </div></div><Footer /></>
  );
}


