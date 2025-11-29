"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is QA Studio?",
    answer: "QA Studio is a desktop application that transforms manual QA expertise into automated Playwright test scripts. It features a visual recorder, intelligent locator extraction, AI-powered debugging, and a pluggable architecture that supports multiple enterprise platforms like D365, with plans for Koerber and Salesforce.",
    category: "General"
  },
  {
    question: "Do I need programming knowledge to use QA Studio?",
    answer: "No! QA Studio is designed to eliminate the coding barrier. You can record test flows visually, and the tool generates Playwright test scripts automatically. The AI Debugger helps diagnose failures in plain English, making it accessible to QA engineers without programming backgrounds.",
    category: "Getting Started"
  },
  {
    question: "Which platforms does QA Studio support?",
    answer: "Currently, QA Studio is optimized for Microsoft Dynamics 365 Finance & Operations. The architecture is designed to be pluggable, with plans to add support for Koerber WMS and Salesforce CRM. Each platform gets its own workspace with platform-specific locator algorithms.",
    category: "Platforms"
  },
  {
    question: "How does the AI Debugger work?",
    answer: "The AI Debugger uses a Retrieval-Augmented Generation (RAG) system. When a test fails, it analyzes your test code, metadata, and failure context. It then searches your test knowledge base for similar failures and uses an LLM (OpenAI or DeepSeek) to provide intelligent diagnosis and fix suggestions in plain English.",
    category: "AI Features"
  },
  {
    question: "What LLM providers are supported?",
    answer: "QA Studio supports OpenAI (GPT-4, GPT-3.5-turbo) and DeepSeek. You can configure your API key in Settings → AI Debugger. The AI features are optional - you can use QA Studio for recording and test execution without an API key.",
    category: "AI Features"
  },
  {
    question: "How does the Visual Test Builder work?",
    answer: "The Visual Test Builder (BETA) allows you to construct test steps visually by selecting actions (click, fill, select, etc.) and choosing locators from your library. It generates Playwright code in real-time and follows the same workflow as manual recording (Step Editor → Locator Cleanup → Parameter Mapping → Save Test).",
    category: "Features"
  },
  {
    question: "What is the BrowseLocator tool?",
    answer: "BrowseLocator is an interactive browser tool that lets you navigate your application (like D365) while capturing elements you click. It shows the last 5 clicked elements with quality metrics (score, uniqueness, usability) and allows you to add them to your locator library with one click.",
    category: "Features"
  },
  {
    question: "Can I edit test steps after recording?",
    answer: "Yes! The Enhanced Steps Tab allows you to edit test steps directly from the UI. You can add, delete, reorder, and modify steps. Changes are saved back to the spec file automatically. There's also an 'Unsaved Changes' indicator to track modifications.",
    category: "Features"
  },
  {
    question: "How does locator status tracking work?",
    answer: "Each locator in your library can be marked with a status: Healthy, Flaky, Broken, or Untested. Status changes sync across the application - if you update a locator's status in a test's details, it automatically updates in the Locator Library and vice versa.",
    category: "Features"
  },
  {
    question: "What is a workspace?",
    answer: "A workspace is a container for your tests, locators, and data files. Each workspace is tailored to a specific platform (e.g., D365). Workspaces use platform-specific locator algorithms and page classification rules while sharing the same recording, code generation, and execution infrastructure.",
    category: "Architecture"
  },
  {
    question: "How do I run tests?",
    answer: "You can run tests locally using Playwright or on BrowserStack for cross-browser testing. Configure your execution profile in Settings. Test runs show real-time logs, screenshots, and traces. Failed tests can be debugged using the AI Debugger or by viewing Playwright traces.",
    category: "Execution"
  },
  {
    question: "What is the Test Bundle architecture?",
    answer: "Each test is organized as a bundle containing: (1) .spec.ts - the executable Playwright code, (2) .meta.json - structured metadata, and (3) .meta.md - AI-readable context file used by the RAG system for intelligent debugging. This structure makes tests self-contained and AI-debuggable.",
    category: "Architecture"
  },
  {
    question: "Is QA Studio free?",
    answer: "Yes! QA Studio is built on open-source Playwright and is free to use. There are no licensing fees. However, if you want to use the AI Debugger features, you'll need API keys from OpenAI or DeepSeek (which have their own pricing).",
    category: "Pricing"
  },
  {
    question: "Can I use QA Studio with CI/CD pipelines?",
    answer: "Yes! QA Studio generates standard Playwright test scripts that can be integrated into any CI/CD pipeline. The tests are compatible with GitHub Actions, Azure DevOps, Jenkins, and other CI/CD tools. You can also run tests headlessly for automation.",
    category: "Integration"
  },
  {
    question: "How do I get started?",
    answer: "1. Download QA Studio for your platform, 2. Create or load a workspace, 3. Configure your platform URL and authenticate, 4. Start recording your first test flow, 5. Review and save the generated test. Check out our Getting Started guide for detailed instructions.",
    category: "Getting Started"
  },
  {
    question: "What if I encounter issues?",
    answer: "Check the Troubleshooting section in our documentation. Common issues include authentication problems, locator detection issues, and browser compatibility. You can also use the Diagnostics card in Settings to verify your setup. For additional help, contact support.",
    category: "Support"
  }
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categories = Array.from(new Set(faqs.map(faq => faq.category).filter((cat): cat is string => Boolean(cat))));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((faq, index) => {
          const actualIndex = faqs.indexOf(faq);
          const isOpen = openIndex === actualIndex;

          return (
            <motion.div
              key={actualIndex}
              initial={false}
              className="border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(actualIndex)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-lg font-semibold text-white pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-zinc-400 flex-shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 text-zinc-300 border-t border-zinc-800">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

