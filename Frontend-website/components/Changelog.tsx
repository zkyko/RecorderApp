"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bug, Wrench, Zap, CheckCircle2 } from "lucide-react";

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
    version: "1.5.0",
    date: "November 28, 2025 (Upcoming)",
    type: "feature",
    title: "Visual Test Builder & Enhanced Workflow",
    description: "Major update introducing visual test building capabilities and improved locator management. This version is currently in development and will be released soon.",
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
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                    {entry.date.includes("Upcoming") && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs animate-pulse">
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
              {entry.description}
            </p>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                What's Included
              </h3>
              <ul className="space-y-2">
                {entry.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{item}</span>
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

