import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TripDetailHero } from "@/components/trips/TripDetailHero";
import { TripAboutSection } from "@/components/trips/TripAboutSection";
import { MeetYourHostCard } from "@/components/trips/MeetYourHostCard";
import { TripActivitiesSection } from "@/components/trips/TripActivitiesSection";
import { TripInclusionsCard } from "@/components/trips/TripInclusionsCard";
import { TripItineraryAccordion } from "@/components/trips/TripItineraryAccordion";
import { TripAirportsCard } from "@/components/trips/TripAirportsCard";
import { TripAddonsSection } from "@/components/trips/TripAddonsSection";
import { TripActivityLevelBadge } from "@/components/trips/TripActivityLevelBadge";
import { TripEssentialInfoLinks } from "@/components/trips/TripEssentialInfoLinks";
import { TripCancellationPolicySection } from "@/components/trips/TripCancellationPolicySection";
import { TripTrustBadges } from "@/components/trips/TripTrustBadges";
import { TripFAQAccordion } from "@/components/trips/TripFAQAccordion";
import { TripBookingSidebar } from "@/components/trips/TripBookingSidebar";
import { Button } from "@/components/ui/button";

interface TripData {
  id: string;
  title: string;
  destination: string;
  description?: string | null;
  cover_image_url?: string | null;
  gallery_urls?: string[] | null;
  retail_price?: number | null;
  price_per_person?: number | null;
  currency?: string | null;
  duration_days?: number | null;
  available_from?: string | null;
  available_until?: string | null;
  min_group_size?: number | null;
  max_participants?: number | null;
  group_size_note?: string | null;
  activity_level?: string | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  highlights?: string[] | null;
  faq?: Array<{ question: string; answer: string; category?: string }> | null;
  recommended_arrival_airport?: string | null;
  recommended_departure_airport?: string | null;
  essential_info?: Record<string, string> | null;
  spots_available?: number | null;
  creator_id: string;
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

export default function TrovaTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchTripData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch trip with creator info
        const { data: tripData, error: tripError } = await supabase
          .from("packaged_trips")
          .select(`
            *,
            creator:profiles!packaged_trips_creator_id_fkey (
              id,
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq("id", id)
          .single();

        if (tripError) throw tripError;

        // Fetch activities
        const { data: activitiesData } = await supabase
          .from("trip_activities")
          .select("*")
          .eq("trip_id", id)
          .order("activity_order");

        // Fetch itinerary days
        const { data: daysData } = await supabase
          .from("trip_itinerary_days")
          .select("*")
          .eq("trip_id", id)
          .order("day_number");

        // Fetch addons
        const { data: addonsData } = await supabase
          .from("trip_addons")
          .select("*")
          .eq("trip_id", id);

        setTrip(tripData as TripData);
        setActivities(activitiesData || []);
        setItineraryDays(daysData || []);
        setAddons(addonsData || []);
      } catch (err: any) {
        console.error("Error fetching trip:", err);
        setError(err.message || "Failed to load trip");
      } finally {
        setLoading(false);
      }
    }

    fetchTripData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <Header />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C7B892]" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#FDF9F0]">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-secondary text-2xl font-semibold text-[#0a2225]">
            Trip not found
          </h1>
          <p className="mt-2 text-[#6B7280]">{error || "This trip doesn't exist or has been removed."}</p>
          <Button
            onClick={() => navigate("/marketplace")}
            className="mt-6 bg-[#0C4D47] hover:bg-[#0C4D47]/90"
          >
            Browse Trips
          </Button>
        </div>
      </div>
    );
  }

  const included = Array.isArray(trip.inclusions) ? trip.inclusions : [];
  const notIncluded = Array.isArray(trip.exclusions) ? trip.exclusions : [];
  const faqs = Array.isArray(trip.faq) ? trip.faq : [];
  const galleryImages = Array.isArray(trip.gallery_urls) ? trip.gallery_urls : [];
  const durationDays = trip.duration_days || 1;
  const durationNights = durationDays > 0 ? durationDays - 1 : 0;

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2 text-[#0a2225] hover:bg-[#E5DFC6]/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Hero */}
        <TripDetailHero
          title={trip.title}
          hostName={trip.creator?.full_name || "Host"}
          coverImage={trip.cover_image_url || "/placeholder.svg"}
          galleryImages={galleryImages}
          startDate={trip.available_from || undefined}
          endDate={trip.available_until || undefined}
          groupSizeMin={trip.min_group_size || undefined}
          groupSizeMax={trip.max_participants || undefined}
          groupSizeNote={trip.group_size_note || undefined}
          durationDays={durationDays}
          durationNights={durationNights}
          activityLevel={trip.activity_level || undefined}
          spotsAvailable={trip.spots_available || undefined}
        />

        {/* Two Column Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <TripAboutSection description={trip.description || ""} />
            
            <MeetYourHostCard
              hostId={trip.creator?.id || trip.creator_id}
              hostName={trip.creator?.full_name || "Host"}
              hostAvatar={trip.creator?.avatar_url}
              hostBio={trip.creator?.bio}
              hostType="creator"
            />

            {activities.length > 0 && (
              <TripActivitiesSection activities={activities} />
            )}

            <TripInclusionsCard included={included} notIncluded={notIncluded} />

            {itineraryDays.length > 0 && (
              <TripItineraryAccordion days={itineraryDays} totalNights={durationNights} />
            )}

            <TripAirportsCard
              arrivalAirport={trip.recommended_arrival_airport || undefined}
              departureAirport={trip.recommended_departure_airport || undefined}
            />

            {addons.length > 0 && <TripAddonsSection addons={addons} />}

            {trip.activity_level && (
              <TripActivityLevelBadge level={trip.activity_level} />
            )}

            <TripEssentialInfoLinks
              essentialInfo={trip.essential_info || undefined}
              destination={trip.destination}
            />

            <TripCancellationPolicySection />

            <TripTrustBadges />

            <TripFAQAccordion faqs={faqs.length > 0 ? faqs : undefined} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <TripBookingSidebar
                tripId={trip.id}
                pricePerPerson={trip.retail_price || trip.price_per_person || 0}
                currency={trip.currency || "USD"}
                spotsAvailable={trip.spots_available || undefined}
                hostName={trip.creator?.full_name || undefined}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
