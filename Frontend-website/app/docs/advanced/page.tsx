import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Brain, Layers, Link2, CheckSquare, Shield, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const advancedDocs: Array<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}> = [
  {
    title: "RAG Architecture",
    description: "How QA Studio's Retrieval-Augmented Generation system enables intelligent test failure diagnosis",
    icon: Brain,
    href: "/docs/advanced/rag-architecture",
  },
  {
    title: "Assertion Engine",
    description: "Universal assertion support integrated into flows and code generation with parameterized expected values",
    icon: CheckSquare,
    href: "/docs/advanced/assertion-engine",
    badge: "v2.0",
  },
  {
    title: "Enterprise Integrations",
    description: "BrowserStack Test Management and Jira integration architecture for centralized test tracking and defect management",
    icon: Shield,
    href: "/docs/advanced/enterprise-integrations",
    badge: "v2.0",
  },
  {
    title: "Auto-Updates",
    description: "Automatic updates via GitHub Releases using electron-updater with download progress and one-click installation",
    icon: Download,
    href: "/docs/advanced/auto-updates",
    badge: "v2.0",
  },
  {
    title: "AI Test Generation Vision",
    description: "Visionary approach to intelligent test automation powered by AI",
    icon: Brain,
    href: "/docs/advanced/ai-vision",
  },
  {
    title: "Complete Solution",
    description: "Comprehensive automation solution for enterprise D365 environments",
    icon: Layers,
    href: "/docs/advanced/complete-solution",
  },
  {
    title: "LangChain Integration",
    description: "Advanced document processing and intelligent retrieval architecture",
    icon: Link2,
    href: "/docs/advanced/langchain-integration",
  },
];

export default function AdvancedDocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Advanced Documentation
          </h1>
          <p className="text-xl text-zinc-400">
            Deep dive into AI-powered features and advanced architectures
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {advancedDocs.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link key={doc.title} href={doc.href}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {doc.badge && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {doc.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-zinc-400">
                      {doc.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}

