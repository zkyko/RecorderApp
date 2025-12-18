import { Hero } from "@/components/Hero";
import { CoreValue } from "@/components/CoreValue";
import { SecretSauce } from "@/components/SecretSauce";
import { Architecture } from "@/components/Architecture";
import { Metrics } from "@/components/Metrics";
import { About } from "@/components/About";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { OriginStory } from "@/components/OriginStory";

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <Navbar />
      <Hero />
      <OriginStory />
      <CoreValue />
      <div id="features">
        <SecretSauce />
      </div>
      <Architecture />
      <Metrics />
      <About />
      <Newsletter />
      <Footer />
    </main>
  );
}

