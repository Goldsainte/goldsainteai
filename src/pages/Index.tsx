// src/pages/Index.tsx
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";
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

function FeaturedTripsSection() {
  const { data: trips } = useQuery({
    queryKey: ["home-index-featured-trips"],
    queryFn: async () => {
      const { data: featured } = await supabase
        .from("packaged_trips")
        .select("id, slug, title, destination, cover_image_url, price_per_person, duration_days, currency")
        .eq("status", "published")
        .eq("is_featured", true)
        .limit(6);
      if (featured && featured.length >= 3) return featured;
      const { data: recent } = await supabase
        .from("packaged_trips")
        .select("id, slug, title, destination, cover_image_url, price_per_person, duration_days, currency")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);
      return recent || featured || [];
    },
  });
  if (!trips?.length) return null;
  return (
    <section className="bg-[#f7f3ea] border-t border-[#E5DFC6] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <h2 className="font-secondary text-2xl md:text-4xl text-[#0a2225]">Featured Trips</h2>
          <Link to="/marketplace" className="text-sm text-[#0c4d47] hover:underline">View all trips →</Link>
        </div>
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
          {trips.map((trip: any) => (
            <Link key={trip.id} to={`/marketplace/trip/${trip.slug || trip.id}`} className="group space-y-2.5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl bg-[#F5F0E8]">
                <TripCoverImage
                  src={trip.cover_image_url}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="font-secondary text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">{trip.title}</h3>
              <p className="text-[13px] text-[#6B7280]">{trip.destination} · {trip.duration_days} days</p>
              <p className="text-[13px] text-[#0a2225] font-medium">
                from ${trip.price_per_person?.toLocaleString()} per person
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Goldsainte — Trips by Local Specialists, Inspired by Creators</title>
        <meta
          name="description"
          content="Wherever you're dreaming of, someone who knows it is on Goldsainte. Browse trips and tours from certified specialists, guides from the creators who inspired them — or post your Dream Trip and compare tailored proposals."
        />
      </Helmet>

      <div className="flex-1 bg-[#f7f3ea] text-foreground">
        {/* Hero with Expedia search + brand positioning */}
        <HomeHero />

        {/* How Goldsainte Works - audience-defined, immediately after hero */}
        <HowGoldsainteWorksSection />

        {/* Storyboards highlight - core differentiator */}
        <StoryboardsHighlight />

        {/* Featured Trips - surfaces the published packaged_trips */}
        <FeaturedTripsSection />

        {/* Two ways comparison */}
        <TwoWaysComparison />

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
