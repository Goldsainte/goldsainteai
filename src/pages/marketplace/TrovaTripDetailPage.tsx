import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrackView } from "@/hooks/useTrackView";
import { ShareButton } from "@/components/ShareButton";
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
import { Skeleton } from "@/components/ui/skeleton";

interface TripData {
  id: string;
  slug?: string | null;
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
  creator_type?: string | null;
  agent_id?: string | null;
  languages?: string[] | null;
  departure_dates?: string[] | null;
  minimum_age?: number | null;
  accommodation_type?: string | null;
  meals_included?: string[] | null;
  cancellation_policy?: string | null;
  refund_policy?: string | null;
  passport_required?: boolean | null;
  visa_required?: boolean | null;
  vaccination_required?: boolean | null;
  fitness_level_required?: string | null;
  terms_conditions?: string | null;
  destination_country?: string;
  creator?: {
    id: string;
    full_name: string | null;
    username?: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  agent?: {
    id: string;
    full_name: string | null;
    username: string | null;
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
  useTrackView("trip", trip?.id ?? null);
  const [activities, setActivities] = useState<any[]>([]);
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarTrips, setSimilarTrips] = useState<any[]>([]);

  useEffect(() => {
    if (!trip) return;
    const country = trip.destination?.split(",").pop()?.trim() || trip.destination;
    supabase
      .from("packaged_trips")
      .select("id, slug, title, destination, cover_image_url, price_per_person, duration_days, rating, creator_type")
      .eq("status", "published")
      .ilike("destination", `%${country}%`)
      .neq("id", trip.id)
      .limit(4)
      .then(({ data }) => setSimilarTrips(data || []));
  }, [trip?.id, trip?.destination]);

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
              username,
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

        // Fetch agent profile separately (FK may not be defined in schema cache)
        let agentProfile = null;
        if ((tripData as any).agent_id) {
          const { data: agentData } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, bio")
            .eq("id", (tripData as any).agent_id)
            .maybeSingle();
          agentProfile = agentData;
        }

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

        setTrip({ ...(tripData as any), agent: agentProfile } as unknown as TripData);
        setActivities(activitiesData || []);
        setItineraryDays(daysData || []);
        setAddons(addonsData || []);
      } catch (err: any) {
        console.error("Error fetching trip:", err);
        setError("failed");
      } finally {
        setLoading(false);
      }
    }

    fetchTripData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3ea]">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#f7f3ea]">
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-secondary text-2xl font-semibold text-[#0a2225]">
            Trip not found
          </h1>
          <p className="mt-2 text-[#6B7280]">
            We had trouble loading this trip. Please try again in a moment.
          </p>
          <Button
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/marketplace")
            }
            className="mt-6 bg-[#0C4D47] hover:bg-[#073331]"
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

  const isPlatformTrip = trip.creator_type === 'platform' && !trip.creator?.full_name;
  const hasCreator = !!(trip.creator?.full_name || trip.creator?.avatar_url);
  const host = hasCreator ? trip.creator : trip.agent;
  const hostType: "creator" | "agent" = hasCreator ? "creator" : "agent";

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      {trip && (
        <Helmet>
          <title>{trip.title} — Goldsainte</title>
          <meta name="description" content={trip.description?.slice(0, 160) || `Experience ${trip.destination} with Goldsainte. ${trip.duration_days} days from $${trip.price_per_person?.toLocaleString()}.`} />
          <meta property="og:title" content={`${trip.title} — Goldsainte`} />
          <meta property="og:description" content={trip.description?.slice(0, 160) || `Experience ${trip.destination} with Goldsainte`} />
          <meta property="og:image" content={trip.cover_image_url || 'https://goldsainte.ai/og-hero-v3.jpg'} />
          <meta property="og:url" content={`https://goldsainte.ai/marketplace/trip/${trip.slug || trip.id}`} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${trip.title} — Goldsainte`} />
          <meta name="twitter:image" content={trip.cover_image_url || 'https://goldsainte.ai/og-hero-v3.jpg'} />
        </Helmet>
      )}

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/marketplace");
              }
            }}
            className="gap-2 text-[#0a2225] hover:bg-[#FDF9F0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <ShareButton
            url={`/marketplace/trip/${trip.slug || trip.id}`}
            title={trip.title}
            description={trip.destination}
          />
        </div>

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
            
            {isPlatformTrip ? (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
                  Curated By
                </p>
                <div className="mt-4">
                  <div>
                    <h3 className="font-secondary text-xl font-semibold text-[#0a2225]">
                      Goldsainte Concierge
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#4a4a4a]">
                      This journey is curated by the Goldsainte team — handpicked experiences, vetted partners, and white-glove service from start to finish.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <MeetYourHostCard
                hostId={host?.id || trip.creator_id || trip.agent_id || ""}
                hostName={host?.full_name || "Host"}
                hostAvatar={host?.avatar_url || undefined}
                hostBio={host?.bio || undefined}
                hostType={hostType}
              />
            )}

            {activities.length > 0 && (
              <TripActivitiesSection activities={activities} />
            )}

            <TripInclusionsCard included={included} notIncluded={notIncluded} />

            {((trip.languages?.length ?? 0) > 0 ||
              (trip.departure_dates?.length ?? 0) > 0 ||
              trip.minimum_age ||
              trip.accommodation_type ||
              (trip.meals_included?.length ?? 0) > 0) && (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">Trip Essentials</p>
                {(trip.departure_dates?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#0a2225] mb-2">Departure Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {trip.departure_dates!.map((d: string) => (
                        <span key={d} className="text-xs bg-[#F5F0E8] text-[#0a2225] px-3 py-1 rounded-full border border-[#E5DFC6]">
                          {new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(trip.languages?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#0a2225] mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {trip.languages!.map((l: string) => (
                        <span key={l} className="text-xs bg-[#F5F0E8] text-[#0a2225] px-3 py-1 rounded-full border border-[#E5DFC6]">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(trip.meals_included?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#0a2225] mb-2">Meals Included</p>
                    <div className="flex flex-wrap gap-2">
                      {trip.meals_included!.map((m: string) => (
                        <span key={m} className="text-xs bg-[#FDF9F0] text-[#C7A962] px-3 py-1 rounded-full border border-[#C7A962]/30">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(trip.minimum_age || trip.accommodation_type) && (
                  <div className="grid grid-cols-2 gap-4">
                    {trip.minimum_age && (
                      <div>
                        <p className="text-xs text-[#9A9384]">Minimum Age</p>
                        <p className="text-sm font-medium text-[#0a2225]">{trip.minimum_age}+</p>
                      </div>
                    )}
                    {trip.accommodation_type && (
                      <div>
                        <p className="text-xs text-[#9A9384]">Accommodation</p>
                        <p className="text-sm font-medium text-[#0a2225]">{trip.accommodation_type}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {(trip.passport_required || trip.visa_required || trip.vaccination_required || trip.fitness_level_required) && (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">Travel Requirements</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {trip.passport_required && (
                    <div className="flex items-center gap-2 text-sm text-[#0a2225]">
                      <span className="h-2 w-2 rounded-full bg-[#C7A962]" />
                      Passport required
                    </div>
                  )}
                  {trip.visa_required && (
                    <div className="flex items-center gap-2 text-sm text-[#0a2225]">
                      <span className="h-2 w-2 rounded-full bg-[#C7A962]" />
                      Visa required
                    </div>
                  )}
                  {trip.vaccination_required && (
                    <div className="flex items-center gap-2 text-sm text-[#0a2225]">
                      <span className="h-2 w-2 rounded-full bg-[#C7A962]" />
                      Vaccination required
                    </div>
                  )}
                </div>
                {trip.fitness_level_required && (
                  <div>
                    <p className="text-xs text-[#9A9384] mb-1">Fitness requirement</p>
                    <p className="text-sm text-[#0a2225]">{trip.fitness_level_required}</p>
                  </div>
                )}
              </section>
            )}

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

            {trip.cancellation_policy ? (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151] mb-4">Cancellation Policy</p>
                <p className="text-sm text-[#5c5c52] leading-relaxed whitespace-pre-wrap">{trip.cancellation_policy}</p>
                {trip.refund_policy && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151] mt-5 mb-3">Refund Policy</p>
                    <p className="text-sm text-[#5c5c52] leading-relaxed whitespace-pre-wrap">{trip.refund_policy}</p>
                  </>
                )}
              </section>
            ) : (
              <TripCancellationPolicySection />
            )}

            {trip.terms_conditions && (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151] mb-4">Terms & Conditions</p>
                <p className="text-sm text-[#5c5c52] leading-relaxed whitespace-pre-wrap">{trip.terms_conditions}</p>
              </section>
            )}

            <TripTrustBadges />

            <TripFAQAccordion faqs={faqs.length > 0 ? faqs : undefined} />

            {similarTrips.length > 0 && (
              <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151] mb-5">More Trips Like This</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {similarTrips.map((t) => (
                    <Link key={t.id} to={`/marketplace/trip/${t.slug || t.id}`} className="group space-y-2">
                      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#F5F0E8]">
                        {t.cover_image_url && (
                          <img src={t.cover_image_url} alt={t.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        )}
                      </div>
                      <p className="font-secondary text-sm text-[#0a2225] line-clamp-1">{t.title}</p>
                      <p className="text-xs text-[#6B7280] line-clamp-1">{t.destination}</p>
                      <p className="text-xs font-medium text-[#0a2225]">${t.price_per_person?.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
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
                creatorType={trip.creator_type || "creator"}
                agentId={trip.agent_id || undefined}
                instantBooking={(trip as any).instant_booking || false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
