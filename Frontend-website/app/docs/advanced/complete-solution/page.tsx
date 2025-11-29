import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Callout } from "@/components/docs/Callout";
import { ArchitectureDiagram } from "@/components/docs/ArchitectureDiagram";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CompleteSolutionPage() {
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
            Four Hands QA Automation - Complete Solution
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8">
            A comprehensive automation solution for enterprise D365 environments.
          </p>

          <h2>QA Studio System Architecture</h2>
          
          <p className="mb-6">
            QA Studio is an Electron desktop application with a modular architecture. The system flows from recording user interactions, 
            through code generation, to test execution, and finally AI-powered debugging. Each layer builds upon the previous one, 
            creating a complete automation workbench for D365.
          </p>

          {/* Visual Architecture Diagram */}
          <ArchitectureDiagram />

          <Callout type="info" title="Excel Element Registry - Core Innovation">
            <p>
              The Excel Element Registry is the unique selling proposition of this solution. 
              It provides a centralized, maintainable way to manage UI elements across the 
              entire test suite.
            </p>
          </Callout>

          <h2>Element Registry Example</h2>
          
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse bg-zinc-900/50">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-800/50">
                  <th className="text-left p-3 text-zinc-300 font-semibold">Page</th>
                  <th className="text-left p-3 text-zinc-300 font-semibold">Element</th>
                  <th className="text-left p-3 text-zinc-300 font-semibold">Locator</th>
                  <th className="text-left p-3 text-zinc-300 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-3 text-zinc-400">SalesOrder</td>
                  <td className="p-3 text-zinc-400">CustomerAccount</td>
                  <td className="p-3 text-zinc-300 font-mono text-sm">[data-dyn-controlname="CustomerAccount"]</td>
                  <td className="p-3 text-zinc-400">Input</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 text-zinc-400">SalesOrder</td>
                  <td className="p-3 text-zinc-400">SaveButton</td>
                  <td className="p-3 text-zinc-300 font-mono text-sm">button:has-text("Save")</td>
                  <td className="p-3 text-zinc-400">Button</td>
                </tr>
                <tr>
                  <td className="p-3 text-zinc-400">SalesOrder</td>
                  <td className="p-3 text-zinc-400">OrderStatus</td>
                  <td className="p-3 text-zinc-300 font-mono text-sm">.order-status</td>
                  <td className="p-3 text-zinc-400">Display</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>JSON Configuration Example</h2>
          
          <pre className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{`{
  "testSuite": "D365_Sales",
  "version": "1.5.0",
  "modules": [
    {
      "name": "SalesOrder",
      "pages": ["CreateOrder", "EditOrder", "ViewOrder"]
    }
  ],
  "dataSources": {
    "customers": "./data/customers.json",
    "products": "./data/products.json"
  }
}`}</code>
          </pre>

          <h2>Playwright Code Snippet</h2>
          
          <pre className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{`import { test, expect } from '@playwright/test';
import { elementRegistry } from './registry';

test('Create Sales Order', async ({ page }) => {
  await page.goto(elementRegistry.urls.salesOrder);
  await page.fill(
    elementRegistry.locators.SalesOrder.CustomerAccount,
    'CUST-001'
  );
  await page.click(elementRegistry.locators.SalesOrder.SaveButton);
  await expect(page.locator(
    elementRegistry.locators.SalesOrder.OrderStatus
  )).toContainText('Created');
});`}</code>
          </pre>

          <div className="mt-8 p-4 bg-zinc-900/30 border border-white/10 rounded-lg">
            <p className="text-sm text-zinc-500 italic">
              <strong>Note:</strong> This page structure is ready for content. Please provide the 
              full content from the 'Four Hands QA Automation - Complete Solution' document to 
              complete this page.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}

