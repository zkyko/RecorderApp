"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Bug,
  Database,
  Cloud,
  Sparkles,
  Crosshair,
  Edit3,
  Eye,
  Code2,
  Layers,
  Zap,
  Shield,
  GitBranch,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  iconBg: string;
  category: "recording" | "intelligence" | "development" | "execution";
  highlights: string[];
  unique?: boolean;
}

const features: Feature[] = [
  {
    title: "Smart Recorder Engine",
    description: "Platform-aware recorder that automatically handles async loading states, dynamic iframes, and navigation patterns. Pluggable locator logic adapts to any platform—currently optimized for D365, with Koerber and Salesforce support coming soon.",
    icon: Video,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
    category: "recording",
    unique: true,
    highlights: [
      "Pluggable locator algorithms",
      "Platform-specific heuristics",
      "Automatic async state handling",
      "Extensible to any enterprise app"
    ]
  },
  {
    title: "Visual Test Builder (BETA)",
    description: "Build test steps visually by selecting locators and actions. No coding required—just point, click, and generate production-ready Playwright code.",
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-500",
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/20",
    category: "development",
    unique: true,
    highlights: [
      "Drag-and-drop test construction",
      "Real-time code preview",
      "Integrated with locator library",
      "Follows same workflow as manual recording"
    ]
  },
  {
    title: "AI Forensics Engine",
    description: "RAG-powered debugging system that analyzes failed tests and explains why they failed. Turn 30 minutes of debugging into 30 seconds.",
    icon: Bug,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
    category: "intelligence",
    unique: true,
    highlights: [
      "Analyzes .spec.ts code + failure logs",
      "Explains root cause in plain English",
      "Suggests fixes automatically",
      "Self-healing test automation"
    ]
  },
  {
    title: "BrowseLocator Tool",
    description: "Interactive browser for capturing and evaluating locators with quality metrics. See locator strength, uniqueness, and usability scores in real-time.",
    icon: Crosshair,
    gradient: "from-cyan-500 to-teal-500",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
    category: "development",
    unique: true,
    highlights: [
      "Click-based locator capture",
      "Quality scoring (excellent/good/medium/poor)",
      "Uniqueness evaluation",
      "Direct integration with locator library"
    ]
  },
  {
    title: "Editable Steps Tab",
    description: "Edit test steps directly from the UI. Add, delete, reorder, and modify steps without touching code. Changes sync automatically to spec files.",
    icon: Edit3,
    gradient: "from-indigo-500 to-blue-500",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/20",
    category: "development",
    unique: true,
    highlights: [
      "In-place step editing",
      "Drag-and-drop reordering",
      "Locator picker integration",
      "Real-time spec file updates"
    ]
  },
  {
    title: "Locator Library",
    description: "Centralized locator management with status tracking, health monitoring, and cross-test synchronization. Know which locators are healthy, failing, or need attention.",
    icon: Layers,
    gradient: "from-emerald-500 to-green-500",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    category: "development",
    unique: true,
    highlights: [
      "Status tracking (healthy/warning/failing)",
      "Cross-test locator synchronization",
      "Usage analytics per locator",
      "Custom locator support"
    ]
  },
  {
    title: "Data-Driven Testing",
    description: "Run 500+ test scenarios from a single spreadsheet. Seamlessly parameterize inputs for comprehensive regression testing without code duplication.",
    icon: Database,
    gradient: "from-amber-500 to-orange-500",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
    category: "execution",
    highlights: [
      "Excel/JSON data support",
      "Automatic parameter detection",
      "Batch test execution",
      "Data validation and preview"
    ]
  },
  {
    title: "Enhanced Trace Viewer",
    description: "Debug test failures with Playwright's powerful trace viewer. Step through execution, inspect network requests, and analyze DOM snapshots.",
    icon: Eye,
    gradient: "from-sky-500 to-blue-500",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/20",
    category: "intelligence",
    highlights: [
      "Full execution traces",
      "Network request inspection",
      "DOM snapshots at each step",
      "One-click trace debugging"
    ]
  },
  {
    title: "BrowserStack Integration",
    description: "Execute tests locally or scale to the cloud with one click. Run tests across multiple browsers and platforms without infrastructure setup.",
    icon: Cloud,
    gradient: "from-rose-500 to-pink-500",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/20",
    category: "execution",
    highlights: [
      "One-click cloud execution",
      "Multi-browser testing",
      "Parallel test runs",
      "No infrastructure needed"
    ]
  },
  {
    title: "Dev Mode Tools",
    description: "Advanced developer controls for workspace management, temp file cleanup, statistics, and raw config access. Built for power users.",
    icon: Zap,
    gradient: "from-yellow-500 to-amber-500",
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    category: "development",
    highlights: [
      "Workspace statistics",
      "Temp file cleanup",
      "Raw config JSON viewer",
      "Workspace structure rebuild"
    ]
  },
  {
    title: "Pluggable Locator Intelligence",
    description: "Platform-specific locator extraction with priority-based selection. Currently optimized for D365 (data-dyn-controlname, roles, labels), with pluggable algorithms for Koerber, Salesforce, and custom platforms.",
    icon: Shield,
    gradient: "from-green-500 to-emerald-500",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
    category: "intelligence",
    unique: true,
    highlights: [
      "Pluggable locator algorithms",
      "Platform-specific priority rules",
      "Accessibility-based selectors",
      "Easy to extend for new platforms"
    ]
  }
];

const categories = {
  recording: { label: "Recording", color: "text-violet-400" },
  intelligence: { label: "Intelligence", color: "text-blue-400" },
  development: { label: "Development", color: "text-indigo-400" },
  execution: { label: "Execution", color: "text-amber-400" },
};

export function FeaturesShowcase() {
  const uniqueFeatures = features.filter(f => f.unique);
  const otherFeatures = features.filter(f => !f.unique);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Built to Scale. Built to Last.
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-8">
          QA Studio isn't just a recorder. It's a complete automation workbench with a pluggable architecture that adapts to your platform. Start with D365, extend to Koerber, Salesforce, or any enterprise application.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-1.5">
            Pluggable Architecture
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-1.5">
            AI-Powered
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1.5">
            Enterprise-Ready
          </Badge>
        </div>
      </motion.div>

      {/* Unique Features Section */}
      <div className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            What Makes This Tool Different
          </h2>
          <p className="text-zinc-400 text-lg">
            A pluggable architecture that grows with your needs. Build custom locator logic for any platform and plug it in seamlessly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {uniqueFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-zinc-900/70 transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        Unique
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base text-zinc-400 mb-4">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* All Features by Category */}
      <div className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            Complete Feature Set
          </h2>
          <p className="text-zinc-400 text-lg">
            Everything you need for enterprise test automation across multiple platforms.
          </p>
        </motion.div>

        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryFeatures = features.filter(f => f.category === categoryKey);
          if (categoryFeatures.length === 0) return null;

          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h3 className={`text-2xl font-semibold mb-6 ${category.color} flex items-center gap-2`}>
                <div className={`w-1 h-6 ${category.color.replace('text-', 'bg-')} rounded-full`} />
                {category.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-zinc-900/70 transition-all duration-300 group">
                        <CardHeader>
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.iconBg} ${feature.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                          <CardDescription className="text-sm text-zinc-400">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {feature.highlights.slice(0, 3).map((highlight, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pluggable Architecture Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-violet-500/20 text-violet-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Pluggable Architecture
            </h3>
            <p className="text-zinc-300 mb-4 leading-relaxed">
              QA Studio uses a workspace-based architecture that makes it easy to extend to new platforms. Currently optimized for <strong className="text-white">Microsoft Dynamics 365</strong>, but the system is designed to support multiple workspaces.
            </p>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              To add support for a new platform (like Koerber or Salesforce), simply build the platform-specific locator extraction algorithm and plug it into the workspace system. The recorder, code generation, and execution layers remain the same.
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Current:</strong> D365 workspace with optimized locator logic</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Coming Soon:</strong> Koerber and Salesforce workspaces</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Future:</strong> Custom workspace support for any enterprise application</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20"
      >
        <PlayCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-4">
          Ready to Get Started?
        </h3>
        <p className="text-zinc-400 mb-6 max-w-2xl mx-auto">
          Download QA Studio and experience the difference. Currently optimized for D365, with support for Koerber, Salesforce, and more coming soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/download"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Download Now
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center px-6 py-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors font-medium"
          >
            Read Documentation
          </a>
        </div>
      </motion.div>
    </div>
  );
}

