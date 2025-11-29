import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeaturesShowcase } from "@/components/FeaturesShowcase";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-16">
        <FeaturesShowcase />
      </div>
      <Footer />
    </main>
  );
}

