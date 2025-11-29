import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Getting Started
          </h1>
          
          <h2>Installation</h2>
          <p>
            Download QA Studio for your platform from the{" "}
            <Link href="/download" className="text-blue-400 hover:underline">
              download page
            </Link>
            .
          </p>
          
          <h2>Setup Keys</h2>
          <h3>OpenAI API Key</h3>
          <p>
            To use the AI Debugger feature, you'll need an OpenAI API key. You can obtain one from{" "}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              OpenAI's platform
            </a>
            .
          </p>
          
          <h3>DeepSeek API Key</h3>
          <p>
            Alternatively, you can use DeepSeek as your AI provider. Get your API key from{" "}
            <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              DeepSeek's platform
            </a>
            .
          </p>
          
          <h2>Configuration</h2>
          <p>
            Once you have your API key, navigate to Settings in QA Studio and enter your key in the appropriate field.
          </p>
        </article>
      </div>
      <Footer />
    </div>
  );
}

