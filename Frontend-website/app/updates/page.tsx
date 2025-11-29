import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Changelog } from "@/components/Changelog";

export default function UpdatesPage() {
  return (
    <main className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              What's New
            </h1>
            <p className="text-zinc-400 text-lg">
              Stay up to date with the latest features, improvements, and fixes in QA Studio.
            </p>
          </div>
          <Changelog />
        </div>
      </div>
      <Footer />
    </main>
  );
}

