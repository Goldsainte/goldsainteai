import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <HowItWorksSection />
    </main>
  );
}
