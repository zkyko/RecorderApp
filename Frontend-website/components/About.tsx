"use client";

import { motion } from "framer-motion";
import { Code2, Calendar, Target, Users } from "lucide-react";

export function About() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              Project Overview
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            About This Project
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto mb-12">
            FourHands Automation Suite is a comprehensive Electron-based desktop application that addresses the unique challenges of test automation for Microsoft Dynamics 365. This project demonstrates full-stack development skills, from browser-side recording engines to AI-powered debugging systems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Project Goal</h3>
            <p className="text-slate-400">
              Build a self-contained automation workbench that eliminates the coding barrier for QA teams while maintaining enterprise-grade code quality and maintainability.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Timeline</h3>
            <p className="text-slate-400">
              Developed over 18 months, iterating from v1.0 to v2.0 with continuous improvements in architecture, user experience, and feature set.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">My Role</h3>
            <p className="text-slate-400">
              Sole architect and developer. Responsible for system design, implementation, testing, and deployment across all layers of the application.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-base text-slate-500">
            Built by <span className="text-blue-400 font-semibold">Nischal Bhandari</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
