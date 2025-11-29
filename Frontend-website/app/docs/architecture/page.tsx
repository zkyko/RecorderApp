import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArchitecturePage() {
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
            Architecture
          </h1>
          
          <h2>Test Bundles</h2>
          <p>
            QA Studio uses a "Test Bundle" architecture where each test consists of two files:
          </p>
          
          <h3>.spec.ts Files</h3>
          <p>
            The <code className="text-blue-400">.spec.ts</code> file contains your Playwright test code. This is the executable test script that runs your automation.
          </p>
          
          <h3>.meta.md Files</h3>
          <p>
            The <code className="text-blue-400">.meta.md</code> file contains metadata about your test, including:
          </p>
          <ul>
            <li>Test description and purpose</li>
            <li>Data requirements</li>
            <li>Configuration settings</li>
            <li>AI debugging context</li>
          </ul>
          
          <h2>How It Works</h2>
          <p>
            When you record a test flow, QA Studio generates both files automatically. The recorder captures your interactions and creates the test code, while also generating metadata that helps the AI Debugger understand your test's intent.
          </p>
        </article>
      </div>
      <Footer />
    </div>
  );
}

