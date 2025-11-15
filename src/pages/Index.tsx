// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MarketplaceShowcase } from "@/components/home/MarketplaceShowcase";

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Goldsainte · Luxury Travel Marketplace</title>
        <meta
          name="description"
          content="Goldsainte connects TikTok creators, certified travel agents, and travelers. Browse a luxury marketplace of trips or post your own dream journey."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6] text-foreground">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* How it works (three-sided marketplace) */}
        <HowItWorks />

        {/* Marketplace showcase with Pinterest-style cards */}
        <MarketplaceShowcase />

        {/* You can add more sections below as needed:
            - TikTok Travel Lab teaser
            - Creator / Agent call-to-action strips
            - Testimonials, etc.
        */}
      </main>
    </>
  );
}
