"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Image, Monitor, Code, Settings, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";

interface Screenshot {
  title: string;
  description: string;
  image: string;
  category: string;
  icon: any;
}

const screenshots: Screenshot[] = [
  {
    title: "Dashboard Overview",
    description: "Get a comprehensive view of all your tests, recent runs, and quick actions",
    image: "/qa-studio-dashboard.png",
    category: "Overview",
    icon: Monitor
  },
  {
    title: "Visual Test Builder",
    description: "Build test steps visually by selecting actions and locators from your library",
    image: "/qa-studio-dashboard.png", // Replace with actual screenshot
    category: "Features",
    icon: Code
  },
  {
    title: "Step Editor",
    description: "Edit test steps directly from the UI with add, delete, and reorder capabilities",
    image: "/qa-studio-dashboard.png", // Replace with actual screenshot
    category: "Features",
    icon: Code
  },
  {
    title: "Locator Library",
    description: "Centralized locator management with status tracking and quality metrics",
    image: "/qa-studio-dashboard.png", // Replace with actual screenshot
    category: "Features",
    icon: Settings
  },
  {
    title: "Trace Viewer",
    description: "Debug test failures with Playwright traces and detailed execution logs",
    image: "/qa-studio-dashboard.png", // Replace with actual screenshot
    category: "Debugging",
    icon: Play
  },
  {
    title: "BrowseLocator Tool",
    description: "Interactive browser for capturing and evaluating locators with quality metrics",
    image: "/qa-studio-dashboard.png", // Replace with actual screenshot
    category: "Features",
    icon: Image
  }
];

const categories = Array.from(new Set(screenshots.map(s => s.category)));

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredScreenshots = selectedCategory
    ? screenshots.filter(s => s.category === selectedCategory)
    : screenshots;

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Product Gallery
          </h1>
          <p className="text-xl text-zinc-400">
            Explore QA Studio's interface and features through screenshots
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Screenshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreenshots.map((screenshot, index) => {
            const Icon = screenshot.icon;
            return (
              <motion.div
                key={screenshot.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 overflow-hidden group">
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshot.image}
                      alt={screenshot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        {screenshot.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{screenshot.title}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {screenshot.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: filteredScreenshots.length * 0.1 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl">Try QA Studio Today</CardTitle>
              <CardDescription>
                Download and start automating your tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Download Now
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

