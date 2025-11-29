"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Sparkles, Badge } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface RoadmapItem {
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  version?: string;
  items: string[];
}

const roadmap: RoadmapItem[] = [
  {
    title: "Visual Test Builder",
    description: "Build test steps visually by selecting actions and locators",
    status: "completed",
    version: "v1.5.0",
    items: [
      "Visual step builder with action selection",
      "Locator picker integration",
      "Real-time code preview",
      "Full workflow integration (Step Editor → Locator Cleanup → Parameter Mapping)"
    ]
  },
  {
    title: "BrowseLocator Tool",
    description: "Interactive browser for capturing and evaluating locators",
    status: "completed",
    version: "v1.5.0",
    items: [
      "Click-based element tracking",
      "Quality metrics (score, uniqueness, usability)",
      "Last 5 clicked elements queue",
      "One-click locator library addition"
    ]
  },
  {
    title: "Editable Steps Tab",
    description: "Edit test steps directly from the UI",
    status: "completed",
    version: "v1.5.0",
    items: [
      "Add, delete, and reorder steps",
      "Inline code editing",
      "Unsaved changes indicator",
      "Automatic spec file updates"
    ]
  },
  {
    title: "Enhanced Trace Viewer",
    description: "More prominent trace debugging with dedicated tab",
    status: "completed",
    version: "v1.5.0",
    items: [
      "Dedicated Trace tab in test details",
      "List of runs with available traces",
      "Quick access from dashboard and test library",
      "Improved trace visibility across the app"
    ]
  },
  {
    title: "Koerber WMS Workspace",
    description: "Add Koerber-specific locator algorithms and workspace",
    status: "in-progress",
    items: [
      "Koerber-specific locator extraction",
      "Page classification for Koerber",
      "Koerber workspace configuration",
      "Integration with existing recorder engine"
    ]
  },
  {
    title: "Salesforce CRM Workspace",
    description: "Add Salesforce-specific locator algorithms and workspace",
    status: "planned",
    items: [
      "Salesforce component locator strategies",
      "Lightning Web Component support",
      "Salesforce workspace configuration",
      "Platform-specific navigation heuristics"
    ]
  },
  {
    title: "Advanced RAG System",
    description: "Enhanced AI debugging with vector search and semantic retrieval",
    status: "planned",
    items: [
      "Vector database integration (Chroma/Pinecone)",
      "Semantic search across test knowledge base",
      "Improved failure pattern matching",
      "Multi-test context aggregation"
    ]
  },
  {
    title: "Test Execution Dashboard",
    description: "Comprehensive dashboard for test run analytics and insights",
    status: "planned",
    items: [
      "Test execution history and trends",
      "Failure rate analytics",
      "Performance metrics tracking",
      "Custom report generation"
    ]
  },
  {
    title: "CI/CD Integration Templates",
    description: "Pre-built templates for popular CI/CD platforms",
    status: "planned",
    items: [
      "GitHub Actions templates",
      "Azure DevOps pipelines",
      "Jenkins integration",
      "GitLab CI templates"
    ]
  },
  {
    title: "Collaborative Features",
    description: "Team collaboration tools for shared test development",
    status: "planned",
    items: [
      "Shared locator library",
      "Test review and approval workflow",
      "Team workspace management",
      "Comment and annotation system"
    ]
  }
];

export default function RoadmapPage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-400" />;
      case "planned":
        return <Sparkles className="w-5 h-5 text-violet-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, version?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Completed {version && `(${version})`}
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            In Progress
          </Badge>
        );
      case "planned":
        return (
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
            Planned
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Product Roadmap
          </h1>
          <p className="text-xl text-zinc-400">
            See what we're building and what's coming next
          </p>
        </motion.div>

        <div className="space-y-6">
          {roadmap.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`bg-zinc-900/50 border-zinc-800 ${
                item.status === "completed" ? "border-green-500/30" :
                item.status === "in-progress" ? "border-blue-500/30" :
                "border-violet-500/30"
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        item.status === "completed" ? "bg-green-500/20 text-green-400" :
                        item.status === "in-progress" ? "bg-blue-500/20 text-blue-400" :
                        "bg-violet-500/20 text-violet-400"
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{item.title}</CardTitle>
                        <CardDescription className="text-zinc-400">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(item.status, item.version)}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.items.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          item.status === "completed" ? "bg-green-400" :
                          item.status === "in-progress" ? "bg-blue-400" :
                          "bg-violet-400"
                        }`}></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: roadmap.length * 0.1 }}
          className="mt-12"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300"><strong className="text-white">Completed:</strong> Feature is released and available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-300"><strong className="text-white">In Progress:</strong> Currently being developed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-zinc-300"><strong className="text-white">Planned:</strong> On the roadmap for future releases</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: (roadmap.length + 1) * 0.1 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Note:</strong> This roadmap is subject to change based on user feedback and priorities. 
                Have a feature request? <Link href="/contact" className="text-blue-400 hover:text-blue-300">Let us know</Link> or 
                open an issue on <a href="https://github.com/zkyko/RecorderApp/issues" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">GitHub</a>.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

