// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";
import { TrustFooterMobile } from "@/components/home/TrustFooterMobile";
import { TwoWaysComparison } from "@/components/home/TwoWaysComparison";
import {
  BuiltForEverySideSection,
  HowGoldsainteWorksSection,
  TrustSafetyPaymentsSection,
} from "@/sections/HomeLuxurySections";

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Goldsainte · Luxury Travel Marketplace</title>
        <meta
          name="description"
          content="Goldsainte connects travelers, TikTok creators, and certified travel agents through storyboards. Turn inspiration into bookable trips with AI matching, escrow protection, and on-platform collaboration."
        />
      </Helmet>

      <div className="flex-1 bg-[#f7f3ea] text-foreground">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* How Goldsainte Works - audience-defined, immediately after hero */}
        <HowGoldsainteWorksSection />

        {/* Two ways comparison */}
        <TwoWaysComparison />

        {/* Storyboards highlight - core differentiator */}
        <StoryboardsHighlight />

        {/* Role-specific CTAs - three-way sign up */}
        <RoleSpecificCTAs />

        {/* Built for every side - hidden for now, uncomment to re-enable */}
        {/* <BuiltForEverySideSection /> */}

        {/* Trust, safety & payments - luxury redesign */}
        <TrustSafetyPaymentsSection />

        {/* Trust messaging - mobile only, after role CTAs */}
        <TrustFooterMobile />
      </div>
    </>
  );
}
