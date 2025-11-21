import { HomeHero } from "@/components/home/HomeHero";
import { WhoItsFor } from "@/components/home/WhoItsFor";
import { HowItWorksTimeline } from "@/components/home/HowItWorksTimeline";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { TrustAndSafety } from "@/components/home/TrustAndSafety";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";

export default function HomePage() {
  console.log("HomePage rendering - diagnostic mode");
  
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen pb-20 sm:pb-0">
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Homepage Test</h1>
        <p className="text-lg">If you see this, the route works. Adding components below:</p>
      </div>
      
      <HomeHero />
      <WhoItsFor />
      <HowItWorksTimeline />
      <StoryboardsHighlight />
      <TrustAndSafety />
      <RoleSpecificCTAs />
    </main>
  );
}
