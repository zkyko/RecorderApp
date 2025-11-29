import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Github, ExternalLink, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
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
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-zinc-400">
            We're here to help. Choose the best way to reach us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* GitHub Issues */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Github className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">GitHub Issues</CardTitle>
              </div>
              <CardDescription>
                Report bugs, request features, or ask technical questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4 text-sm">
                For bug reports, feature requests, and technical discussions, GitHub Issues is the best place to get help from the community and maintainers.
              </p>
              <a
                href="https://github.com/zkyko/RecorderApp/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Open GitHub Issues
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Documentation</CardTitle>
              </div>
              <CardDescription>
                Comprehensive guides and API documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4 text-sm">
                Check our documentation for detailed guides, architecture overview, and troubleshooting tips.
              </p>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Browse Docs
                <ExternalLink className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-cyan-500/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">FAQ</CardTitle>
              </div>
              <CardDescription>
                Find answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4 text-sm">
                Browse our frequently asked questions for quick answers about installation, features, and usage.
              </p>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                View FAQ
                <ExternalLink className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Confluence */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Confluence</CardTitle>
              </div>
              <CardDescription>
                Internal documentation and planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4 text-sm">
                Access our internal Confluence space for detailed planning documents and architecture discussions.
              </p>
              <a
                href="https://fourhands.atlassian.net/wiki/spaces/QAAutomation/pages/4281532810/QA+Automation+Plan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Open Confluence
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Support Response Time */}
        <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-xl">Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-white">GitHub Issues:</strong> Community-driven support. Maintainers typically respond within 1-3 business days.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-white">Documentation:</strong> Available 24/7. Self-service guides and troubleshooting.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-white">FAQ:</strong> Instant answers to common questions.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

