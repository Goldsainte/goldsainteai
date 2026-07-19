import { HomeHero } from "@/components/home/HomeHero";
import { AsFeaturedIn } from "@/components/home/AsFeaturedIn";
import { StatsStrip } from "@/components/home/StatsStrip";
import { DreamTripBand } from "@/components/home/DreamTripBand";
import { EarnSection } from "@/components/home/EarnSection";
import { lazy, Suspense } from "react";
const PlatformDemoSection = lazy(() => import("@/components/home/PlatformDemoSection"));
import { OneConversationSection } from "@/components/home/OneConversationSection";
const CreatorShowcaseSection = lazy(() => import("@/components/home/CreatorShowcaseSection").then(m => ({ default: m.CreatorShowcaseSection })));
import { TrustPlaque } from "@/components/home/TrustPlaque";
import { FinalCTABand } from "@/components/home/FinalCTABand";

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <AsFeaturedIn />
      <StatsStrip />
      <OneConversationSection />
      <DreamTripBand />
      <Suspense fallback={null}>
        <CreatorShowcaseSection />
      </Suspense>
      <Suspense fallback={null}>
        <PlatformDemoSection />
      </Suspense>
      <EarnSection />
      <TrustPlaque />
      <FinalCTABand />
    </main>
  );
}
