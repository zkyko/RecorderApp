"use client";

import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to your email service
    console.log("Newsletter signup:", email);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Stay Updated
          </h2>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Get notified about new features, updates, and best practices for test automation
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </div>
              <p className="text-sm text-zinc-500 mt-3">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto p-6 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 className="h-6 w-6" />
                <p className="text-lg font-medium">Thanks for subscribing!</p>
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                You'll receive updates about QA Studio's latest features and improvements.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

