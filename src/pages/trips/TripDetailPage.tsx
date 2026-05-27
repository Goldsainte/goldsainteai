import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TripHero } from "@/components/trips/TripHero";
import { TripBookingCard } from "@/components/trips/TripBookingCard";
import { TripItinerary } from "@/components/trips/TripItinerary";
import { TripInclusions } from "@/components/trips/TripInclusions";
import { TripHostSection } from "@/components/trips/TripHostSection";
import { TripFAQAccordion } from "@/components/trips/TripFAQAccordion";
import { TripTrustFooter } from "@/components/trips/TripTrustFooter";
import { MakeItMinePanel } from "@/components/trips/MakeItMinePanel";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip-detail", slug],
    queryFn: async () => {
      // Try to find by slug first, then by id
      let query = supabase
        .from("packaged_trips")
        .select(`
          *,
          creator:profiles!packaged_trips_creator_id_fkey(
            id, full_name, username, avatar_url, bio
          )
        `);
      
      // Check if slug looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      
      if (isUUID) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: itinerary } = useQuery({
    queryKey: ["trip-itinerary", trip?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_itinerary")
        .select("*")
        .eq("package_id", trip!.id)
        .order("day_number", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!trip?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-secondary text-2xl text-[#0a2225]">Trip not found</h1>
          <button
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/marketplace?tab=trips")
            }
            className="mt-4 text-[#0C4D47] hover:underline"
          >
            Browse all trips
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = trip.max_participants - (trip.current_bookings || 0);
  const depositAmount = trip.price_per_person * ((trip.deposit_percentage || 30) / 100);

  return (
    <>
      <Helmet>
        <title>{trip.title} · Goldsainte</title>
        <meta name="description" content={trip.description?.slice(0, 160) || `Experience ${trip.destination} with Goldsainte`} />
      </Helmet>

      <div className="min-h-screen bg-[#FDF9F0]">
        {/* Back Button */}
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] text-[#4a4a4a] hover:text-[#0a2225] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to trips
          </button>
        </div>

        {/* Hero Section */}
        <TripHero trip={trip as any} spotsLeft={spotsLeft} />

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Trip Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Signature Goldsainte interaction */}
              {itinerary && itinerary.length > 0 && (
                <MakeItMinePanel
                  trip={{
                    id: trip.id,
                    title: trip.title,
                    destination: trip.destination,
                    duration_days: trip.duration_days,
                    description: trip.description,
                  }}
                  baseItinerary={itinerary.map((d: any) => ({
                    day_number: d.day_number,
                    title: d.title,
                    description: d.description,
                    accommodation: d.accommodation,
                  }))}
                />
              )}

              {/* About Section */}
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
                <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">About This Trip</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[#4a4a4a]">
                  {trip.description}
                </p>
                
                {trip.tags && trip.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trip.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#C7B892]/15 px-3 py-1 text-[12px] font-medium text-[#7A7151]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Day-by-Day Itinerary */}
              {itinerary && itinerary.length > 0 && (
                <TripItinerary itinerary={itinerary as any} />
              )}

              {/* What's Included / Not Included */}
              <TripInclusions
                included={trip.included as string[] | null}
                notIncluded={trip.not_included as string[] | null}
              />

              {/* Your Host */}
              {trip.creator && (
                <TripHostSection
                  host={trip.creator}
                  hostTagline={trip.host_tagline}
                  hostType="creator"
                />
              )}

              {/* FAQs */}
              <TripFAQAccordion faqs={trip.faqs as Array<{ question: string; answer: string; category?: string }> || undefined} />
            </div>

            {/* Right Column - Booking Card (Sticky) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <TripBookingCard
                trip={trip as any}
                spotsLeft={spotsLeft}
                depositAmount={depositAmount}
              />
            </div>
          </div>
        </div>

        {/* Trust & Safety Footer */}
        <TripTrustFooter />
      </div>
    </>
  );
}
