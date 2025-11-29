import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-zinc-400 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-6"
              asChild
            >
              <Link href="/docs">
                <Search className="mr-2 h-5 w-5" />
                Browse Docs
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Popular Pages</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="/" className="hover:text-blue-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-blue-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-blue-400 transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/download" className="hover:text-blue-400 transition-colors">
                    Download
                  </Link>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Get Help</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="/faq" className="hover:text-blue-400 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-400 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/zkyko/RecorderApp/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    GitHub Issues
                  </a>
                </li>
                <li>
                  <Link href="/docs/getting-started" className="hover:text-blue-400 transition-colors">
                    Getting Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

