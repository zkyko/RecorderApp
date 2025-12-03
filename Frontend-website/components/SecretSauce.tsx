"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Globe, Zap, Play, Building2, Cloud, Package } from "lucide-react";

const engineFeatures = [
  {
    title: "Purpose-Built Heuristics",
    description: "Designed specifically to penetrate the dynamic DOMs of Dynamics 365, creating self-healing locators that survive updates.",
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    title: "Multi-Workspace Support",
    description: "Switch seamlessly between D365 and Web Demo workspaces. The same unified architecture adapts to any platform—currently supporting D365 and Web Demo, with Salesforce and Koerber WMS coming soon.",
    icon: Globe,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
  },
  {
    title: "Smart Synchronization",
    description: "Automatically injects intelligent waits (waitForGridReady) to handle the slow, asynchronous nature of enterprise ERPs.",
    icon: Zap,
    gradient: "from-cyan-500 to-blue-500",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
  },
];

export function SecretSauce() {
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
            One Recorder. Any Enterprise Platform.
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Off-the-shelf recorders fail on complex enterprise apps. So we built our own.
          </p>
        </motion.div>
        
        {/* Visual Engine Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative max-w-4xl mx-auto min-h-[500px] flex items-center justify-center">
            {/* Connecting Lines */}
            {/* Line to D365 (top) */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/3 bg-gradient-to-b from-blue-500/50 to-purple-500/50 origin-top"
              style={{ transformOrigin: 'top' }}
            />
            
            {/* Line to Salesforce (left) */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1/4 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 origin-left"
              style={{ transformOrigin: 'left' }}
            />
            
            {/* Line to Koerber WMS (right) */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1/4 h-0.5 bg-gradient-to-l from-blue-500/50 to-purple-500/50 origin-right"
              style={{ transformOrigin: 'right' }}
            />
            
            {/* Platform Nodes */}
            {/* D365 - Top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">D365</p>
            </motion.div>
            
            {/* QA Studio Recorder - Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col items-center gap-3 relative z-10"
            >
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 border-2 border-purple-400/50 relative">
                <Play className="h-14 w-14 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              </div>
              <p className="text-base font-bold text-zinc-200 text-center">QA Studio<br />Recorder</p>
            </motion.div>
            
            {/* Salesforce - Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/30">
                <Cloud className="h-10 w-10 text-white" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Salesforce</p>
            </motion.div>
            
            {/* Koerber WMS - Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 border border-green-400/30">
                <Package className="h-10 w-10 text-white" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Koerber WMS</p>
            </motion.div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {engineFeatures.map((feature, index) => {
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

