"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Code, Zap } from "lucide-react";

const challenges = [
  {
    title: "The Problem",
    description: "Existing solutions were either too fragile for D365's dynamic DOM or too expensive with vendor lock-in. We needed a solution that generated maintainable code we could own.",
    icon: Lightbulb,
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  {
    title: "The Solution",
    description: "A custom-built recorder engine that understands D365's structure, combined with Playwright for execution and AI for debugging. All open-source, all maintainable.",
    icon: Code,
    gradient: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    title: "The Result",
    description: "A complete automation workbench that transforms manual QA expertise into production-ready test suites, with zero licensing costs and full code ownership.",
    icon: Zap,
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
];

export function OriginStory() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            The Journey
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From identifying the problem to building a complete solution
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`h-full bg-slate-900/50 backdrop-blur-sm border ${challenge.borderColor} hover:border-opacity-70 transition-all duration-300 shadow-lg`}>
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${challenge.gradient} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-slate-100">{challenge.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-slate-400 leading-relaxed">
                      {challenge.description}
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
