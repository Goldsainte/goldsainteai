import { HomeHero } from "@/components/home/HomeHero";
import { StatsStrip } from "@/components/home/StatsStrip";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";
import { DreamTripBand } from "@/components/home/DreamTripBand";
import { EarnSection } from "@/components/home/EarnSection";
import { lazy, Suspense } from "react";
const PlatformDemoSection = lazy(() => import("@/components/home/PlatformDemoSection"));
import { OneConversationSection } from "@/components/home/OneConversationSection";
import { TrustPlaque } from "@/components/home/TrustPlaque";
import { FinalCTABand } from "@/components/home/FinalCTABand";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";

function FeaturedTripsSection() {
  const { data: trips } = useQuery({
    queryKey: ["homepage-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaged_trips")
        .select("id, slug, title, destination, cover_image_url, price_per_person, duration_days, currency")
        .eq("status", "published")
        .eq("is_featured", true)
        .limit(6);
      if (data && data.length >= 3) return data;
      const { data: recent } = await supabase
        .from("packaged_trips")
        .select("id, slug, title, destination, cover_image_url, price_per_person, duration_days, currency")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);
      return recent || data || [];
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-6">
          {trips.map((trip: any) => (
            <Link key={trip.id} to={`/marketplace/trip/${trip.slug || trip.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-2xl bg-[#F5F0E8] shadow-[0_6px_16px_rgba(10,34,37,0.12)] sm:shadow-none sm:transition-shadow sm:duration-300 sm:group-hover:shadow-[0_6px_16px_rgba(10,34,37,0.12)]">
                <TripCoverImage
                  src={trip.cover_image_url}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-2 line-clamp-1 font-secondary text-[14px] font-medium leading-snug text-[#0a2225]">{trip.title}</h3>
              <p className="truncate text-[12px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                {trip.destination} · {trip.duration_days} days
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
                from ${trip.price_per_person?.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <StatsStrip />
      <OneConversationSection />
      <HowItWorksSteps />
      <FeaturedTripsSection />
      <DreamTripBand />
      <Suspense fallback={null}>
        <PlatformDemoSection />
      </Suspense>
      <EarnSection />
      <TrustPlaque />
      <FinalCTABand />
    </main>
  );
}
