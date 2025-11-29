"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Pencil, Code } from "lucide-react";

const workflowSteps = [
  {
    title: "Record (No Code)",
    description: "Capture complex workflows simply by clicking. Our engine handles the selectors, waits, and iframes automatically.",
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    title: "Edit (Low Code)",
    description: "Need to change a step? Don't dig through code. Use our visual Step Editor to reorder, modify, or inject logic instantly.",
    icon: Pencil,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
  },
  {
    title: "Scale (Pro Code)",
    description: "Under the hood, it generates standard Playwright code. Your SDETs can extend it, but your Manual QAs own the day-to-day.",
    icon: Code,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
];

export function CoreValue() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Automation Maintenance, Demystified
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            The biggest bottleneck in automation isn't creation—it's maintenance. QA Studio bridges the gap between manual testing and engineering.
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
                <Card className="h-full bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-zinc-900/70 transition-all duration-300 group">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${step.iconBg} ${step.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-zinc-400">
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

