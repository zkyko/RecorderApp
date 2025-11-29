import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Callout } from "@/components/docs/Callout";
import { Steps, Step } from "@/components/docs/Steps";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AIVisionPage() {
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
            AI Test Generation Vision
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8">
            A visionary approach to intelligent test automation powered by AI.
          </p>

          <Callout type="tip" title="Key Takeaway">
            <p>
              {/* Content from 'AI Test Generation Vision' document will go here */}
              The AI vision represents a paradigm shift from manual test creation to intelligent, 
              context-aware test generation that understands both the application structure and 
              testing best practices.
            </p>
          </Callout>

          <h2>System Intelligence Layers</h2>
          
          <Steps>
            <Step number={1} title="Context Understanding">
              <p>
                The system analyzes application structure, user flows, and business logic to 
                understand what needs to be tested.
              </p>
            </Step>
            <Step number={2} title="Pattern Recognition">
              <p>
                Identifies common testing patterns and applies them intelligently based on 
                the application context.
              </p>
            </Step>
            <Step number={3} title="Code Generation">
              <p>
                Generates production-ready test code that follows best practices and is 
                maintainable.
              </p>
            </Step>
            <Step number={4} title="Self-Improvement">
              <p>
                Learns from test execution results to continuously improve test quality and coverage.
              </p>
            </Step>
          </Steps>

          <h2>Real Example</h2>
          
          <p>Here's an example of AI-generated Playwright test code:</p>
          
          <pre className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{`import { test, expect } from '@playwright/test';

test('Create Sales Order', async ({ page }) => {
  // AI-generated test with intelligent waits
  await page.goto('https://d365.example.com');
  await page.waitForSelector('[data-dyn-controlname="SalesOrder"]');
  
  // Context-aware actions
  await page.click('text=New');
  await page.fill('[name="CustomerAccount"]', 'CUST-001');
  
  // Intelligent assertions
  await expect(page.locator('.order-status')).toContainText('Created');
});`}</code>
          </pre>

          <h2>Traditional Approach vs AI-Powered Approach</h2>
          
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-zinc-300 font-semibold">Aspect</th>
                  <th className="text-left p-4 text-zinc-300 font-semibold">Traditional</th>
                  <th className="text-left p-4 text-zinc-300 font-semibold">AI-Powered</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-4 text-zinc-400">Test Creation</td>
                  <td className="p-4 text-zinc-400">Manual coding</td>
                  <td className="p-4 text-zinc-300">Automated generation</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 text-zinc-400">Maintenance</td>
                  <td className="p-4 text-zinc-400">Manual updates</td>
                  <td className="p-4 text-zinc-300">Self-healing</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 text-zinc-400">Coverage</td>
                  <td className="p-4 text-zinc-400">Limited by time</td>
                  <td className="p-4 text-zinc-300">Comprehensive</td>
                </tr>
                <tr>
                  <td className="p-4 text-zinc-400">Intelligence</td>
                  <td className="p-4 text-zinc-400">Rule-based</td>
                  <td className="p-4 text-zinc-300">Context-aware</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-4 bg-zinc-900/30 border border-white/10 rounded-lg">
            <p className="text-sm text-zinc-500 italic">
              <strong>Note:</strong> This page structure is ready for content. Please provide the 
              full content from the 'AI Test Generation Vision' document to complete this page.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}

