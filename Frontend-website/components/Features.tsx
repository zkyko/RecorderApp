"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Video, Database, Cloud } from "lucide-react";

const features = [
  {
    title: "The AI Forensics Engine",
    description: "When a test fails, our RAG agent analyzes the .spec.ts code alongside the failure logs to explain why it failed—turning 30 minutes of debugging into 30 seconds.",
    icon: Bug,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    title: "Smart Recorder",
    description: "Automatically handles D365's async loading states (waitForGridReady). No more hard-coded sleeps.",
    icon: Video,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
  },
  {
    title: "Data-Driven Core",
    description: "Run 500+ test scenarios from a single spreadsheet. Seamlessly parameterize inputs for regression testing.",
    icon: Database,
    gradient: "from-cyan-500 to-blue-500",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
  },
  {
    title: "BrowserStack Integration",
    description: "Execute locally or scale to the cloud with one click.",
    icon: Cloud,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
];

export function Features() {
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
            The precision of Code. The speed of Low-Code.
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            QA Studio isn't just a recorder. It's an IDE wrapper that enforces enterprise architectural patterns automatically.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-zinc-900/70 transition-all duration-300 group">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-zinc-400">
                      {feature.description}
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
