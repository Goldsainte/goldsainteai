import { useEffect, useState } from "react";
import { capLabel } from "@/lib/onTripCapabilities";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import ProposalCard from "@/components/marketplace/ProposalCard";
import { Loader2, MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { TripStoryboardViewer } from "@/components/TripStoryboardViewer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ProposalStatus = "pending" | "accepted" | "declined";

export type Proposal = {
  id: string;
  authorType: "agent" | "creator";
  authorName: string;
  handle?: string;
  avatarInitials: string;
  rating: number;
  reviewsCount: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  timelineLabel: string;
  highlights: string[];
  createdAt: string;
  status: ProposalStatus;
  message: string;
  agentId: string;
  validUntil?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  headline?: string | null;
  nights?: number | null;
  proposer?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  proposer_role?: "agent" | "creator";
  admin_margin_amount?: number;
  admin_margin_percent?: number;
  admin_cost_basis?: number;
  admin_complexity_score?: number;
  admin_supplier_notes?: string;
};

type TripRequest = {
  id: string;
  tripTitle: string;
  status: "open" | "matched" | "in_progress" | "completed" | "cancelled" | "closed";
  destination: string;
  departingFrom: string;
  dateRangeLabel: string;
  travelers: number;
  tripType: string;
  travelStyle: string;
  budgetMin: number;
  budgetMax: number;
  description: string;
  specialRequests?: string;
  createdAt: string;
  userId: string;
  interests?: string[];
  tripLengthDays?: number | null;
  budgetPerPerson?: boolean;
  mustHaves?: string[];
  dealbreakers?: string[];
  /** On-trip hire: the traveler wants this creator/agent to JOIN the trip. */
  hireOnTrip?: boolean;
  hireServiceTitle?: string | null;
  hireDayRate?: number | null;
  hireTripDays?: number | null;
  hireCapabilities?: string[];
};

type TravelerProfile = {
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

export default function TripRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [request, setRequest] = useState<TripRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile | null>(null);
  const [hasStoryboard, setHasStoryboard] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  // Check if storyboard has content
  useEffect(() => {
    if (!request?.id) return;
    async function checkStoryboard() {
      const { count } = await supabase
        .from("storyboard_items" as any)
        .select("id", { count: "exact", head: true })
        .eq("trip_request_id", request!.id);
      setHasStoryboard((count || 0) > 0);
    }
    checkStoryboard();
  }, [request?.id]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const { data: tripData, error: tripError } = await supabase
        .from("trip_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (tripError) throw tripError;
      if (!tripData) {
        setError("Trip request not found.");
        return;
      }

      if (tripData.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, created_at")
          .eq("id", tripData.user_id)
          .single();
        setTravelerProfile(profileData);
      }

      const tripStyle = typeof tripData.trip_style === 'string'
        ? tripData.trip_style
        : Array.isArray(tripData.travel_styles) && tripData.travel_styles.length > 0
          ? tripData.travel_styles[0]
          : "Not specified";

      const destination = tripData.destination || "Not specified";
      const titleFallback = tripData.title || (destination !== "Not specified" ? `Trip to ${destination}` : "New Trip Request");

      const sourceMeta = typeof tripData.source_metadata === 'object' && tripData.source_metadata ? tripData.source_metadata as Record<string, any> : {};

      const mappedRequest: TripRequest = {
        id: tripData.id,
        tripTitle: titleFallback,
        status: tripData.status as any,
        destination,
        departingFrom: tripData.departure_city || "Not specified",
        dateRangeLabel: tripData.start_date && tripData.end_date
          ? `${new Date(tripData.start_date).toLocaleDateString()} – ${new Date(tripData.end_date).toLocaleDateString()}${tripData.flexible_dates ? " (flexible)" : ""}`
          : "Dates TBD",
        travelers: (tripData.travelers_adults || 1) + (tripData.travelers_children || 0),
        tripType: tripStyle,
        travelStyle: tripData.accommodation_style || tripData.pace || "Not specified",
        budgetMin: tripData.budget_min || 0,
        budgetMax: tripData.budget_max || 0,
        description: tripData.description || "",
        specialRequests: tripData.special_notes,
        createdAt: tripData.created_at,
        userId: tripData.user_id,
        interests: Array.isArray(tripData.interests) ? tripData.interests : [],
        tripLengthDays: sourceMeta.trip_length_days || null,
        budgetPerPerson: sourceMeta.budget_per_person || false,
        mustHaves: Array.isArray(sourceMeta.must_haves) ? sourceMeta.must_haves : [],
        dealbreakers: Array.isArray(sourceMeta.dealbreakers) ? sourceMeta.dealbreakers : [],
        hireOnTrip: sourceMeta.hire_on_trip === true,
        hireServiceTitle: sourceMeta.hire_service_title || null,
        hireDayRate: typeof sourceMeta.hire_day_rate_usd === "number" ? sourceMeta.hire_day_rate_usd : null,
        hireTripDays: typeof sourceMeta.trip_days === "number" ? sourceMeta.trip_days : null,
        hireCapabilities: Array.isArray(sourceMeta.hire_capabilities) ? sourceMeta.hire_capabilities : [],
      };

      setRequest(mappedRequest);

      const isRequestOwner = user?.id === tripData.user_id;

      if (isRequestOwner) {
        const { data: proposalsData, error: proposalsError } = await supabase
          .from("trip_proposals")
          .select("*")
          .eq("trip_request_id", id)
          .order("created_at", { ascending: false });

        if (proposalsError) throw proposalsError;

        const proposerIds = [...new Set((proposalsData || []).map((p: any) => p.proposer_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        if (proposerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", proposerIds);
          for (const p of profilesData || []) {
            profilesMap[p.id] = p;
          }
        }

        const mappedProposals: Proposal[] = (proposalsData || []).map((proposal: any) => {
          const proposer = profilesMap[proposal.proposer_id] || {};
          const nights = proposal.nights || 7;
          return {
            id: proposal.id,
            authorType: proposal.proposer_role === "agent" ? "agent" : "creator",
            authorName: proposer.full_name || "Unknown",
            handle: `@${proposer.full_name?.toLowerCase().replace(/\s+/g, "") || "unknown"}`,
            avatarInitials: proposer.full_name?.substring(0, 2).toUpperCase() || "??",
            rating: 0,
            reviewsCount: 0,
            priceFrom: proposal.price_from || 0,
            priceTo: proposal.price_from || 0,
            currency: proposal.currency || "USD",
            timelineLabel: `${nights} nights`,
            highlights: [],
            createdAt: proposal.created_at,
            status: proposal.status as ProposalStatus,
            message: proposal.message || "",
            agentId: proposal.proposer_id,
            validUntil: proposal.valid_until || null,
            inclusions: proposal.inclusions,
            exclusions: proposal.exclusions,
            headline: proposal.headline,
            nights: proposal.nights,
            proposer: {
              id: proposer.id,
              full_name: proposer.full_name,
              avatar_url: proposer.avatar_url,
            },
            proposer_role: proposal.proposer_role,
            admin_margin_amount: proposal.admin_margin_amount,
            admin_margin_percent: proposal.admin_margin_percent,
            admin_cost_basis: proposal.admin_cost_basis,
            admin_complexity_score: proposal.admin_complexity_score,
            admin_supplier_notes: proposal.admin_supplier_notes,
          };
        });

        setProposals(mappedProposals);
      } else {
        const { count } = await supabase
          .from("trip_proposals")
          .select("*", { count: "exact", head: true })
          .eq("trip_request_id", id);

        setProposals([]);
        setProposalsCount(count || 0);
      }
    } catch (err: any) {
      console.error(err);
      setError("We couldn't load this trip request. Please refresh or try again later.");
      toast.error("Failed to load trip request");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async function handleAcceptProposal(proposalId: string) {
    if (!user) {
      toast.error("Please sign in to accept proposals");
      return;
    }
    if (!id) return;
    try {
      // Route through the ONE real accept path (accept_proposal_rpc). The old
      // bookingService.createBookingFromProposal was a stub that always threw
      // "temporarily disabled" — this button has never worked.
      const { acceptProposal } = await import("@/services/proposalsService");
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error("Proposal not found");
      const result = await acceptProposal(proposalId);
      toast.success("Proposal accepted! Booking created.");
      if (result?.booking_id) {
        setTimeout(() => navigate(`/bookings/${result.booking_id}`), 600);
      } else {
        setTimeout(() => navigate("/my-bookings"), 800);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to accept proposal");
    }
  }

  function handleSubmitProposal() {
    if (!user) {
      toast.error("Please sign in to submit a proposal");
      navigate("/auth");
      return;
    }
    navigate(`/proposals/new?tripId=${request?.id}`);
  }

  async function handleCloseRequest() {
    if (!request) return;
    const ok = await confirmDialog({
      title: "Close this trip request?",
      description:
        "It will leave the open marketplace immediately and agents and creators will no longer be able to submit proposals.",
      confirmText: "Close request",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase
        .from("trip_requests")
        .update({ status: "cancelled" })
        .eq("id", request.id);
      if (error) throw error;
      setRequest({ ...request, status: "cancelled" });
      toast.success("Your request is closed and off the marketplace.");
    } catch (err: any) {
      console.error("Failed to close trip request", err);
      toast.error(err.message || "Failed to close the request");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <div className="text-center px-8 py-12">
          <h2 className="font-secondary text-2xl text-foreground mb-2">Something went wrong</h2>
          <p className="text-[16px] text-muted-foreground">{error || "Trip request not found."}</p>
        </div>
      </div>
    );
  }

  const isRequestOwner = user?.id === request.userId;
  const travelerName = travelerProfile?.full_name || "A Goldsainte Traveler";

  const tripDetailsGrid = [
    { label: "Destination", value: request.destination },
    { label: "Departing from", value: request.departingFrom },
    { label: "Dates", value: request.dateRangeLabel },
    ...(request.tripLengthDays ? [{ label: "Trip length", value: `${request.tripLengthDays} days` }] : []),
    { label: "Travelers", value: `${request.travelers} ${request.travelers === 1 ? "person" : "people"}` },
    { label: "Trip type", value: request.tripType },
    { label: "Accommodation", value: request.travelStyle },
  ].filter(row => row.value && row.value !== "Not specified" && row.value !== "Dates TBD");

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* Back Button — above hero, always readable */}
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-4">
        <button
          type="button"
          onClick={() => navigate('/marketplace?tab=trip-requests')}
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.22em] text-[#0a2225]/50 transition-colors hover:text-[#0a2225]"
        >
          ← Trip Requests
        </button>
      </div>

      {/* ===================== HERO ===================== */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative h-[280px] overflow-hidden rounded-2xl md:h-[340px]">
          <img
            src={getTripRequestImageUrl(request.destination)}
            alt={request.destination || request.tripTitle}
            className="h-full w-full object-cover"
            loading="eager" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/25 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 md:px-9 md:pb-8">
            <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.3em] text-[#C7A962]/95">
              <span
                className={`inline-flex h-1.5 w-1.5 rounded-full ${
                  request.status === "open"
                    ? "bg-emerald-400"
                    : request.status === "in_progress"
                    ? "bg-amber-400"
                    : "bg-white/40"
                }`}
              />
              {request.hireOnTrip
                ? request.status === "open" ? "Direct hire request" : request.status === "in_progress" ? "In Progress" : "Closed"
                : request.status === "open" ? "Open Request" : request.status === "in_progress" ? "In Progress" : "Closed"}
            </p>

            <h1 className="mt-2 max-w-3xl font-secondary text-3xl leading-[1.05] text-[#fdfaf2] md:text-4xl lg:text-[44px]">
              {request.tripTitle}
            </h1>

            {request.hireOnTrip && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#C7A962] px-4 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#0a2225]">
                On-trip hire
                {request.hireDayRate ? ` \u00b7 listed at $${request.hireDayRate.toLocaleString()}/day` : ""}
                {request.hireServiceTitle ? ` \u00b7 ${request.hireServiceTitle}` : ""}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {request.destination && request.destination !== "Not specified" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[12px] uppercase tracking-[0.14em] text-[#E5DFC6]">
                  <MapPin className="h-3 w-3" />
                  {request.destination}
                </span>
              )}
              {request.dateRangeLabel && request.dateRangeLabel !== "Dates TBD" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[12px] uppercase tracking-[0.14em] text-[#E5DFC6]">
                  <Calendar className="h-3 w-3" />
                  {request.dateRangeLabel}
                </span>
              )}
              {request.travelers > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[12px] uppercase tracking-[0.14em] text-[#E5DFC6]">
                  <Users className="h-3 w-3" />
                  {request.travelers} {request.travelers === 1 ? "traveler" : "travelers"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== TWO-COLUMN BODY ===================== */}
      <div className="mx-auto max-w-5xl px-4 py-7 md:py-9">
        <div className="flex flex-col gap-10 lg:flex-row">

          {/* ===== MAIN COLUMN ===== */}
          <div className="flex-1 min-w-0 space-y-7">

            {/* Traveler identity — inline, not a card */}
            {travelerProfile && (
              <div className="flex items-center gap-3 border-b border-[#0a2225]/10 pb-5">
                <Avatar className="h-11 w-11">
                  {travelerProfile.avatar_url ? (
                    <AvatarImage src={travelerProfile.avatar_url} alt={travelerName} />
                  ) : null}
                  <AvatarFallback className="bg-[#0c4d47] text-white text-[15px] font-semibold">
                    {travelerName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[15.5px] text-[#0a2225]">
                    Posted by <span className="font-secondary text-[16px]">{travelerName}</span>
                    {travelerProfile.created_at && (
                      <span className="text-[14.5px] text-[#0a2225]/50">
                        {" "}· Member since {new Date(travelerProfile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* THE ENGAGEMENT — one unified brief. Four short trip facts in a
                single aligned row (no wrapping labels, no sentence-values),
                chips beneath. All money lives in the rail — stated once. */}
            {request.hireOnTrip && (
              <div>
                <h2 className="mb-5 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">The Engagement</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
                  {[
                    { label: "Destination", value: request.destination !== "Not specified" ? request.destination : null },
                    { label: "Dates", value: request.dateRangeLabel !== "Dates TBD" ? request.dateRangeLabel : null },
                    { label: "On-trip days", value: request.hireTripDays ? `${request.hireTripDays} days` : null },
                    { label: "Travelers", value: request.travelers > 0 ? `${request.travelers} ${request.travelers === 1 ? "person" : "people"}` : null },
                  ]
                    .filter((c) => c.value)
                    .map((c, i) => (
                      <div key={i} className="border-t border-[#0a2225]/15 pt-3">
                        <p className="mb-1.5 whitespace-nowrap text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">{c.label}</p>
                        <p className="font-secondary text-[18px] text-[#0a2225]">{c.value}</p>
                      </div>
                    ))}
                </div>
                {(request.hireCapabilities?.length ?? 0) > 0 && (
                  <div className="mt-7">
                    <p className="mb-2.5 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">Hired for</p>
                    <div className="flex flex-wrap gap-2">
                      {request.hireCapabilities!.map((id: string) => (
                        <span key={id} className="inline-flex h-9 items-center rounded-full border border-[#C7A962]/40 bg-[#C7A962]/10 px-4 text-[15px] font-medium text-[#0a2225]">
                          {capLabel(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {request.description && (
              <div>
                <h2 className="mb-3 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">About This Trip</h2>
                <p className="max-w-2xl text-[16px] leading-[1.75] text-[#0a2225]/80 whitespace-pre-line">
                  {request.description}
                </p>
                {request.specialRequests && (
                  <div className="mt-4">
                    <p className="mb-1 text-[13.5px] font-medium uppercase tracking-[0.1em] text-[#0a2225]/45">Special requests</p>
                    <p className="max-w-2xl text-[16px] leading-[1.75] text-[#0a2225]/80">{request.specialRequests}</p>
                  </div>
                )}
              </div>
            )}

            {/* Trip Details Grid — clean, no cards */}
            {!request.hireOnTrip && tripDetailsGrid.length > 0 && (
              <div>
                <h2 className="mb-5 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Trip Details</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
                  {tripDetailsGrid.map((row, i) => (
                    <div key={i} className="border-t border-[#0a2225]/15 pt-3">
                      <p className="mb-1.5 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">{row.label}</p>
                      <p className="font-secondary text-[17px] capitalize text-[#0a2225]">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {request.interests && request.interests.length > 0 && (
              <div>
                <h2 className="mb-3 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {request.interests.map(tag => (
                    <span key={tag} className="inline-flex h-8 items-center rounded-full border border-[#0a2225]/15 bg-white px-3.5 text-[14.5px] text-[#0a2225]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Must-Haves */}
            {request.mustHaves && request.mustHaves.length > 0 && (
              <div>
                <h2 className="mb-3 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Must-Haves</h2>
                <div className="flex flex-wrap gap-2">
                  {request.mustHaves.map(item => (
                    <span key={item} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#0c4d47]/25 bg-[#0c4d47]/[0.06] px-3.5 text-[14.5px] text-[#0c4d47]">
                      <span className="text-[#C7A962]">✓</span> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dealbreakers */}
            {request.dealbreakers && request.dealbreakers.length > 0 && (
              <div>
                <h2 className="mb-3 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Dealbreakers</h2>
                <div className="flex flex-wrap gap-2">
                  {request.dealbreakers.map(item => (
                    <span key={item} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#8b3a3a]/25 bg-[#8b3a3a]/[0.05] px-3.5 text-[14.5px] text-[#8b3a3a]">
                      ✗ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Brief — only if content exists */}
            {hasStoryboard && (
              <div>
                <h2 className="mb-3 text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Visual Brief</h2>
                <TripStoryboardViewer tripId={request.id} variant="gallery" />
              </div>
            )}

            {/* Proposals section — only for trip owner */}
            {isRequestOwner && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">Proposals Received</h2>
                  <span className="inline-flex items-center rounded-full border border-[#C7A962]/50 bg-[#C7A962]/15 px-2.5 py-0.5 text-[13.5px] font-medium text-[#8D6B2F]">
                    {proposals.length}
                  </span>
                </div>

                {proposals.length === 0 ? (
                  <div className="border-t border-[#0a2225]/15 pt-6">
                    <p className="font-secondary text-[20px] text-[#0a2225]">No proposals yet</p>
                    <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-[#0a2225]/55">
                      As agents and creators respond, their proposals will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="space-y-3">
                        <ProposalCard proposal={proposal} showAdminInsights={isAdmin} />

                        <div className="flex items-center justify-between gap-3 px-1">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) {
                                navigate("/auth");
                                return;
                              }
                              const partnerId = (proposal as any).proposer_id;
                              if (!partnerId) {
                                toast.error("Unable to open chat — proposer info missing.");
                                return;
                              }
                              try {
                                // Route through the dm-model the inbox reads.
                                // (No tripId — request.id is a trip_request, not a
                                // packaged_trip, so it would violate the dm FK.)
                                const { data: dm, error: dmErr } = await supabase.functions.invoke("send-direct-message", {
                                  body: {
                                    recipientId: partnerId,
                                    message: `Hi! I have a question about my ${request?.destination ?? "trip"} request.`,
                                    tripTitle: request?.destination ?? undefined,
                                  },
                                });
                                if (dmErr) throw dmErr;
                                if (!dm?.conversationId) throw new Error("No conversation returned");
                                navigate(`/messages?conversation=${dm.conversationId}`);
                              } catch (err: any) {
                                toast.error(err.message || "Failed to open conversation.");
                              }
                            }}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#0a2225]/20 bg-white px-6 text-[13.5px] font-medium uppercase tracking-[0.12em] text-[#0a2225] transition-colors hover:border-[#C7A962]"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptProposal(proposal.id)}
                            disabled={proposal.status === "accepted" || proposal.status === "declined"}
                            className={`inline-flex min-h-[44px] items-center rounded-full px-6 text-[13.5px] font-medium uppercase tracking-[0.12em] transition-colors ${
                              proposal.status === "accepted" || proposal.status === "declined"
                                ? "cursor-not-allowed bg-[#0a2225]/10 text-[#0a2225]/40"
                                : "bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0a2225]"
                            }`}
                          >
                            {proposal.status === "accepted" ? "Accepted" : "Accept Proposal"}
                          </button>
                        </div>

                        {proposal.status !== "accepted" && proposal.status !== "declined" && (
                          <div className="mx-1 border-l-2 border-[#C7A962] py-1 pl-4 text-[14.5px] leading-relaxed text-[#0a2225]/70">
                            <p>
                              <span className="font-semibold">By accepting this proposal</span>, your trip and payments stay protected by Goldsainte.
                            </p>
                            <p className="mt-1.5">
                              For your safety, please do not send direct bank transfers or share
                              phone numbers to finalize payment.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== SIDEBAR (sticky) ===== */}
          <aside className="w-full lg:w-[360px] lg:flex-shrink-0">
            <div className="sticky top-20 space-y-6">

              {/* Budget + CTA Card */}
              <div className="border-t border-[#0a2225]/15 pt-6">
                {(request.budgetMin > 0 || request.budgetMax > 0) && (
                  <div className="mb-6">
                    <p className="text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                      {request.hireOnTrip ? "Estimate" : "Budget"}
                    </p>
                    <p className="mt-3 font-secondary text-[38px] leading-none text-[#0a2225]">
                      {request.hireOnTrip
                        ? formatCurrency(request.budgetMax)
                        : `${formatCurrency(request.budgetMin)} \u2013 ${formatCurrency(request.budgetMax)}`}
                    </p>
                    {request.hireOnTrip && request.hireDayRate ? (
                      <p className="mt-1.5 text-[13.5px] text-[#0a2225]/50">
                        {request.hireTripDays ? `${request.hireTripDays} days \u00d7 ` : ""}${request.hireDayRate.toLocaleString()}/day listed rate {"\u2014"} an estimate. Your proposal sets the final total.
                      </p>
                    ) : request.budgetPerPerson ? (
                      <p className="mt-1.5 text-[13.5px] text-[#0a2225]/50">per person</p>
                    ) : null}
                  </div>
                )}

                {!isRequestOwner && request.status === "open" && (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmitProposal}
                      className="block w-full rounded-full bg-[#0c4d47] py-3.5 text-center text-[14.5px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] min-h-[48px]"
                    >
                      {request.hireOnTrip ? "Reply With Your Proposal" : "Submit Your Proposal"}
                    </button>

                    <p className="mt-3 text-center text-[13.5px] italic text-[#0a2225]/50">
                      {request.hireOnTrip
                        ? "This request was sent only to you."
                        : proposalsCount === 0
                        ? "Be the first to propose"
                        : `${proposalsCount} proposal${proposalsCount === 1 ? "" : "s"} submitted`}
                    </p>
                  </>
                )}
                {/* Honest states instead of a silent dead-end: say WHY there is
                    no submit button, mirroring the own-trip message pattern. */}
                {isRequestOwner && request.status === "open" && (
                  <div className="space-y-4">
                    <p className="text-center text-[14.5px] leading-relaxed text-[#0a2225]/60">
                      This is your trip request — you can't submit a proposal to
                      yourself. Proposals from agents and creators will appear
                      below as they come in.
                    </p>
                    <button
                      type="button"
                      onClick={handleCloseRequest}
                      className="block w-full rounded-full border border-[#0a2225]/15 py-3 text-center text-[13.5px] font-medium uppercase tracking-[0.12em] text-[#8b3a2e] transition-colors hover:border-[#8b3a2e]/40 hover:bg-[#8b3a2e]/5 min-h-[44px]"
                    >
                      Close This Request
                    </button>
                  </div>
                )}
                {isRequestOwner && request.status === "cancelled" && (
                  <p className="text-center text-[14.5px] leading-relaxed text-[#0a2225]/60">
                    You closed this request — it's no longer visible on the open
                    marketplace.
                  </p>
                )}
                {isRequestOwner && request.status !== "open" && request.status !== "cancelled" && (
                  <p className="text-center text-[14.5px] leading-relaxed text-[#0a2225]/60">
                    Proposals are closed while this trip is underway.
                  </p>
                )}
                {!isRequestOwner && request.status !== "open" && (
                  <p className="text-center text-[14.5px] leading-relaxed text-[#0a2225]/60">
                    This request is no longer accepting proposals.
                  </p>
                )}
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ============= THE PROCESS — full walkthrough, house register =============
          Written for someone who has NEVER used Goldsainte: titled steps in
          plain language, the money facts, and the cancellation policy link. */}
      <div className="mx-auto max-w-5xl px-4 pb-14">
        <div className="border-t border-[#0a2225]/15 pt-8">
          <h2 className="text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">
            {request.hireOnTrip ? "How this works, start to finish" : "How it works"}
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {(request.hireOnTrip
              ? [
                  {
                    t: "Review the request",
                    b: `Look over the dates, the party, and what ${travelerName.split(" ")[0]} hired you for. Nothing is committed yet \u2014 this is just an invitation.`,
                  },
                  {
                    t: "Ask questions first",
                    b: `Use Messages to ask ${travelerName.split(" ")[0]} anything before you commit. Keep every conversation on Goldsainte \u2014 that's what lets us step in if something goes wrong.`,
                  },
                  {
                    t: "Reply with your proposal",
                    b: "The proposal form walks you through it: confirm you're available, describe your plan, say who covers your travel and lodging, and set your total price.",
                  },
                  {
                    t: "They accept and pay a deposit",
                    b: "If they accept, the request becomes a booking and they pay a 25% deposit through secure checkout. You never handle payment yourself.",
                  },
                  {
                    t: "Paid at booking, secured by Stripe",
                    b: "Every payment runs through Goldsainte\u2019s secure Stripe checkout and settles directly to your own Stripe account \u2014 the deposit at acceptance, the balance before departure.",
                  },
                  {
                    t: "Deliver the trip",
                    b: "Travel with them and do exactly what your proposal promised. Day-of coordination happens in Messages.",
                  },
                  {
                    t: "Get paid",
                    b: "Payments land in your own Stripe account as they\u2019re made. Goldsainte\u2019s entire fee is a flat 7%, split between both sides \u2014 3.5% from you, 3.5% from the traveler.",
                  },
                ]
              : [
                  {
                    t: "Review the brief",
                    b: "Read the traveler's dates, budget, and inspiration to see if it fits your work.",
                  },
                  {
                    t: "Submit your proposal",
                    b: "Send your itinerary, pricing, and timeline. The traveler can message you with questions.",
                  },
                  {
                    t: "They compare and accept",
                    b: "The traveler reviews every proposal and accepts their favorite \u2014 acceptance creates a booking with a 25% deposit through secure Stripe checkout.",
                  },
                  {
                    t: "Deliver, then get paid",
                    b: "Payments are charged directly on your own Stripe account at booking. Goldsainte\u2019s flat fee is 7% total across both sides \u2014 the rest is yours, minus standard card processing.",
                  },
                ]
            ).map((step, i) => (
              <div key={i}>
                <p className="font-secondary text-[20px] italic text-[#C7A962]">
                  {["I.", "II.", "III.", "IV.", "V.", "VI.", "VII."][i]}
                </p>
                <p className="mt-1.5 font-secondary text-[19px] text-[#0a2225]">{step.t}</p>
                <p className="mt-2 text-[16px] leading-[1.75] text-[#0a2225]/75">{step.b}</p>
              </div>
            ))}
          </div>

          {/* The money, at a glance */}
          <div className="mt-11 border-t border-[#0a2225]/15 pt-7">
            <h3 className="text-[12.5px] uppercase tracking-[0.28em] text-[#8D6B2F]">The money, at a glance</h3>
            <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
              <div className="border-t border-[#0a2225]/15 pt-3">
                <p className="mb-1.5 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">Deposit</p>
                <p className="font-secondary text-[17px] text-[#0a2225]">25% at acceptance, paid at booking</p>
              </div>
              <div className="border-t border-[#0a2225]/15 pt-3">
                <p className="mb-1.5 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">Balance</p>
                <p className="font-secondary text-[17px] text-[#0a2225]">Due before departure, same secure checkout</p>
              </div>
              <div className="border-t border-[#0a2225]/15 pt-3">
                <p className="mb-1.5 text-[12.5px] uppercase tracking-[0.14em] text-[#0a2225]/50">Your payout</p>
                <p className="font-secondary text-[17px] text-[#0a2225]">96.5% of your price, paid straight to your Stripe account</p>
              </div>
            </div>
            <p className="mt-7 text-[16px] leading-relaxed text-[#0a2225]/75">
              Plans change {"\u2014"} cancellations and refunds follow the Goldsainte policy, which
              protects both sides of every booking.{" "}
              <Link
                to="/cancellation-refund-policy"
                className="whitespace-nowrap text-[#0c4d47] underline underline-offset-4 decoration-[#C7A962] hover:text-[#0a2225]"
              >
                Read the cancellation policy {"\u2192"}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA bar */}
      {!isRequestOwner && request.status === "open" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#fdfaf2]/95 backdrop-blur-md border-t border-[#0a2225]/10 px-4 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
            {(request.budgetMin > 0 || request.budgetMax > 0) && (
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                  {request.hireOnTrip ? "Estimate" : "Budget"}
                </p>
                <p className="font-secondary text-[16px] text-[#0a2225] truncate">
                  {request.hireOnTrip
                    ? formatCurrency(request.budgetMax)
                    : `${formatCurrency(request.budgetMin)} \u2013 ${formatCurrency(request.budgetMax)}`}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmitProposal}
              className="inline-flex items-center whitespace-nowrap rounded-full bg-[#0c4d47] px-6 py-3 text-[13.5px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] min-h-[44px]"
            >
              {request.hireOnTrip ? "Reply With Proposal" : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
