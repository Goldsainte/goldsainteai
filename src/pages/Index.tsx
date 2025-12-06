// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";
import { TrustFooterMobile } from "@/components/home/TrustFooterMobile";
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

        {/* Storyboards highlight - core differentiator, immediately after hero */}
        <StoryboardsHighlight />

        {/* Built for every side - luxury redesign */}
        <BuiltForEverySideSection />

        {/* How Goldsainte AI works - luxury redesign */}
        <HowGoldsainteWorksSection />

        {/* Role-specific CTAs - three-way sign up */}
        <RoleSpecificCTAs />

        {/* Trust, safety & payments - luxury redesign */}
        <TrustSafetyPaymentsSection />

        {/* Trust messaging - mobile only, after role CTAs */}
        <TrustFooterMobile />
      </div>
    </>
  );
}
