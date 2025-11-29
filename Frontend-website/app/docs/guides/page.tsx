import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Guides
          </h1>
          
          <h2>Recording Your First Flow</h2>
          <ol>
            <li>Open QA Studio and navigate to the Recorder screen</li>
            <li>Click "Start Recording" to begin capturing your interactions</li>
            <li>Navigate through your D365 application as you normally would</li>
            <li>QA Studio will automatically capture all interactions, including those within nested iframes</li>
            <li>Click "Stop Recording" when you're done</li>
            <li>Review the generated test code and metadata</li>
          </ol>
          
          <h2>Using the AI Debugger</h2>
          <p>
            When a test fails, the AI Debugger can help you understand why:
          </p>
          <ol>
            <li>Navigate to the failed test in QA Studio</li>
            <li>Click "Debug with AI" to open the AI Debugger</li>
            <li>The RAG agent will analyze your test logs, code, and metadata</li>
            <li>Ask questions about the failure in natural language</li>
            <li>The AI will provide explanations and suggestions for fixing the issue</li>
          </ol>
          
          <h2>Data-Driven Testing</h2>
          <p>
            To run tests with multiple data scenarios:
          </p>
          <ol>
            <li>Create an Excel file or JSON file with your test data</li>
            <li>Import the file into QA Studio</li>
            <li>Configure your test to use the imported data</li>
            <li>Run the test - it will execute once for each row/scenario in your data file</li>
          </ol>
        </article>
      </div>
      <Footer />
    </div>
  );
}

