import { HomeHero } from "@/components/home/HomeHero";
import { TwoWaysComparison } from "@/components/home/TwoWaysComparison";
import { BuiltForEverySideSection, HowGoldsainteWorksSection, TrustSafetyPaymentsSection } from "@/sections/HomeLuxurySections";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <TwoWaysComparison />
      <HowGoldsainteWorksSection />
      <StoryboardsHighlight />
      <RoleSpecificCTAs />
      {/* <BuiltForEverySideSection /> */}
      <TrustSafetyPaymentsSection />
    </main>
  );
}
