import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  image_gallery?: any[] | null;
  price_per_person?: number | null;
  original_price?: number | null;
  currency?: string | null;
  duration_days?: number | null;
  duration_nights?: number | null;
  available_from?: string | null;
  available_until?: string | null;
  min_participants?: number | null;
  max_participants?: number | null;
  group_size_note?: string | null;
  activity_level?: string | null;
  included?: any[] | null;
  not_included?: any[] | null;
  highlights?: any[] | null;
  faqs?: Array<{ question: string; answer: string; category?: string }> | null;
  recommended_arrival_airport?: string | null;
  recommended_departure_airport?: string | null;
  essential_info?: Record<string, string> | null;
  current_bookings?: number | null;
  creator_id?: string | null;
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

// Helper to check if string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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
        // Determine if we're querying by UUID or slug
        const isUUID = isValidUUID(id);
        
        // Build the query - either by id or by slug
        let query = supabase
          .from("packaged_trips")
          .select(`
            *,
            creator:profiles!packaged_trips_creator_id_fkey (
              id,
              full_name,
              avatar_url,
              bio
            )
          `);
        
        if (isUUID) {
          query = query.eq("id", id);
        } else {
          query = query.eq("slug", id);
        }
        
        const { data: tripData, error: tripError } = await query.single();

        if (tripError) throw tripError;

        const tripId = tripData.id;

        // Fetch activities
        const { data: activitiesData } = await supabase
          .from("trip_activities")
          .select("*")
          .eq("trip_id", tripId)
          .order("activity_order");

        // Fetch itinerary days
        const { data: daysData } = await supabase
          .from("trip_itinerary_days")
          .select("*")
          .eq("trip_id", tripId)
          .order("day_number");

        // Fetch addons
        const { data: addonsData } = await supabase
          .from("trip_addons")
          .select("*")
          .eq("trip_id", tripId);

        setTrip(tripData as unknown as TripData);
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
      <div className="min-h-screen bg-background">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-secondary text-2xl font-semibold text-foreground">
            Trip not found
          </h1>
          <p className="mt-2 text-muted-foreground">{error || "This trip doesn't exist or has been removed."}</p>
          <Button
            onClick={() => navigate("/marketplace")}
            className="mt-6"
          >
            Browse Trips
          </Button>
        </div>
      </div>
    );
  }

  const included = Array.isArray(trip.included) ? trip.included : [];
  const notIncluded = Array.isArray(trip.not_included) ? trip.not_included : [];
  const faqs = Array.isArray(trip.faqs) ? trip.faqs as Array<{ question: string; answer: string; category?: string }> : [];
  const galleryImages = Array.isArray(trip.image_gallery) ? trip.image_gallery : [];
  const durationDays = trip.duration_days || 1;
  const durationNights = trip.duration_nights || (durationDays > 0 ? durationDays - 1 : 0);
  const spotsAvailable = trip.max_participants && trip.current_bookings != null 
    ? trip.max_participants - trip.current_bookings 
    : trip.max_participants;

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2 text-foreground hover:bg-muted/30"
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
          groupSizeMin={trip.min_participants || undefined}
          groupSizeMax={trip.max_participants || undefined}
          groupSizeNote={trip.group_size_note || undefined}
          durationDays={durationDays}
          durationNights={durationNights}
          activityLevel={trip.activity_level || undefined}
          spotsAvailable={spotsAvailable || undefined}
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
                pricePerPerson={trip.original_price || trip.price_per_person || 0}
                currency={trip.currency || "USD"}
                spotsAvailable={spotsAvailable || undefined}
                hostName={trip.creator?.full_name || undefined}
                creatorId={trip.creator_id || undefined}
                creatorType={(trip as any).creator_type || "creator"}
                agentId={(trip as any).agent_id || undefined}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
