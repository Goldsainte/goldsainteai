import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalCard from "@/components/marketplace/ProposalCard";
import { Loader2, MapPin, Calendar, Users, Globe, Instagram } from "lucide-react";
import { CancellationPolicySelector } from "@/components/CancellationPolicySelector";
import { Checkbox } from "@/components/ui/checkbox";
import { MarketplaceDisclaimer } from "@/components/policies/MarketplaceDisclaimer";
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
  status: "open" | "in_progress" | "closed";
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
};

type UserProfile = {
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  website: string | null;
  bio: string | null;
};

// Luxury input class
const luxuryInputClass =
  "w-full rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-3 py-2.5 text-xs text-[#0a2225] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50 focus:border-[#C7A962] transition-colors";

// Gold section label
function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
      {children}
    </p>
  );
}

// TikTok icon (lucide doesn't have one)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [newProposal, setNewProposal] = useState({
    priceFrom: "",
    priceTo: "",
    timelineLabel: "",
    message: "",
    included: "",
    notIncluded: "",
    itineraryOverview: "",
    fitReason: "",
    cancellationPolicyId: "" as string | "",
    customCancellationTerms: "",
    depositPercentage: "",
    depositDueDays: "",
    ackGoldsaintePolicies: false,
    ackAgentCancellation: false,
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

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

      let travelerProfile = null;
      if (tripData.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", tripData.user_id)
          .single();
        travelerProfile = profileData;
      }

      const tripStyle = typeof tripData.trip_style === 'string' 
        ? tripData.trip_style 
        : Array.isArray(tripData.travel_styles) && tripData.travel_styles.length > 0 
          ? tripData.travel_styles[0] 
          : "Not specified";

      const mappedRequest: TripRequest = {
        id: tripData.id,
        tripTitle: tripData.title || "Untitled Trip",
        status: tripData.status as any,
        destination: tripData.destination || "Not specified",
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
      };

      setRequest(mappedRequest);

      const isRequestOwner = user?.id === tripData.user_id;

      // Fetch current user's profile for proposer card
      if (user && !isRequestOwner) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name, full_name, avatar_url, tiktok_handle, instagram_handle, website, bio")
          .eq("id", user.id)
          .maybeSingle();
        setUserProfile(myProfile);
      }

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
      const { createBookingFromProposal } = await import("@/services/bookingService");
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error("Proposal not found");
      await createBookingFromProposal({ tripId: id, proposalId });
      toast.success("Proposal accepted! Booking created successfully.");
      setTimeout(() => navigate("/bookings"), 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to accept proposal");
    }
  }

  async function handleSubmitProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a proposal");
      navigate("/auth");
      return;
    }
    const { data: agent } = await supabase
      .from('travel_agents')
      .select('terms_accepted')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!agent?.terms_accepted) {
      toast.error("Please accept agent terms before submitting proposals");
      return;
    }
    if (!newProposal.ackGoldsaintePolicies || !newProposal.ackAgentCancellation) {
      toast.error("Please confirm all required policy acknowledgements before submitting.");
      return;
    }
    if (!newProposal.priceFrom || !newProposal.itineraryOverview || !newProposal.fitReason) {
      toast.error("Please fill in price, itinerary overview, and why you're a great fit");
      return;
    }
    setSubmittingProposal(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();
      const proposerRole = profile?.account_type === "agent" ? "agent" : "creator";
      const { data: proposalData, error: proposalError } = await supabase
        .from("trip_proposals")
        .insert({
          trip_request_id: id,
          ...(proposerRole === 'agent' ? { agent_id: user.id } : { creator_id: user.id }),
          price_from: parseFloat(newProposal.priceFrom),
          currency: "USD",
          nights: parseInt(newProposal.timelineLabel) || 7,
          status: "sent",
          inclusions: newProposal.included || null,
          exclusions: newProposal.notIncluded || null,
          message: newProposal.itineraryOverview,
          headline: newProposal.fitReason || `${proposerRole === "agent" ? "Agent" : "Creator"} proposal`,
          cancellation_policy_id: newProposal.cancellationPolicyId || null,
          custom_cancellation_terms: newProposal.customCancellationTerms || null,
          deposit_percentage: newProposal.depositPercentage ? parseFloat(newProposal.depositPercentage) : null,
          deposit_due_days: newProposal.depositDueDays ? parseInt(newProposal.depositDueDays) : null,
          acknowledged_goldsainte_policies: true,
        } as any)
        .select()
        .single();
      if (proposalError) throw proposalError;
      if (proposalData?.id) {
        supabase.functions
          .invoke("compute-proposal-insights", { body: { proposalId: proposalData.id } })
          .catch((err) => console.error("Admin insights error:", err));
      }
      toast.success("Proposal submitted successfully!");
      setNewProposal({
        priceFrom: "", priceTo: "", timelineLabel: "", message: "",
        included: "", notIncluded: "", itineraryOverview: "", fitReason: "",
        cancellationPolicyId: "", customCancellationTerms: "",
        depositPercentage: "", depositDueDays: "",
        ackGoldsaintePolicies: false, ackAgentCancellation: false,
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-[#0a2225]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <div className="rounded-2xl border border-[#E5DFC6] bg-white px-6 py-5 text-sm text-[#0a2225] shadow-sm">
          {error || "Trip request not found."}
        </div>
      </div>
    );
  }

  const isRequestOwner = user?.id === request.userId;
  const profileName = userProfile?.display_name || userProfile?.full_name;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* Hero Header */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        <img
          src={getTripRequestImageUrl(request.destination)}
          alt={request.destination || request.tripTitle}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="absolute bottom-6 left-1/2 w-full max-w-6xl -translate-x-1/2 px-4">
          <div className="flex flex-col gap-2 text-white">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span
                className={[
                  "inline-flex h-1.5 w-1.5 rounded-full",
                  request.status === "open"
                    ? "bg-emerald-300"
                    : request.status === "in_progress"
                    ? "bg-amber-300"
                    : "bg-gray-400",
                ].join(" ")}
              />
              Trip Request
            </div>
            <h1 className="font-secondary text-2xl md:text-3xl">
              {request.tripTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/85">
              {request.destination && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="max-w-[200px] truncate md:max-w-xs">
                    {request.destination}
                  </span>
                </span>
              )}
              {request.dateRangeLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 backdrop-blur-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {request.dateRangeLabel}
                </span>
              )}
              {request.travelers > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5" />
                  {request.travelers} {request.travelers === 1 ? "traveler" : "travelers"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/marketplace?tab=trip-requests')}
          className="self-start text-xs font-medium text-[#7A7151] hover:text-[#0a2225] transition-colors"
        >
          ← Back to trip requests
        </button>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* LEFT: Proposals list + submit form */}
          <div className="w-full md:w-2/3">
            {/* Proposal submission form */}
            {!isRequestOwner && request.status === "open" && (
              <div className="mb-5 rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
                <GoldLabel>Your Proposal</GoldLabel>
                <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">
                  Submit a proposal
                </h2>
                <p className="mt-1 text-[11px] text-[#6B7280]">
                  Share your pricing range and a clear outline of how you'll design and manage this trip.
                </p>

                {/* Proposer Profile Card */}
                {userProfile && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] p-3">
                    <Avatar className="h-10 w-10 border border-[#E5DFC6]">
                      {userProfile.avatar_url ? (
                        <AvatarImage src={userProfile.avatar_url} alt={profileName || "You"} />
                      ) : null}
                      <AvatarFallback className="bg-[#0c4d47] text-white text-xs font-semibold">
                        {(profileName || "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0a2225]">
                        {profileName || "Your Profile"}
                      </p>
                      {userProfile.bio && (
                        <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">
                          {userProfile.bio.substring(0, 120)}
                          {userProfile.bio.length > 120 ? "…" : ""}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        {userProfile.tiktok_handle && (
                          <a
                            href={`https://tiktok.com/@${userProfile.tiktok_handle.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0a2225]/60 hover:text-[#0a2225] transition-colors"
                            title="TikTok"
                          >
                            <TikTokIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {userProfile.instagram_handle && (
                          <a
                            href={`https://instagram.com/${userProfile.instagram_handle.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0a2225]/60 hover:text-[#0a2225] transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {userProfile.website && (
                          <a
                            href={userProfile.website.startsWith("http") ? userProfile.website : `https://${userProfile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0a2225]/60 hover:text-[#0a2225] transition-colors"
                            title="Website"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Link
                          to="/travel-settings"
                          className="ml-auto text-[10px] font-medium text-[#7A7151] hover:text-[#0a2225] underline underline-offset-2"
                        >
                          Edit profile
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitProposal} className="mt-4 space-y-4 text-xs">
                  {/* Price + timeline */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225]">Price (USD)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        className={luxuryInputClass}
                        placeholder="e.g. 6500"
                        value={newProposal.priceFrom}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, priceFrom: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        Total estimated trip price per request details.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225]">Timeline (days)</label>
                      <input
                        type="text"
                        className={luxuryInputClass}
                        placeholder="e.g. 3–5"
                        value={newProposal.timelineLabel}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, timelineLabel: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        Approximate trip length based on your proposed itinerary.
                      </p>
                    </div>
                  </div>

                  {/* Included / not included */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225]">Included in this proposal</label>
                      <textarea
                        rows={3}
                        className={luxuryInputClass}
                        placeholder="Hotels, private transfers, daily breakfast, guided experiences, concierge support…"
                        value={newProposal.included}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, included: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        Be specific about flights, hotels, ground transport, activities, and support.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225]">
                        Not included / optional add-ons
                      </label>
                      <textarea
                        rows={3}
                        className={luxuryInputClass}
                        placeholder="International flights, travel insurance, most dinners, spa treatments, optional excursions…"
                        value={newProposal.notIncluded}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, notIncluded: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        Help the traveler understand what&apos;s extra or upgradable.
                      </p>
                    </div>
                  </div>

                  {/* Itinerary overview */}
                  <div className="space-y-1">
                    <label className="font-medium text-[#0a2225]">Sample itinerary overview</label>
                    <textarea
                      rows={4}
                      required
                      className={luxuryInputClass}
                      placeholder={`Day 1: Arrival & check-in · Day 2: Private yacht & coastal exploring · Day 3: Wine country · Day 4: Departure…`}
                      value={newProposal.itineraryOverview}
                      onChange={(e) => setNewProposal((prev) => ({ ...prev, itineraryOverview: e.target.value }))}
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      A concise day-by-day outline so the traveler can instantly feel the trip.
                    </p>
                  </div>

                  {/* Why you're a great fit */}
                  <div className="space-y-1">
                    <label className="font-medium text-[#0a2225]">Why you&apos;re a great fit</label>
                    <textarea
                      rows={3}
                      required
                      className={luxuryInputClass}
                      placeholder="Your expertise with this destination, hotel partners, on-the-ground connections, and similar trips you've designed."
                      value={newProposal.fitReason}
                      onChange={(e) => setNewProposal((prev) => ({ ...prev, fitReason: e.target.value }))}
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      Think of this as your editorial intro – why this trip is perfectly matched to you.
                    </p>
                  </div>

                  {/* Cancellation policy */}
                  <div className="space-y-2">
                    <CancellationPolicySelector
                      selectedPolicyId={newProposal.cancellationPolicyId || undefined}
                      onPolicySelect={(policyId) =>
                        setNewProposal((prev) => ({ ...prev, cancellationPolicyId: policyId }))
                      }
                    />
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225] text-xs">
                        Additional cancellation / refund terms (optional)
                      </label>
                      <textarea
                        rows={3}
                        className={luxuryInputClass}
                        placeholder="Add any agency-specific nuances, blackout dates, or non-refundable elements."
                        value={newProposal.customCancellationTerms}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, customCancellationTerms: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Deposit */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225] text-xs">Required deposit (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={luxuryInputClass}
                        placeholder="e.g. 30"
                        value={newProposal.depositPercentage}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, depositPercentage: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        If left blank, we'll treat this as due in full at confirmation.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#0a2225] text-xs">Deposit due (days after acceptance)</label>
                      <input
                        type="number"
                        min={0}
                        className={luxuryInputClass}
                        placeholder="e.g. 3"
                        value={newProposal.depositDueDays}
                        onChange={(e) => setNewProposal((prev) => ({ ...prev, depositDueDays: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#6B7280]">
                        When the traveler must pay the deposit to keep this proposal valid.
                      </p>
                    </div>
                  </div>

                  {/* Legal acknowledgements */}
                  <div className="space-y-2 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-3 py-3">
                    <p className="text-[11px] font-semibold text-[#0a2225]">
                      Legal & policy acknowledgements
                    </p>
                    <label className="flex items-start gap-2 text-[11px] text-[#6B7280]">
                      <Checkbox
                        checked={newProposal.ackGoldsaintePolicies}
                        onCheckedChange={(checked) =>
                          setNewProposal((prev) => ({ ...prev, ackGoldsaintePolicies: Boolean(checked) }))
                        }
                      />
                      <span>
                        I understand that Goldsainte operates as a marketplace and that I, as the
                        travel professional, am solely responsible for trip delivery, supplier
                        contracts, and compliance. I've reviewed the{" "}
                        <Link to="/cancellation-refund-policy" className="underline underline-offset-2 text-[#7A7151]" target="_blank">
                          Cancellation & Refund Policy
                        </Link>{" "}
                        and{" "}
                        <Link to="/terms" className="underline underline-offset-2 text-[#7A7151]" target="_blank">
                          Terms & Conditions
                        </Link>.
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-[11px] text-[#6B7280]">
                      <Checkbox
                        checked={newProposal.ackAgentCancellation}
                        onCheckedChange={(checked) =>
                          setNewProposal((prev) => ({ ...prev, ackAgentCancellation: Boolean(checked) }))
                        }
                      />
                      <span>
                        I confirm that the cancellation, refund, and deposit terms in this
                        proposal are accurate, clearly communicated, and will be honored exactly
                        as stated if the traveler accepts.
                      </span>
                    </label>
                  </div>

                  <MarketplaceDisclaimer size="sm" />

                  {/* Submit */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={submittingProposal}
                      className="inline-flex items-center rounded-full bg-[#0c4d47] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c4d47]/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submittingProposal ? "Submitting..." : "Submit proposal"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Proposals list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <GoldLabel>Responses</GoldLabel>
                  <h2 className="mt-0.5 font-secondary text-lg text-[#0a2225]">
                    Proposals{" "}
                    <span className="ml-1 inline-flex items-center rounded-full bg-[#FDFBF5] border border-[#E5DFC6] px-2 py-0.5 text-[11px] font-semibold text-[#7A7151]">
                      {isRequestOwner ? proposals.length : proposalsCount}
                    </span>
                  </h2>
                </div>
                {isRequestOwner && (
                  <p className="text-[11px] text-[#6B7280]">
                    Compare pricing, approach, and reviews before accepting one proposal.
                  </p>
                )}
              </div>

              {isRequestOwner ? (
                proposals.length === 0 ? (
                  <div className="rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4 text-xs text-[#6B7280] shadow-sm">
                    No proposals yet. As agents and creators respond, they'll appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="space-y-3">
                        <ProposalCard proposal={proposal} showAdminInsights={isAdmin} />
                        
                        {isRequestOwner && (
                          <div className="flex items-center justify-between gap-2 px-2">
                            <button
                              type="button"
                              onClick={() => toast.info("Chat feature coming soon")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-xs font-medium text-[#0a2225] hover:border-[#C7A962] transition-colors"
                            >
                              Message
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptProposal(proposal.id)}
                              disabled={proposal.status === "accepted" || proposal.status === "declined"}
                              className={[
                                "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors",
                                proposal.status === "accepted" || proposal.status === "declined"
                                  ? "cursor-not-allowed bg-[#E5DFC6]/50 text-[#6B7280]"
                                  : "bg-[#0c4d47] text-white hover:bg-[#0c4d47]/90",
                              ].join(" ")}
                            >
                              {proposal.status === "accepted" ? "Accepted" : "Accept proposal"}
                            </button>
                          </div>
                        )}

                        {isRequestOwner && proposal.status !== "accepted" && proposal.status !== "declined" && (
                          <div className="mx-2 rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5] p-2.5 text-[10px] text-[#0a2225]">
                            <p>
                              <span className="font-semibold">By accepting this proposal</span>, your trip and payments stay protected by Goldsainte.
                            </p>
                            <p className="mt-1">
                              For your safety, please do not send direct bank transfers or share
                              phone numbers to finalize payment. All payments and changes should
                              go through this platform.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-[#E5DFC6] bg-white px-4 py-4 text-xs text-[#6B7280] shadow-sm">
                  {proposalsCount > 0 
                    ? `${proposalsCount} ${proposalsCount === 1 ? 'proposal' : 'proposals'} submitted so far. Your proposal will only be visible to the trip owner.`
                    : "No proposals yet. Be the first to submit a proposal!"}
                </div>
              )}

              <MarketplaceDisclaimer size="sm" align="center" />
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              {/* Trip Summary */}
              <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
                <GoldLabel>Overview</GoldLabel>
                <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">Trip summary</h2>
                <div className="mt-3 space-y-2.5 text-xs text-[#0a2225]">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">Destination</span>
                    <span className="font-medium">{request.destination}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">Departing from</span>
                    <span className="font-medium">{request.departingFrom}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">Dates</span>
                    <span className="text-right font-medium">{request.dateRangeLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">Travelers</span>
                    <span className="font-medium">
                      {request.travelers} {request.travelers === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">Budget range</span>
                    <span className="text-right font-semibold text-[#0a2225]">
                      {formatCurrency(request.budgetMin)} – {formatCurrency(request.budgetMax)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#E5DFC6] pt-3 text-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
                    Trip overview
                  </p>
                  <p className="mt-1 text-[#0a2225]">{request.description}</p>

                  {request.specialRequests && (
                    <>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
                        Special requests
                      </p>
                      <p className="mt-1 text-[#0a2225]">{request.specialRequests}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Trip Storyboard */}
              <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
                <GoldLabel>Visual Brief</GoldLabel>
                <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">Trip Storyboard</h2>
                <p className="mt-1 text-[11px] text-[#6B7280]">
                  The traveler's visual mood board — curated inspiration for this journey.
                </p>
                <div className="mt-3">
                  <TripStoryboardViewer tripId={request.id} />
                </div>
              </div>

              {/* Tips card */}
              <div className="rounded-2xl bg-[#0c4d47] p-5 text-xs text-emerald-50 shadow-sm">
                <h3 className="font-secondary text-base font-semibold text-white">Tips for choosing a proposal</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-emerald-50/90 text-[11px]">
                  <li>Compare what's included: flights, hotels, transfers, tours.</li>
                  <li>Look at reviews and experience with similar trips.</li>
                  <li>Ask clarifying questions in chat before approving a proposal.</li>
                  <li>Confirm cancellation policies and payment schedule.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
