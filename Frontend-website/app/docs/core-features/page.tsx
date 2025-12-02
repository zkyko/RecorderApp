import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Camera, Database, Play, Crosshair } from "lucide-react";

const coreFeatures = [
  {
    title: "Studio Recorder",
    description: "How the intelligent recorder captures and processes user interactions",
    icon: Camera,
    href: "/docs/core-features/studio-recorder",
  },
  {
    title: "Parameterization",
    description: "How test data parameters are detected, mapped, and injected",
    icon: Database,
    href: "/docs/core-features/parameterization",
  },
  {
    title: "Test Execution",
    description: "Complete test execution flow from preparation to results",
    icon: Play,
    href: "/docs/core-features/test-execution",
  },
  {
    title: "Locator System",
    description: "How locators are extracted, cleaned, and maintained",
    icon: Crosshair,
    href: "/docs/core-features/locator-system",
  },
];

export default function CoreFeaturesPage() {
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
            Core Features
          </h1>
          <p className="text-xl text-zinc-400">
            Deep dive into how QA Studio's core features work under the hood
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-zinc-400">
                      {feature.description}
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

