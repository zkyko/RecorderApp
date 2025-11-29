import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQAccordion } from "@/components/FAQAccordion";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-zinc-400">
            Everything you need to know about QA Studio
          </p>
        </div>

        <FAQAccordion />
        
        <Card className="mt-12 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-xl">Still have questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 mb-4">
              Can't find the answer you're looking for? Please reach out to our support team.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Contact Support
            </Link>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

