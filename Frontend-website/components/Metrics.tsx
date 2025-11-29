"use client";

import { motion } from "framer-motion";
import { Zap, DollarSign, CheckCircle2 } from "lucide-react";

const metrics = [
  {
    value: "90% Faster",
    label: "Reduction in test creation time vs. manual coding",
    sublabel: "Hours → Minutes",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    value: "$0 Licensing",
    label: "Built on open-source Playwright",
    sublabel: "Eliminating expensive vendor seats",
    icon: DollarSign,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    value: "100% Coverage",
    label: "Unified testing for ERP (D365), CRM (Salesforce), and WMS (Koerber)",
    sublabel: "One tool for your entire ecosystem",
    icon: CheckCircle2,
    gradient: "from-purple-500 to-pink-500",
  },
];

export function Metrics() {
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
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Engineered for ROI
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${metric.gradient} mb-6`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {metric.value}
                </h3>
                <p className="text-lg text-zinc-300 font-medium mb-2">
                  {metric.label}
                </p>
                <p className="text-sm text-zinc-500">
                  {metric.sublabel}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

