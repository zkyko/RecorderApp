"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Pencil, Code } from "lucide-react";

const workflowSteps = [
  {
    title: "Recording Engine",
    description: "Custom-built recorder that captures user interactions with D365-aware heuristics. Handles dynamic iframes, navigation panes, and complex DOM structures automatically.",
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    title: "Code Generation",
    description: "Transforms recorded steps into production-ready Playwright TypeScript code with Page Object Models. Maintains clean, maintainable code structure following best practices.",
    icon: Pencil,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
  },
  {
    title: "AI-Powered Debugging",
    description: "RAG-based system that analyzes test failures and provides intelligent explanations. Uses LLM integration (OpenAI/DeepSeek) to diagnose issues and suggest fixes.",
    icon: Code,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
];

export function CoreValue() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            Key Technical Features
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Three core systems that work together to create a complete automation solution
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 hover:border-blue-500/50 hover:bg-slate-900/70 transition-all duration-300 group shadow-lg">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${step.iconBg} ${step.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl text-slate-100">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-slate-400 leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
