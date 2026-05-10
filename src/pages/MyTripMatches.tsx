import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Star, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NewTripForYouCard } from "@/components/trips/NewTripForYouCard";
import { TripStatusControls } from "@/components/trips/TripStatusControls";
import { TripRequestDrawer, type TripRequestDetail } from "@/components/trips/TripRequestDrawer";
import {
  formatDateRange,
  formatBudgetRange,
  getTravelersCount,
  extractTags,
  getBrandInfo,
} from "@/lib/trips/enrichTripRequest";
import { TripRequestStatus } from "@/lib/trips/statusMachine";

interface TripMatch {
  id: string;
  trip_request_id: string;
  match_score: number;
  reasons: string;
  trip_requests: {
    id: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget_min: number | null;
    budget_max: number | null;
    travelers_adults: number;
    travelers_children: number;
    created_at: string;
    status: string;
    source_brand_profile_id: string;
    source_collection_id: string | null;
    source_metadata: Record<string, any>;
    accepted_proposal_id?: string | null;
    accepted_at?: string | null;
  };
}

interface EnrichedMatch extends TripMatch {
  brandAvatarUrl: string | null;
}

export default function MyTripMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeTripDetail, setActiveTripDetail] = useState<TripRequestDetail | null>(null);

  // Load active trip detail with proposal/booking data
  useEffect(() => {
    if (!activeTripId) {
      setActiveTripDetail(null);
      return;
    }

    async function loadTripDetail() {
      const activeMatch = matches.find((m) => m.trip_requests.id === activeTripId);
      if (!activeMatch) return;

      const trip = activeMatch.trip_requests;
      const brandInfo = getBrandInfo(trip.source_metadata);

      // Fetch accepted proposal if exists
      let acceptedProposal = null;
      if (trip.accepted_proposal_id) {
        const { data } = await supabase
          .from("trip_proposals")
          .select("id, status, headline, price_from, currency")
          .eq("id", trip.accepted_proposal_id)
          .single();
        acceptedProposal = data;
      }

      // Fetch trip bookings with payment fields
      const { data: bookings } = await supabase
        .from("trip_bookings")
        .select("id, status, total_price, currency, payment_url, platform_commission, partner_payout")
        .eq("trip_request_id", trip.id);

      const tripDetail: TripRequestDetail = {
        id: trip.id,
        created_at: trip.created_at,
        status: trip.status as TripRequestStatus,
        user_name: null,
        brand_profile_id: trip.source_brand_profile_id,
        brand_name: brandInfo.brandName,
        brand_avatar_url: activeMatch.brandAvatarUrl,
        collection_id: trip.source_collection_id,
        collection_title: brandInfo.collectionTitle,
        collection_tags: extractTags(trip.source_metadata),
        destination: trip.destination,
        date_range: formatDateRange(trip.start_date, trip.end_date),
        travelers_count: getTravelersCount(
          trip.travelers_adults,
          trip.travelers_children
        ),
        budget_range: formatBudgetRange(trip.budget_min, trip.budget_max),
        notes: trip.source_metadata?.special_notes || trip.source_metadata?.description || null,
        accepted_proposal_id: trip.accepted_proposal_id,
        accepted_at: trip.accepted_at,
        accepted_proposal: acceptedProposal,
        trip_bookings: bookings || [],
      };

      setActiveTripDetail(tripDetail);
    }

    loadTripDetail();
  }, [activeTripId, matches]);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?returnTo=/trip-matches");
        return;
      }

      // Get user's profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      // Load matches where this user is a candidate
      const { data, error } = await supabase
        .from("trip_request_matches")
        .select(
          `
          id,
          trip_request_id,
          match_score,
          reasons,
          trip_requests (
            id,
            destination,
            start_date,
            end_date,
            budget_min,
            budget_max,
            travelers_adults,
            travelers_children,
            created_at,
            status,
            source_brand_profile_id,
            source_collection_id,
            source_metadata,
            accepted_proposal_id,
            accepted_at
          )
        `
        )
        .eq("candidate_profile_id", profile.id)
        .order("match_score", { ascending: false });

      if (error) {
        console.error("Error loading matches:", error);
        setLoading(false);
        return;
      }

      // Enrich with brand avatars
      const typedMatches = data as any as TripMatch[];
      const brandProfileIds = [
        ...new Set(
          typedMatches.map((m) => m.trip_requests.source_brand_profile_id)
        ),
      ];

      const { data: brandProfiles } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", brandProfileIds);

      const brandAvatarMap = new Map(
        brandProfiles?.map((p) => [p.id, p.avatar_url]) ?? []
      );

      const enrichedMatches: EnrichedMatch[] = typedMatches.map((match) => ({
        ...match,
        brandAvatarUrl:
          brandAvatarMap.get(match.trip_requests.source_brand_profile_id) ||
          null,
      }));

      setMatches(enrichedMatches);
      setLoading(false);
    }

    loadMatches();
  }, [navigate]);

  const handleStatusChange = (tripRequestId: string, newStatus: TripRequestStatus) => {
    setMatches((prev) =>
      prev.map((match) =>
        match.trip_requests.id === tripRequestId
          ? {
              ...match,
              trip_requests: { ...match.trip_requests, status: newStatus },
            }
          : match
      )
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#BFAD72]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E0] py-8">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7151]">
              Your matched trips
            </span>
          </div>
          <h1 className="font-secondary text-4xl text-[#0a2225]">
            Trips curated for you
          </h1>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            These travelers are looking for someone with your vibe and expertise.
          </p>
        </div>

        {/* Matches grid */}
        {matches.length === 0 ? (
          <div className="rounded-2xl border border-[#E5DFC6] bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E0]">
              <MapPin className="h-8 w-8 text-[#7A7151]" />
            </div>
            <h3 className="mb-2 font-secondary text-xl text-[#0a2225]">
              No matches yet
            </h3>
            <p className="text-sm text-[#8C8470]">
              We'll notify you when travelers post trips that match your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const trip = match.trip_requests;
              const metadata = trip.source_metadata || {};
              const brandName = metadata.brand_name;
              const collectionTitle = metadata.collection_title;
              const tags = [
                ...(metadata.collection_tags || []),
                ...(metadata.storyboard_tags || []),
              ];

              return (
                <div
                  key={match.id}
                  className="group overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="p-6">
                    {/* Header row */}
                    <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-secondary text-xl text-[#0a2225]">
                            {trip.destination || "Trip Request"}
                          </h3>
                          <div className="flex items-center gap-1 rounded-full bg-[#F5F0E0] px-2 py-0.5">
                            <Star className="h-3 w-3 fill-[#BFAD72] text-[#BFAD72]" />
                            <span className="text-[10px] font-semibold text-[#7A7151]">
                              {match.match_score}% match
                            </span>
                          </div>
                        </div>

                        {brandName && collectionTitle && (
                          <p className="text-xs text-[#8C8470]">
                            Inspired by <span className="font-semibold">{collectionTitle}</span> from {brandName}
                          </p>
                        )}
                      </div>

                      <span className="text-[10px] uppercase tracking-wide text-[#7A7151]">
                        {new Date(trip.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Match reasons */}
                    {match.reasons && (
                      <div className="mb-4 rounded-lg bg-[#F5F0E0]/50 px-3 py-2">
                        <p className="text-xs text-[#4a4a4a]">
                          <span className="font-semibold text-[#7A7151]">Why you're a great fit:</span>{" "}
                          {match.reasons}
                        </p>
                      </div>
                    )}

                    {/* Trip details */}
                    <div className="mb-4 flex flex-wrap gap-4 text-sm text-[#4a4a4a]">
                      {trip.destination && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#BFAD72]" />
                          {trip.destination}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#BFAD72]" />
                        {trip.travelers_adults + trip.travelers_children} travelers
                      </div>

                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-[#BFAD72]" />
                        {formatBudgetRange(trip.budget_min, trip.budget_max)}
                      </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {tags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-[#E5DFC6] bg-white px-2.5 py-1 text-[10px] text-[#4a4a4a]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      onClick={() => setActiveTripId(trip.id)}
                      className="w-full rounded-full bg-[#0a2225] text-[#E5DFC6] hover:bg-[#0a2225]/90"
                    >
                      Open request
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trip Request Drawer */}
      {activeTripDetail && (
        <TripRequestDrawer
          open={true}
          onClose={() => {
            setActiveTripId(null);
            setActiveTripDetail(null);
          }}
          role="creator_agent"
          trip={activeTripDetail}
        />
      )}
    </div>
  );
}
