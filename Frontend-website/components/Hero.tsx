"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
      <div className="absolute inset-0 bg-zinc-950"></div>
      
      {/* Glow effect behind headline */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-32"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Upgrade Your QA Team to Automation Engineers.
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto"
        >
          By eliminating the coding barrier, instantly transform manual D365 expertise into resilient Playwright scripts—no programming skills required.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg border border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 shimmer relative"
            asChild
          >
            <Link href="/download">
              <Download className="mr-2 h-5 w-5 relative z-10" />
              <span className="relative z-10">Download v2.0</span>
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="bg-transparent hover:bg-zinc-800 text-white px-8 py-6 text-lg border border-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
            asChild
          >
            <Link href="/docs/getting-started">
              View Docs
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
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-4 shadow-2xl shadow-indigo-500/20 overflow-hidden">
              {/* Glass reflection overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none z-10"></div>
              
              {/* Inner glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none z-10"></div>
              
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}/qa-studio-dashboard.png`}
                  alt="QA Studio Dashboard"
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
