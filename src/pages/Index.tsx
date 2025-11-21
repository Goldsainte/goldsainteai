// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { WhoItsFor } from "@/components/home/WhoItsFor";
import { HowItWorksTimeline } from "@/components/home/HowItWorksTimeline";
import { StoryboardsHighlight } from "@/components/home/StoryboardsHighlight";
import { TrustAndSafety } from "@/components/home/TrustAndSafety";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";

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

      <main className="min-h-screen bg-[#f7f3ea] text-foreground pb-20 sm:pb-0">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* Who Goldsainte is for - 3-column section */}
        <WhoItsFor />

        {/* How Goldsainte works - 4-step timeline */}
        <HowItWorksTimeline />

        {/* Storyboards highlight - core differentiator */}
        <StoryboardsHighlight />

        {/* Trust, safety & payments reassurance */}
        <TrustAndSafety />

        {/* Role-specific CTAs - three-way sign up */}
        <RoleSpecificCTAs />
      </main>
    </>
  );
}
