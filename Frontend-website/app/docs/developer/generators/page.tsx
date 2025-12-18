import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, FileCode, Sparkles, Wand2 } from "lucide-react";

export default function GeneratorsPage() {
  const generators = [
    {
      name: "Spec Generator",
      file: "src/generators/spec-generator.ts",
      icon: FileCode,
      color: "blue",
      description: "Generates Playwright test spec files in TypeScript. Converts recorded steps into executable Playwright test specifications with data-driven test support.",
      responsibilities: [
        "Filters out invalid steps (navigation, body-only locators)",
        "Generates data-driven tests with parameter support",
        "Creates proper imports for Page Object Model classes",
        "Handles assertions, waits, and custom actions",
        "Organizes tests in bundle structure: tests/d365/specs/<TestName>/"
      ],
      keyMethods: [
        "generateSpec() - Main method to generate spec file",
        "detectParametersFromSteps() - Detects parameters from steps",
        "generateInitialDataFile() - Creates initial data file structure",
        "generateSpecContent() - Generates the spec file content"
      ],
      outputStructure: {
        path: "tests/d365/specs/<TestName>/<TestName>.spec.ts",
        dataFile: "tests/d365/data/<TestName>Data.json",
        imports: "Page Object Model classes, test data",
        structure: "Data-driven test with forEach loop"
      }
    },
    {
      name: "POM Generator",
      file: "src/generators/pom-generator.ts",
      icon: Sparkles,
      color: "violet",
      description: "Generates Page Object Model (POM) classes in TypeScript. Creates reusable page object classes that encapsulate page elements and actions.",
      responsibilities: [
        "Groups steps by pageId to create one POM per page",
        "Generates locator fields using Playwright best practices",
        "Creates action methods (click, fill, select) for each interaction",
        "Preserves existing methods and fields when updating",
        "Extends D365BasePage for common D365 functionality",
        "Uses page registry for accurate class names and navigation"
      ],
      keyMethods: [
        "generatePOMs() - Generates POM files grouped by pageId",
        "generatePOMClass() - Generates a single POM class",
        "extractExistingMethods() - Preserves existing methods",
        "extractExistingFields() - Preserves existing fields",
        "generateLocatorField() - Creates locator field code",
        "generateActionMethod() - Creates action method code"
      ],
      outputStructure: {
        path: "tests/d365/pages/<PageName>.page.ts",
        extends: "D365BasePage",
        fields: "Locator fields (getByRole, getByLabel, etc.)",
        methods: "Action methods (clickNew, fillCustomerName, etc.)",
        staticProps: "Page identity (MI, CMP, routePath)"
      }
    },
    {
      name: "Code Formatter",
      file: "src/generators/code-formatter.ts",
      icon: Wand2,
      color: "green",
      description: "Handles file writing and optional code formatting. Writes generated files to disk, ensures directory structure exists, and provides basic code formatting.",
      responsibilities: [
        "Writes generated files (specs, POMs) to disk",
        "Creates directories as needed",
        "Basic code formatting (normalizing line endings)",
        "Handles file conflicts (overwrite, append, skip)"
      ],
      keyMethods: [
        "writeFiles() - Writes array of GeneratedFile objects",
        "formatCode() - Formats code content (basic normalization)",
        "handleFileConflict() - Checks and handles file conflicts"
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Code Generators
          </h1>
          <p className="text-zinc-400 text-lg">
            Pure functions that translate recorded steps into executable code. These generators create 
            Playwright test specifications and Page Object Model classes following best practices.
          </p>
        </div>

        <div className="space-y-8 mb-12">
          {generators.map((generator, index) => {
            const Icon = generator.icon;
            const colorClasses = {
              blue: "border-blue-500/30 bg-blue-500/10",
              violet: "border-violet-500/30 bg-violet-500/10",
              green: "border-green-500/30 bg-green-500/10",
            };

            return (
              <div key={index} className={`border rounded-lg p-6 ${colorClasses[generator.color as keyof typeof colorClasses]}`}>
                <div className="flex items-start mb-4">
                  <Icon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{generator.name}</h2>
                    <code className="text-xs text-zinc-400 font-mono bg-zinc-900/50 px-2 py-1 rounded">
                      {generator.file}
                    </code>
                  </div>
                </div>
                
                <p className="text-zinc-300 mb-4">{generator.description}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-zinc-200">Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                      {generator.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-zinc-200">Key Methods</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                      {generator.keyMethods.map((method, i) => (
                        <li key={i}><code className="text-zinc-300">{method}</code></li>
                      ))}
                    </ul>
                  </div>
                </div>

                {generator.outputStructure && (
                  <div className="bg-zinc-900/50 rounded p-4">
                    <h3 className="font-semibold text-sm mb-2 text-zinc-200">Output Structure</h3>
                    <div className="space-y-2 text-sm text-zinc-400">
                      {Object.entries(generator.outputStructure).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-zinc-300 font-mono text-xs">{key}:</span>{" "}
                          <span className="text-zinc-400">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Code Generation Flow</h2>
          <div className="space-y-3 text-zinc-300 text-sm">
            <div className="flex items-start">
              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">1</span>
              <div>
                <strong>Recorded Steps</strong> - User interactions captured as RecordedStep objects
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">2</span>
              <div>
                <strong>POM Generation</strong> - POMGenerator groups steps by pageId and creates Page Object classes
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">3</span>
              <div>
                <strong>Spec Generation</strong> - SpecGenerator creates test spec files with data-driven structure
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono mr-3 mt-1">4</span>
              <div>
                <strong>Code Formatting</strong> - CodeFormatter writes files to disk with proper formatting
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/docs/developer/main-process" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-colors">
            <h3 className="font-semibold text-green-400 mb-2">← Previous: Main Process</h3>
            <p className="text-sm text-zinc-400">Electron main process and IPC</p>
          </Link>
          <Link href="/docs/developer/services" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-pink-500/50 transition-colors">
            <h3 className="font-semibold text-pink-400 mb-2">Next: Services →</h3>
            <p className="text-sm text-zinc-400">Backend services and integrations</p>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

