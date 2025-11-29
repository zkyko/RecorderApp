"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";

const comparisons = [
  {
    title: "BrowserStack LCA",
    tagline: "Too Fragile",
    description: "Great for static webs, but breaks on D365's dynamic iframes.",
    icon: AlertTriangle,
    gradient: "from-red-500 to-orange-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
  },
  {
    title: "Executive Automats",
    tagline: "Too Expensive",
    description: "$100/seat and vendor lock-in. We wanted code we own.",
    icon: DollarSign,
    gradient: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    textColor: "text-yellow-400",
  },
  {
    title: "QA Studio",
    tagline: "Just Right",
    description: "Native Playwright output. Zero licensing costs. AI-driven stability.",
    icon: CheckCircle2,
    gradient: "from-blue-500 via-purple-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
    isSolution: true,
  },
];

export function OriginStory() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Why we built this
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            The control of Playwright. The speed of a Recorder. The intelligence of AI.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisons.map((comparison, index) => {
            const Icon = comparison.icon;
            return (
              <motion.div
                key={comparison.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`h-full bg-zinc-900/50 backdrop-blur-sm border ${comparison.borderColor} hover:border-opacity-70 transition-all duration-300 ${comparison.isSolution ? 'ring-2 ring-blue-500/30' : ''}`}>
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${comparison.gradient} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{comparison.title}</CardTitle>
                    <p className={`text-lg font-semibold mt-2 ${comparison.textColor}`}>
                      {comparison.tagline}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-zinc-400">
                      {comparison.description}
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

