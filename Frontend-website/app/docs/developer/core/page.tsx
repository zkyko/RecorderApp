import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, FileCode, Zap, Search, Layers, Database, Users, Globe } from "lucide-react";

export default function CoreModulesPage() {
  const modules = [
    {
      name: "Recorder Engine",
      file: "src/core/recorder/recorder-engine.ts",
      icon: Zap,
      color: "blue",
      description: "Main recorder engine that coordinates event capture and step creation. Handles clicks, inputs, selects, and navigation events.",
      responsibilities: [
        "Starts and stops recording sessions",
        "Intercepts user interactions via DOM listeners and CDP hooks",
        "Converts DOM events into RecordedStep objects",
        "Extracts locators and page classifications",
        "Handles D365-specific navigation pane interactions",
        "Uses spatial heuristics for left-side click detection"
      ],
      keyMethods: [
        "startRecording() - Begins recording on a Playwright page",
        "stopRecording() - Stops the recording session",
        "handleEvent() - Processes intercepted DOM events",
        "handleClickEvent() - Converts clicks to steps with special D365 handling",
        "handleInputEvent() - Captures text input events",
        "handleSelectEvent() - Captures dropdown/select changes",
        "processClickElement() - Extracts metadata and creates step"
      ]
    },
    {
      name: "Event Listeners",
      file: "src/core/recorder/event-listeners.ts",
      icon: Zap,
      color: "violet",
      description: "Injects event listeners into the page to intercept user interactions. Uses context-level init scripts for iframe support.",
      responsibilities: [
        "Injects DOM event listeners at context level (runs in all frames)",
        "Captures click, input, and change events",
        "Debounces input events (800ms delay)",
        "Handles D365 navigation pane detection",
        "Forwards events to RecorderEngine"
      ],
      keyMethods: [
        "injectListeners() - Injects listeners into page context",
        "setupPlaywrightListeners() - Sets up Playwright request interception"
      ]
    },
    {
      name: "Locator Extractor",
      file: "src/core/locators/locator-extractor.ts",
      icon: Search,
      color: "green",
      description: "Extracts stable locators from DOM elements following Playwright best practices. Prioritizes semantic locators over structural ones.",
      responsibilities: [
        "Tries multiple locator strategies in priority order",
        "D365-specific: data-dyn-controlname (highest priority)",
        "Role-based: getByRole(role, { name })",
        "Label-based: getByLabel(text)",
        "Placeholder-based: getByPlaceholder(text)",
        "Text-based: getByText(text) for short, meaningful text",
        "Test ID-based: getByTestId()",
        "CSS/XPath fallback (flagged as potentially brittle)"
      ],
      keyMethods: [
        "extractLocator() - Main method to extract best locator",
        "tryD365ControlName() - D365-specific locator extraction",
        "tryRole() - Role-based locator using accessibility snapshot",
        "tryLabel() - Label-based locator extraction",
        "tryText() - Text-based locator (for short text only)"
      ]
    },
    {
      name: "Page Classifier",
      file: "src/core/classification/page-classifier.ts",
      icon: Layers,
      color: "yellow",
      description: "Classifies D365 pages into logical page IDs based on URL patterns, titles, and breadcrumbs. Identifies page types (ListPage, DetailsPage, etc.).",
      responsibilities: [
        "Extracts URL, title, and breadcrumbs",
        "Matches against known D365 patterns",
        "Filters out auth and redirect pages",
        "Infers page ID from URL structure",
        "Extracts page identity (MI, CMP, caption)"
      ],
      keyMethods: [
        "classifyPage() - Classifies current page",
        "extractPageIdentity() - Extracts MI, CMP, caption from page",
        "extractBreadcrumbs() - Gets breadcrumb navigation",
        "inferPageIdFromUrl() - Infers page ID from URL"
      ]
    },
    {
      name: "Page Registry",
      file: "src/core/registry/page-registry.ts",
      icon: Database,
      color: "pink",
      description: "Manages the page registry - a JSON file that tracks all discovered D365 pages. Maps page identities to metadata including class names and file paths.",
      responsibilities: [
        "Registers pages with metadata (className, filePath)",
        "Indexes pages by pageId and MI parameter",
        "Persists registry to disk as JSON",
        "Provides fast lookups for page objects"
      ],
      keyMethods: [
        "registerPage() - Registers or updates a page identity",
        "getPage() - Gets registry entry by pageId",
        "getPageByMi() - Gets registry entry by MI parameter",
        "getAllPages() - Gets all registered pages"
      ]
    },
    {
      name: "Session Manager",
      file: "src/core/session/session-manager.ts",
      icon: Users,
      color: "cyan",
      description: "Manages recording sessions - creation, state, and step collection. Tracks session lifecycle and automatically assigns order numbers and timestamps.",
      responsibilities: [
        "Creates and starts new recording sessions",
        "Tracks session state (startedAt, finishedAt)",
        "Collects and orders recorded steps",
        "Updates step descriptions",
        "Manages session lifecycle"
      ],
      keyMethods: [
        "startSession() - Creates and starts a new session",
        "stopSession() - Stops a session",
        "addStep() - Adds a step to a session",
        "getSessionSteps() - Gets all steps for a session",
        "updateStepDescription() - Updates a step's description"
      ]
    },
    {
      name: "Browser Manager",
      file: "src/core/playwright/browser-manager.ts",
      icon: Globe,
      color: "orange",
      description: "Manages Playwright browser lifecycle and D365 navigation. Handles browser instance creation, context management, and storage state validation.",
      responsibilities: [
        "Creates and manages browser instances",
        "Creates browser contexts with storage state",
        "Manages page navigation and lifecycle",
        "Validates storage state files",
        "Tests storage state functionality"
      ],
      keyMethods: [
        "launchBrowser() - Launches browser with options",
        "createContext() - Creates browser context",
        "navigateToD365() - Navigates to D365 with authentication",
        "testStorageState() - Validates storage state file",
        "closeBrowser() - Cleans up browser resources"
      ]
    },
    {
      name: "Identifier Utils",
      file: "src/core/utils/identifiers.ts",
      icon: FileCode,
      color: "purple",
      description: "Utilities for sanitizing text into valid JavaScript identifiers. Converts user-facing text (labels, captions) into safe identifiers for code generation.",
      responsibilities: [
        "Removes hotkey hints from text",
        "Strips problematic Unicode glyphs",
        "Converts text to PascalCase and camelCase",
        "Generates safe JavaScript identifiers",
        "Creates page class names"
      ],
      keyMethods: [
        "makeSafeIdentifier() - Creates valid JS identifier",
        "toPascalCase() - Converts to PascalCase",
        "toCamelCase() - Converts to camelCase",
        "makePageClassName() - Generates page class name",
        "normalizeText() - Normalizes text by removing hotkeys/glyphs"
      ]
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Core Modules
          </h1>
          <p className="text-zinc-400 text-lg">
            The core modules run inside the browser context during recording. They handle event capture, 
            locator extraction, page classification, and session management.
          </p>
        </div>

        <div className="space-y-8">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const colorClasses = {
              blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
              violet: "text-violet-400 border-violet-500/30 bg-violet-500/10",
              green: "text-green-400 border-green-500/30 bg-green-500/10",
              yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
              pink: "text-pink-400 border-pink-500/30 bg-pink-500/10",
              cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
              orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
              purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
            };

            return (
              <div key={index} className={`border rounded-lg p-6 ${colorClasses[module.color as keyof typeof colorClasses]}`}>
                <div className="flex items-start mb-4">
                  <Icon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{module.name}</h2>
                    <code className="text-xs text-zinc-400 font-mono bg-zinc-900/50 px-2 py-1 rounded">
                      {module.file}
                    </code>
                  </div>
                </div>
                
                <p className="text-zinc-300 mb-4">{module.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-zinc-200">Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                      {module.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-zinc-200">Key Methods</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                      {module.keyMethods.map((method, i) => (
                        <li key={i}><code className="text-zinc-300">{method}</code></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/docs/developer/architecture" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
            <h3 className="font-semibold text-blue-400 mb-2">← Previous: Architecture</h3>
            <p className="text-sm text-zinc-400">System architecture overview</p>
          </Link>
          <Link href="/docs/developer/main-process" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-colors">
            <h3 className="font-semibold text-green-400 mb-2">Next: Main Process →</h3>
            <p className="text-sm text-zinc-400">Electron main process and IPC</p>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

