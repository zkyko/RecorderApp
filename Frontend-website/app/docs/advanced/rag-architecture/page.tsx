import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Brain, Database, Search, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RAGArchitecturePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs/advanced"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advanced Docs
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              RAG Architecture
            </h1>
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
              AI-Powered
            </Badge>
          </div>
          <p className="text-xl text-zinc-400">
            How QA Studio's Retrieval-Augmented Generation system enables intelligent test failure diagnosis
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The RAG (Retrieval-Augmented Generation) system enables intelligent test failure diagnosis by combining:
              </p>
              <ul className="space-y-2 text-zinc-300 list-disc list-inside">
                <li><strong className="text-white">Structured test metadata</strong> from test bundles (.spec.ts, .meta.json, .meta.md)</li>
                <li><strong className="text-white">Failure forensics</strong> captured by custom Playwright reporters</li>
                <li><strong className="text-white">LLM inference</strong> to provide contextual debugging assistance</li>
                <li><strong className="text-white">No POM abstraction required</strong> - works directly with inline locators</li>
              </ul>
            </CardContent>
          </Card>

          {/* System Components */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">System Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Test Bundle Architecture</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    The Knowledge Base - Structured test artifacts with rich metadata (.spec.ts, .meta.json, .meta.md)
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-5 h-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Forensics Engine</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    The Data Source - Custom Playwright reporter that captures failure context, screenshots, and execution traces
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">RAG Workflow</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    The Brain - Retrieval and inference pipeline for AI-powered diagnosis using LLM providers (OpenAI/DeepSeek)
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Settings & Configuration</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    User-configurable LLM provider settings, API keys, and model selection (GPT-4, GPT-3.5, DeepSeek)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG Workflow Diagram */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">RAG Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-x-auto">
                <pre className="text-sm text-zinc-300 font-mono whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│                    Test Failure Occurs                        │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Forensics Engine Captures:                      │
│  • Error message & stack trace                               │
│  • Screenshot at failure point                               │
│  • Execution trace (Playwright trace)                        │
│  • Network requests & responses                              │
│  • DOM snapshot                                             │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RAG Retrieval Phase                              │
│                                                               │
│  1. Extract test context from .meta.md                       │
│  2. Load test spec code (.spec.ts)                           │
│  3. Search similar failures in knowledge base                │
│  4. Retrieve relevant test metadata                          │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM Inference Phase                               │
│                                                               │
│  Prompt = Failure Context + Retrieved Knowledge              │
│                                                               │
│  LLM analyzes:                                               │
│  • Why did the test fail?                                    │
│  • What locator might be broken?                             │
│  • What's the likely root cause?                             │
│  • Suggested fixes                                            │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Diagnosis Response                            │
│                                                               │
│  • Plain English explanation of failure                       │
│  • Root cause analysis                                        │
│  • Specific locator issues identified                        │
│  • Actionable fix suggestions                                │
│  • Confidence score                                           │
└─────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Test Bundle for RAG */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Test Bundle Structure (RAG Knowledge Base)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Each test bundle serves as a knowledge base entry for the RAG system:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`tests/
└── <TestName>/
    ├── <TestName>.spec.ts      # Executable code (for context)
    ├── <TestName>.meta.json    # Structured metadata
    └── <TestName>.meta.md      # AI-readable context (KEY for RAG)`}</pre>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    .meta.md - The AI Context File
                  </h4>
                  <p className="text-sm text-zinc-300 mb-2">
                    This Markdown file is <strong>crucial</strong> for RAG retrieval. It contains:
                  </p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside ml-4">
                    <li>Test Intent - What the test is trying to validate</li>
                    <li>Step-by-step descriptions in natural language</li>
                    <li>Locator context - What each locator targets</li>
                    <li>Expected behaviors and outcomes</li>
                    <li>Known issues and workarounds</li>
                    <li>Platform-specific notes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retrieval Process */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Retrieval Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">1. Failure Context Extraction</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    When a test fails, the Forensics Engine captures:
                  </p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside ml-4">
                    <li>Error message and stack trace</li>
                    <li>Failing line number in .spec.ts</li>
                    <li>Screenshot at failure point</li>
                    <li>DOM state at time of failure</li>
                    <li>Network activity leading up to failure</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">2. Semantic Search</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    The system searches the knowledge base (all .meta.md files) for:
                  </p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside ml-4">
                    <li>Similar error messages or patterns</li>
                    <li>Tests using the same locators</li>
                    <li>Related test scenarios</li>
                    <li>Historical fixes for similar issues</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">3. Context Assembly</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Retrieved context is assembled into a comprehensive prompt:
                  </p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside ml-4">
                    <li>Current test's .meta.md content</li>
                    <li>Failing test's .spec.ts code snippet</li>
                    <li>Similar failures from knowledge base</li>
                    <li>Failure forensics data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LLM Inference */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">LLM Inference & Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The assembled context is sent to the configured LLM provider (OpenAI or DeepSeek) with a structured prompt:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-3">Prompt Structure</h4>
                <div className="space-y-2 text-sm text-zinc-300 font-mono bg-zinc-900/50 p-4 rounded border border-zinc-600">
                  <div>1. Test Context (from .meta.md)</div>
                  <div>2. Test Code (failing section from .spec.ts)</div>
                  <div>3. Failure Details (error, screenshot, trace)</div>
                  <div>4. Similar Failures (retrieved from knowledge base)</div>
                  <div>5. Diagnosis Request (structured questions)</div>
                </div>
              </div>

              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">LLM Response Format</h4>
                <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside">
                  <li><strong>Root Cause:</strong> Plain English explanation of why the test failed</li>
                  <li><strong>Locator Analysis:</strong> Specific locator issues identified</li>
                  <li><strong>Fix Suggestions:</strong> Actionable steps to resolve the issue</li>
                  <li><strong>Confidence Score:</strong> How certain the diagnosis is (0-100%)</li>
                  <li><strong>Related Tests:</strong> Other tests that might be affected</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Benefits of RAG Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">⚡ Speed</h4>
                  <p className="text-sm text-zinc-400">
                    Turn 30 minutes of debugging into 30 seconds. Get instant, contextual diagnosis.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">🧠 Intelligence</h4>
                  <p className="text-sm text-zinc-400">
                    Learns from your test suite. Similar failures inform better diagnoses over time.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">📚 Knowledge Base</h4>
                  <p className="text-sm text-zinc-400">
                    Every test becomes part of the knowledge base, improving future diagnoses.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">🔍 Context-Aware</h4>
                  <p className="text-sm text-zinc-400">
                    Understands your test intent, not just the error message. Provides actionable fixes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Configure the RAG system in Settings → AI Debugger:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">LLM Provider</h4>
                  <p className="text-sm text-zinc-400">
                    Choose between OpenAI (GPT-4, GPT-3.5-turbo) or DeepSeek for cost-effective alternatives.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">API Key</h4>
                  <p className="text-sm text-zinc-400">
                    Securely stored in electron-store. Never exposed in code or logs.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-semibold text-white mb-2">Model Selection</h4>
                  <p className="text-sm text-zinc-400">
                    Select the model based on your needs: GPT-4 for best results, GPT-3.5-turbo or DeepSeek for cost efficiency.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                System Architecture
              </Link>
              <Link
                href="/docs/getting-started"
                className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Getting Started
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

