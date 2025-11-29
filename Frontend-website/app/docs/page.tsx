import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, BookOpen, Settings, Code, Sparkles } from "lucide-react";

const docCategories = [
  {
    title: "Getting Started",
    description: "Installation, Setup Keys (OpenAI/DeepSeek)",
    icon: Settings,
    href: "/docs/getting-started",
  },
  {
    title: "Architecture",
    description: "How the 'Test Bundles' work (.spec.ts + .meta.md)",
    icon: Code,
    href: "/docs/architecture",
  },
  {
    title: "Guides",
    description: "How to record your first flow, Using the AI Debugger",
    icon: BookOpen,
    href: "/docs/guides",
  },
  {
    title: "Advanced",
    description: "AI Vision, Complete Solution, LangChain Integration",
    icon: Sparkles,
    href: "/docs/advanced",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-xl text-zinc-400">
            Learn how to use QA Studio to build and maintain your test automation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {docCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.title} href={category.href}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-zinc-400">
                      {category.description}
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

