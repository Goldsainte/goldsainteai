// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
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

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] text-foreground">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* How it works (three-sided marketplace) */}
        <HowItWorks />

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
