import { HomeHero } from "@/components/home/HomeHero";
import { TwoWaysComparison } from "@/components/home/TwoWaysComparison";
import { BuiltForEverySideSection, HowGoldsainteWorksSection, TrustSafetyPaymentsSection } from "@/sections/HomeLuxurySections";
import { RoleSpecificCTAs } from "@/components/home/RoleSpecificCTAs";
import { StatsStrip } from "@/components/home/StatsStrip";
import { CameraRollHighlight } from "@/components/home/CameraRollHighlight";
import { HomeTestimonials } from "@/components/home/HomeTestimonials";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
          {trips.map((trip: any) => (
            <Link key={trip.id} to={`/marketplace/trip/${trip.slug || trip.id}`} className="group space-y-2.5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl bg-[#F5F0E8]">
                <img
                  src={trip.cover_image_url || ""}
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

export default function HomePage() {
  return (
    <main className="bg-[#f7f3ea] text-[#0a2225] min-h-screen">
      <HomeHero />
      <StatsStrip />
      <HowGoldsainteWorksSection />
      <CameraRollHighlight />
      <FeaturedTripsSection />
      <TwoWaysComparison />
      <RoleSpecificCTAs />
      {/* <BuiltForEverySideSection /> */}
      <TrustSafetyPaymentsSection />
      <HomeTestimonials />
    </main>
  );
}
