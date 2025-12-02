import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const versions = [
  {
    version: "v1.7.0",
    date: "December 2, 2025",
    windows: "https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-x64-v1.7.0.zip",
    windowsArm64: "https://github.com/zkyko/RecorderApp/releases/download/v1.7.0/QA-Studio-Windows-ARM64-v1.7.0.zip",
  },
];

export default function DownloadPage() {
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
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Download QA Studio
          </h1>
          <p className="text-xl text-zinc-400">
            Get the latest version of QA Studio for your platform
          </p>
        </div>
        
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.version}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{version.version}</CardTitle>
                    <CardDescription className="mt-2">
                      Released on {version.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      asChild
                    >
                      <a href={version.windows} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-5 w-5" />
                        Windows x64 (.zip)
                      </a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-1"
                      asChild
                    >
                      <a href={version.windowsArm64} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-5 w-5" />
                        Windows ARM64 (.zip)
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

