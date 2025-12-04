"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bug, Wrench, Zap, CheckCircle2 } from "lucide-react";
import { EnrichedText } from "@/components/docs/EnrichedText";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "fix" | "improvement" | "update";
  title: string;
  description: string;
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.0.1",
    date: "December 4, 2025",
    type: "improvement",
    title: "Enhanced Jira Integration & Workspace-Aware Authentication",
    description: "Major improvements to Jira defect creation with automatic artifact inclusion and workspace-aware authentication system that adapts to D365 and Web Demo workspaces.",
    items: [
      "Enhanced Jira Defect Creation - Automatically includes all test artifacts: screenshots, trace files, videos, error messages, stack traces, assertion failures, and environment details",
      "Comprehensive Test Information - Jira defects now include execution environment (browser, OS, execution profile), test duration, retry count, failed locator details, and error location",
      "Multiple Screenshot Support - Upload all screenshots from test runs automatically to Jira issues",
      "Automatic Failure Artifact Loading - System automatically loads and includes failure artifacts (_failure.json) with error details, stack traces, and assertion information",
      "Workspace-Aware Authentication - Authentication & Storage State UI now switches between D365 and Web Demo based on current workspace",
      "Web Login Dialog - New dedicated login dialog for Web Demo workspaces with workspace-specific storage state (web.json)",
      "D365 Login Dialog - Existing D365 login dialog for D365 workspaces with D365 storage state (d365.json)",
      "Smart Storage State Detection - System automatically detects and validates the appropriate storage state file based on workspace type",
      "Enhanced Storage State Testing - Generic storage state validation that works for both D365 and web applications",
      "Workspace-Specific Storage Paths - Each workspace type uses its own storage state file (d365.json for D365, web.json for web-demo)",
      "Improved Error Context in Jira - Full error context including assertion failures, failed locators, and execution environment automatically included in defect descriptions"
    ]
  },
  {
    version: "2.0.0",
    date: "December 2025",
    type: "feature",
    title: "Version 2.0 - Multi-Workspace, Assertion Engine & Enterprise Integrations",
    description: "Major milestone release introducing universal assertion engine, multi-workspace support, BrowserStack Test Management, Jira integration, diagnostics, and a rock-solid foundation with stabilized runtime and auto-updates.",
    items: [
      "Universal Assertion Engine - First-class assertion support with locator and page-level checks (toHaveText, toContainText, toBeVisible, toHaveURL, toHaveTitle, toBeChecked, toHaveValue, toHaveAttribute)",
      "Parameterized Assertions - Use {{param}} syntax to drive assertions from test data files for data-driven validation",
      "Multi-Workspace Architecture - Web Demo workspace alongside D365, demonstrating unified architecture with workspace switching",
      "BrowserStack Test Management Integration - Sync test cases and runs to BrowserStack TM with automatic test case creation and run publishing",
      "Jira Defect Creation - One-click defect creation from failed test runs with pre-filled test failure details, repro steps, and BrowserStack session links",
      "Diagnostics / Self Test Screen - Run environment, workspace, and integration health checks directly inside QA Studio",
      "Stabilized Playwright Runtime - Fixed bundled runtime detection, removed hard dependency on cmd.exe, and improved error handling",
      "Electron Auto-Updates - Automatic updates via GitHub Releases with download progress and one-click restart to install",
      "Enhanced Logging - Fixed ERR_STREAM_WRITE_AFTER_END issues with proper stream lifecycle management",
      "Workspace Selector UI - Easy switching between D365 and Web Demo workspaces with unified workflow",
      "Assertion Step Editor - Visual assertion builder integrated into step editor with target picker and custom message support"
    ]
  },
  {
    version: "1.7.0",
    date: "December 1, 2025",
    type: "feature",
    title: "BrowserStack Integration & Enhanced Recorder Logic",
    description: "Major update adding full BrowserStack cloud testing integration and improved context-aware recording logic for more reliable test generation.",
    items: [
      "BrowserStack Test Management - Embedded BrowserStack TM interface directly in QA Studio sidebar with persistent login sessions",
      "BrowserStack Test Execution - Full cloud test execution support with automatic config generation, credential management, and environment variable handling",
      "Context-Aware Recorder - Smart navigation step preservation for workspace context (e.g., 'All sales orders' clicks now preserve navigation steps)",
      "Toolbar Button Context Tracking - Recorder now tracks workspace context and warns when toolbar buttons are used without proper navigation",
      "DOM-Aware Locator Detection - Enhanced heuristics using D365-specific attributes (data-dyn-controlname, data-dyn-menutext) for better context-setting click detection",
      "Windows Filesystem Lock Fix - Robust file deletion with fs-extra and automatic retry logic for EBUSY errors on Windows",
      "Improved Test Execution Logging - Better visibility into test runs with streaming output and error handling"
    ]
  },
  {
    version: "1.6.0",
    date: "December 2025",
    type: "feature",
    title: "Web Demo Mode - Try QA Studio in Your Browser",
    description: "Experience QA Studio's full interface directly in your browser with our new interactive web demo. No installation required - explore all features, see realistic mock data, and get a feel for the platform before downloading.",
    items: [
      "Interactive Web Demo - Full QA Studio UI accessible at /demo with no installation required",
      "Realistic Mock Data - Explore tests, runs, locators, and AI explanations with pre-populated demo data",
      "Guided Tour Mode - Step-by-step walkthrough highlighting key features and workflows",
      "Desktop-Only Feature Detection - Clear indicators when features require the desktop app",
      "Seamless UI Parity - Same React components and design as the desktop application",
      "Marketplace Preview - See integration vision for JIRA, BrowserStack, Salesforce, and more"
    ]
  },
  {
    version: "1.5.0",
    date: "November 28, 2025",
    type: "feature",
    title: "Visual Test Builder & Enhanced Workflow",
    description: "Major update introducing visual test building capabilities and improved locator management.",
    items: [
      "Visual Test Builder (BETA) - Build test steps visually by selecting locators and actions",
      "Complete workflow integration - Visual Builder now follows same flow as manual recording (Step Editor → Locator Cleanup → Parameter Mapping → Save Test)",
      "BrowseLocator Tool - Interactive browser for capturing and evaluating locators with quality metrics",
      "Editable Steps Tab - Edit test steps directly from the UI with add, delete, and reorder capabilities",
      "Locator Library - Centralized locator management with status tracking and synchronization",
      "Enhanced Trace Viewer - More prominent trace debugging with dedicated tab and improved visibility",
      "Dev Mode Settings - Advanced developer controls including workspace management, temp file cleanup, and statistics",
      "Fixed locator status saving - Status changes now persist correctly across the application"
    ]
  }
];

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    label: "Feature"
  },
  fix: {
    icon: Bug,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Fix"
  },
  improvement: {
    icon: Zap,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Improvement"
  },
  update: {
    icon: Wrench,
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    label: "Update"
  }
};

export function Changelog() {
  return (
    <div className="space-y-8">
      {changelog.map((entry, index) => {
        const config = typeConfig[entry.type];
        const Icon = config.icon;
        
        return (
          <Card key={index} className="p-6 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">{entry.title}</h2>
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    {entry.date.includes("Upcoming") && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs animate-pulse"
                      >
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span>v{entry.version}</span>
                    <span>•</span>
                    <span>{entry.date}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-zinc-300 mb-6 leading-relaxed">
              <EnrichedText text={entry.description} />
            </p>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                What's Included
              </h3>
              <ul className="space-y-2">
                {entry.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">
                      <EnrichedText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        );
      })}
      
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">
          Want to see what's coming next? Check out our{" "}
          <a href="/docs" className="text-blue-400 hover:text-blue-300 transition-colors">
            documentation
          </a>
          {" "}or{" "}
          <a 
            href="https://github.com/zkyko/RecorderApp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            GitHub repository
          </a>
          .
        </p>
      </div>
    </div>
  );
}

