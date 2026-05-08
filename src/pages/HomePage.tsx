import { HomeHero } from "@/components/home/HomeHero";
import { TwoWaysComparison } from "@/components/home/TwoWaysComparison";
import { BuiltForEverySideSection, HowGoldsainteWorksSection, TrustSafetyPaymentsSection } from "@/sections/HomeLuxurySections";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";
import { StatsStrip } from "@/components/home/StatsStrip";
import { CameraRollHighlight } from "@/components/home/CameraRollHighlight";
import { HomeTestimonials } from "@/components/home/HomeTestimonials";

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <StatsStrip />
      <HowGoldsainteWorksSection />
      <CameraRollHighlight />
      <TwoWaysComparison />
      <StoryboardsHighlight />
      <RoleSpecificCTAs />
      {/* <BuiltForEverySideSection /> */}
      <TrustSafetyPaymentsSection />
      <HomeTestimonials />
    </main>
  );
}
