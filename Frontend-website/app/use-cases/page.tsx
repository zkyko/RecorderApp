"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Users, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const useCases = [
  {
    title: "Regression Testing",
    description: "Automate your entire regression suite without writing a single line of code. Record once, run forever.",
    icon: CheckCircle2,
    features: [
      "Record complete user journeys visually",
      "Generate data-driven test scripts automatically",
      "Run tests across multiple browsers and environments",
      "AI-powered debugging when tests fail"
    ],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "End-to-End Workflows",
    description: "Test complex business processes from start to finish, including multi-step transactions and approvals.",
    icon: TrendingUp,
    features: [
      "Capture entire business workflows",
      "Handle multi-page navigation automatically",
      "Support for nested iframes and dynamic content",
      "Parameterize inputs for data-driven testing"
    ],
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Cross-Browser Validation",
    description: "Ensure your application works consistently across Chrome, Firefox, Safari, and Edge without manual testing.",
    icon: Zap,
    features: [
      "Run tests on multiple browsers simultaneously",
      "BrowserStack integration for cloud testing",
      "Visual comparison of test results",
      "Automated screenshot capture on failures"
    ],
    gradient: "from-amber-500 to-orange-500"
  },
  {
    title: "Smoke Testing",
    description: "Quickly validate critical paths after deployments. Get instant feedback on whether core functionality works.",
    icon: ShoppingCart,
    features: [
      "Fast test execution for critical paths",
      "Parallel test execution for speed",
      "Real-time test results and reporting",
      "Integration with CI/CD pipelines"
    ],
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Accessibility Testing",
    description: "Verify that your application meets accessibility standards using role-based locators and semantic selectors.",
    icon: Users,
    features: [
      "Role-based locator extraction (ARIA)",
      "Semantic HTML element detection",
      "Accessibility-focused test generation",
      "Screen reader compatibility validation"
    ],
    gradient: "from-violet-500 to-indigo-500"
  },
  {
    title: "API + UI Integration Testing",
    description: "Combine UI automation with API testing to create comprehensive test scenarios that cover both frontend and backend.",
    icon: TrendingUp,
    features: [
      "Mix UI interactions with API calls",
      "Data setup via API before UI tests",
      "Verify API responses in UI context",
      "End-to-end validation of integrated systems"
    ],
    gradient: "from-rose-500 to-pink-500"
  }
];

export default function UseCasesPage() {
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
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Use Cases
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Discover how QA Studio can transform your testing workflow across different scenarios
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${useCase.gradient} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {useCase.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription>
                Download QA Studio and start automating your tests today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/download"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Download Now
                </Link>
                <Link
                  href="/docs/getting-started"
                  className="px-6 py-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors font-medium"
                >
                  View Getting Started Guide
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

