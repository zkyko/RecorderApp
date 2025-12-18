"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Github, BookOpen, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function Hero() {
  const [basePath, setBasePath] = useState('');
  
  useEffect(() => {
    // Determine basePath on client side
    if (window.location.pathname.startsWith('/RecorderApp')) {
      setBasePath('/RecorderApp');
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-slate-950"></div>
      
      {/* Glow effect behind headline */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-32"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/50">
            <Code2 className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-400">Portfolio Project</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
            FourHands Automation Suite
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-slate-400 mb-4 max-w-3xl mx-auto"
        >
          An enterprise-grade test automation platform built with Electron, Playwright, and TypeScript
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto"
        >
          A deep dive into building a self-contained automation workbench that transforms manual QA workflows into maintainable, AI-powered test suites for Microsoft Dynamics 365.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button 
            size="lg" 
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-6 text-lg border border-slate-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
            asChild
          >
            <a href="https://github.com/zkyko/RecorderApp" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              <span>View on GitHub</span>
            </a>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="bg-transparent hover:bg-slate-800/50 text-white px-8 py-6 text-lg border border-slate-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
            asChild
          >
            <Link href="/docs/developer">
              <BookOpen className="mr-2 h-5 w-5" />
              Explore Architecture
            </Link>
          </Button>
        </motion.div>
        
        {/* Product Screenshot with perspective and tilt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 max-w-5xl mx-auto perspective-[2000px]"
        >
          <div 
            className="relative"
            style={{ 
              transform: 'rotateX(12deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm p-4 shadow-2xl shadow-blue-500/10 overflow-hidden">
              {/* Glass reflection overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none z-10"></div>
              
              {/* Inner glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none z-10"></div>
              
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}/qa-studio-dashboard.png`}
                  alt="FourHands Automation Suite Dashboard"
                  className="object-contain w-full h-auto"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
