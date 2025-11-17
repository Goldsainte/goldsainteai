// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { MarketplaceShowcase } from "@/components/home/MarketplaceShowcase";
import { PostTripCTA } from "@/components/home/PostTripCTA";
import { StoryboardPreview } from "@/components/home/StoryboardPreview";
import { TikTokLabHighlight } from "@/components/home/TikTokLabHighlight";

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Goldsainte · Luxury Travel Marketplace</title>
        <meta
          name="description"
          content="Goldsainte connects TikTok creators, certified travel agents, and travelers. Browse a luxury marketplace of trips, post your own dream journey, and let AI matching do the rest."
        />
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-foreground">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* How it works - new elevated version */}
        <HowItWorksSection />

        {/* Marketplace showcase with Pinterest-style cards */}
        <MarketplaceShowcase />

        {/* "Post a Trip" CTA section with AI matching + voice concierge */}
        <PostTripCTA />

        {/* Storyboard preview – Pinterest vibes, Goldsainte colors */}
        <StoryboardPreview />

        {/* TikTok Travel Lab highlight */}
        <TikTokLabHighlight />
      </main>
    </>
  );
}
