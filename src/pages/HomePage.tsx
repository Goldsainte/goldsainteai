import { HomeHero } from "@/components/home/HomeHero";
import { WhoItsFor } from "@/components/home/WhoItsFor";
import { HowItWorksTimeline } from "@/components/home/HowItWorksTimeline";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { TrustAndSafety } from "@/components/home/TrustAndSafety";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <WhoItsFor />
      <HowItWorksTimeline />
      <StoryboardsHighlight />
      <TrustAndSafety />
      <RoleSpecificCTAs />
    </main>
  );
}
