"use client";

import { DocLink } from "./DocLink";
import { DocTooltip } from "./DocTooltip";

interface KeywordConfig {
  term: string;
  type: "link" | "tooltip" | "both";
  href?: string;
  explanation?: string;
  linkText?: string;
}

const keywordMap: KeywordConfig[] = [
  {
    term: "Assertion Engine",
    type: "both",
    href: "/docs/advanced/assertion-engine",
    explanation: "First-class assertion support integrated into flows and code generation. Supports locator and page-level checks with parameterized expected values.",
  },
  {
    term: "parameterized assertions",
    type: "both",
    href: "/docs/advanced/assertion-engine",
    explanation: "Assertions that use {{param}} syntax to drive expected values from test data files, enabling data-driven validation.",
  },
  {
    term: "Parameterized Assertions",
    type: "both",
    href: "/docs/advanced/assertion-engine",
    explanation: "Assertions that use {{param}} syntax to drive expected values from test data files, enabling data-driven validation.",
  },
  {
    term: "{{param}}",
    type: "tooltip",
    explanation: "Syntax for parameterized values. Replaced with row.param from test data files during code generation.",
  },
  {
    term: "Multi-Workspace",
    type: "both",
    href: "/docs/architecture",
    explanation: "Workspace-based architecture allowing multiple platforms (D365, Web Demo) with unified infrastructure. Each workspace has its own flows, data, and configs.",
  },
  {
    term: "BrowserStack Test Management",
    type: "both",
    href: "/docs/advanced/enterprise-integrations",
    explanation: "Integration for syncing test cases and runs to BrowserStack TM. Automatic test case creation and run publishing with assertion metadata.",
  },
  {
    term: "BrowserStack TM",
    type: "both",
    href: "/docs/advanced/enterprise-integrations",
    explanation: "BrowserStack Test Management - Integration for syncing test cases and runs with automatic test case creation and run publishing.",
  },
  {
    term: "Jira Integration",
    type: "both",
    href: "/docs/advanced/enterprise-integrations",
    explanation: "One-click defect creation from failed test runs with pre-filled test failure details, repro steps, and BrowserStack session links.",
  },
  {
    term: "Electron Auto-Updates",
    type: "both",
    href: "/docs/advanced/auto-updates",
    explanation: "Automatic updates via GitHub Releases using electron-updater. Download progress tracking and one-click restart to install.",
  },
  {
    term: "auto-updates",
    type: "both",
    href: "/docs/advanced/auto-updates",
    explanation: "Automatic updates via GitHub Releases using electron-updater. Download progress tracking and one-click restart to install.",
  },
  {
    term: "Playwright Runtime",
    type: "tooltip",
    explanation: "Bundled Playwright runtime included with QA Studio. Fixed detection and error handling in v2.0 to remove dependency on system Node/cmd.exe.",
  },
  {
    term: "RAG",
    type: "both",
    href: "/docs/advanced/rag-architecture",
    explanation: "Retrieval-Augmented Generation - AI-powered debugging system that analyzes failed tests and explains why they failed.",
  },
  {
    term: "Page Object Model",
    type: "tooltip",
    explanation: "Design pattern for organizing locators. QA Studio generates POM classes but also supports inline locators for flexibility.",
  },
  {
    term: "POM",
    type: "tooltip",
    explanation: "Page Object Model - Design pattern for organizing locators. QA Studio generates POM classes but also supports inline locators.",
  },
  {
    term: "SpecGenerator",
    type: "tooltip",
    explanation: "Code generation component that translates recorded steps into Playwright test specifications (.spec.ts files).",
  },
  {
    term: "data-driven",
    type: "tooltip",
    explanation: "Testing approach where test data is separated from test logic, allowing multiple test scenarios from a single test file.",
  },
  {
    term: "workspace",
    type: "both",
    href: "/docs/architecture",
    explanation: "Platform-specific configuration container. Each workspace (D365, Web Demo) has its own flows, data files, and settings while sharing the same infrastructure.",
  },
  {
    term: "workspaces",
    type: "both",
    href: "/docs/architecture",
    explanation: "Platform-specific configuration containers. Each workspace (D365, Web Demo) has its own flows, data files, and settings while sharing the same infrastructure.",
  },
  {
    term: "locator",
    type: "both",
    href: "/docs/core-features/locator-system",
    explanation: "Selector used to identify elements on a page. QA Studio generates stable locators using platform-specific attributes and heuristics.",
  },
  {
    term: "locators",
    type: "both",
    href: "/docs/core-features/locator-system",
    explanation: "Selectors used to identify elements on a page. QA Studio generates stable locators using platform-specific attributes and heuristics.",
  },
  {
    term: "parameterization",
    type: "both",
    href: "/docs/core-features/parameterization",
    explanation: "Process of replacing hard-coded values with parameters from test data files, enabling data-driven testing.",
  },
  {
    term: "parameterized",
    type: "tooltip",
    explanation: "Values that come from test data files using {{param}} syntax, allowing the same test to run with different data sets.",
  },
  {
    term: "test data",
    type: "both",
    href: "/docs/core-features/parameterization",
    explanation: "External data files (JSON/Excel) containing test parameters. Used for data-driven testing with multiple scenarios.",
  },
  {
    term: "BrowserStack Automate",
    type: "tooltip",
    explanation: "Cloud-based test execution platform. QA Studio can run tests on BrowserStack's infrastructure with multiple browsers and platforms.",
  },
  {
    term: "test bundle",
    type: "tooltip",
    explanation: "Self-contained test artifact containing .spec.ts (executable code), .meta.json (metadata), and .meta.md (AI context).",
  },
  {
    term: "test bundles",
    type: "tooltip",
    explanation: "Self-contained test artifacts containing .spec.ts (executable code), .meta.json (metadata), and .meta.md (AI context).",
  },
];

function findKeyword(text: string, startIndex: number): { keyword: KeywordConfig; start: number; end: number } | null {
  let bestMatch: { keyword: KeywordConfig; start: number; end: number } | null = null;
  
  for (const keyword of keywordMap) {
    const index = text.indexOf(keyword.term, startIndex);
    if (index !== -1) {
      // Prefer longer matches and earlier matches
      if (!bestMatch || 
          keyword.term.length > bestMatch.keyword.term.length ||
          (keyword.term.length === bestMatch.keyword.term.length && index < bestMatch.start)) {
        bestMatch = {
          keyword,
          start: index,
          end: index + keyword.term.length,
        };
      }
    }
  }
  
  return bestMatch;
}

interface EnrichedTextProps {
  text: string;
  className?: string;
}

export function EnrichedText({ text, className = "" }: EnrichedTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const match = findKeyword(text, currentIndex);
    
    if (!match) {
      // No more keywords, add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      break;
    }

    // Add text before keyword
    if (match.start > lastIndex) {
      parts.push(text.slice(lastIndex, match.start));
    }

    // Add keyword with link/tooltip
    const { keyword } = match;
    if (keyword.type === "link" || keyword.type === "both") {
      parts.push(
        <DocLink key={`link-${match.start}`} href={keyword.href!}>
          {keyword.term}
        </DocLink>
      );
    } else if (keyword.type === "tooltip") {
      parts.push(
        <DocTooltip
          key={`tooltip-${match.start}`}
          term={keyword.term}
          explanation={keyword.explanation!}
          link={keyword.href}
          linkText={keyword.linkText}
        />
      );
    } else {
      parts.push(keyword.term);
    }

    lastIndex = match.end;
    currentIndex = match.end;
  }

  return <span className={className}>{parts}</span>;
}

