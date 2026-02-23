import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalCard from "@/components/marketplace/ProposalCard";
import { Loader2, MapPin, Calendar, Users, Globe, Instagram, DollarSign } from "lucide-react";
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

type TravelerProfile = {
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

// Luxury input class
const luxuryInputClass =
  "w-full rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-3 text-sm text-[#0a2225] placeholder:text-[#9A9079] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50 focus:border-[#C7A962] transition-colors";

// Gold section label
function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
      {children}
    </p>
  );
}

// TikTok icon
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
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile | null>(null);

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
      };

      setRequest(mappedRequest);

      const isRequestOwner = user?.id === tripData.user_id;

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
        <div className="rounded-2xl border border-[#E5DFC6] bg-white px-8 py-6 text-sm text-[#0a2225] shadow-sm text-center">
          <p className="font-secondary text-lg mb-1">Something went wrong</p>
          <p className="text-[#6B7280]">{error || "Trip request not found."}</p>
        </div>
      </div>
    );
  }

  const isRequestOwner = user?.id === request.userId;
  const profileName = userProfile?.display_name || userProfile?.full_name;
  const travelerName = travelerProfile?.full_name || "A Goldsainte Traveler";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* ===================== HERO (compact 280px) ===================== */}
      <div className="relative h-[240px] w-full overflow-hidden md:h-[280px]">
        <img
          src={getTripRequestImageUrl(request.destination)}
          alt={request.destination || request.tripTitle}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              onClick={() => navigate('/marketplace?tab=trip-requests')}
              className="mb-3 text-xs font-medium text-white/70 hover:text-white transition-colors"
            >
              ← Back to trip requests
            </button>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
              <span
                className={[
                  "inline-flex h-2 w-2 rounded-full",
                  request.status === "open"
                    ? "bg-emerald-400"
                    : request.status === "in_progress"
                    ? "bg-amber-400"
                    : "bg-gray-400",
                ].join(" ")}
              />
              {request.status === "open" ? "Open Request" : request.status === "in_progress" ? "In Progress" : "Closed"}
            </div>

            <h1 className="font-secondary text-2xl md:text-3xl lg:text-4xl text-white leading-tight max-w-3xl">
              {request.tripTitle}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {request.destination && request.destination !== "Not specified" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <MapPin className="h-3 w-3" />
                  {request.destination}
                </span>
              )}
              {request.dateRangeLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />
                  {request.dateRangeLabel}
                </span>
              )}
              {request.travelers > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <Users className="h-3 w-3" />
                  {request.travelers} {request.travelers === 1 ? "traveler" : "travelers"}
                </span>
              )}
              {(request.budgetMin > 0 || request.budgetMax > 0) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7A962]/25 border border-[#C7A962]/40 px-3 py-1 text-xs font-semibold text-[#C7A962] backdrop-blur-sm">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(request.budgetMin)} – {formatCurrency(request.budgetMax)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== TWO-COLUMN MARKETPLACE LAYOUT ===================== */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ===== LEFT COLUMN: Brief + Proposals + Form ===== */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Trip Brief Card */}
            <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 md:p-6 shadow-sm space-y-5">
              <div>
                <GoldLabel>Trip Brief</GoldLabel>
                <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">{request.tripTitle}</h2>
              </div>

              {request.description && (
                <div>
                  <p className="text-sm text-[#0a2225] leading-relaxed whitespace-pre-line">{request.description}</p>
                </div>
              )}

              {request.specialRequests && (
                <div className="border-t border-[#E5DFC6] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151] mb-2">Special Requests</p>
                  <p className="text-sm text-[#0a2225] leading-relaxed">{request.specialRequests}</p>
                </div>
              )}

              <div className="border-t border-[#E5DFC6] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151] mb-3">Visual Brief</p>
                <TripStoryboardViewer tripId={request.id} variant="gallery" />
              </div>
            </div>

            {/* Proposals section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-secondary text-lg text-[#0a2225]">Proposals</h2>
                  <span className="inline-flex items-center rounded-full bg-[#FDFBF5] border border-[#E5DFC6] px-2.5 py-0.5 text-xs font-semibold text-[#7A7151]">
                    {isRequestOwner ? proposals.length : proposalsCount}
                  </span>
                </div>
                {!isRequestOwner && request.status === "open" && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("proposal-form")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-xs font-semibold text-[#0c4d47] hover:underline"
                  >
                    Submit a proposal ↓
                  </button>
                )}
              </div>

              {isRequestOwner ? (
                proposals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white px-6 py-8 text-center shadow-sm">
                    <p className="font-secondary text-base text-[#0a2225]">No proposals yet</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      As agents and creators respond, their proposals will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="space-y-3">
                        <ProposalCard proposal={proposal} showAdminInsights={isAdmin} />
                        
                        {isRequestOwner && (
                          <div className="flex items-center justify-between gap-3 px-2">
                            <button
                              type="button"
                              onClick={() => toast.info("Chat feature coming soon")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm font-medium text-[#0a2225] hover:border-[#C7A962] transition-colors"
                            >
                              Message
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptProposal(proposal.id)}
                              disabled={proposal.status === "accepted" || proposal.status === "declined"}
                              className={[
                                "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors",
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
                          <div className="mx-2 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] p-3 text-xs text-[#0a2225] leading-relaxed">
                            <p>
                              <span className="font-semibold">By accepting this proposal</span>, your trip and payments stay protected by Goldsainte.
                            </p>
                            <p className="mt-1">
                              For your safety, please do not send direct bank transfers or share
                              phone numbers to finalize payment.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white px-6 py-6 text-center shadow-sm">
                  <p className="font-secondary text-base text-[#0a2225]">
                    {proposalsCount > 0 ? `${proposalsCount} ${proposalsCount === 1 ? 'proposal' : 'proposals'} submitted` : "Be the first to propose"}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {proposalsCount > 0 
                      ? "Your proposal will only be visible to the trip owner."
                      : "No proposals yet — submit yours below."}
                  </p>
                </div>
              )}
            </div>

            {/* Proposal Form (below proposals) */}
            {!isRequestOwner && request.status === "open" && (
              <div id="proposal-form" className="rounded-2xl border border-[#E5DFC6] bg-white p-5 md:p-6 shadow-sm">
                <GoldLabel>Your Proposal</GoldLabel>
                <h2 className="mt-1 font-secondary text-lg text-[#0a2225]">Submit a proposal</h2>
                <p className="mt-1 text-sm text-[#6B7280] leading-relaxed max-w-lg">
                  Share your pricing, itinerary, and why you're the perfect match.
                </p>

                {userProfile && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] p-4">
                    <Avatar className="h-11 w-11 border-2 border-[#E5DFC6]">
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
                        <p className="mt-0.5 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                          {userProfile.bio.substring(0, 120)}
                          {userProfile.bio.length > 120 ? "…" : ""}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2.5">
                        {userProfile.tiktok_handle && (
                          <a href={`https://tiktok.com/@${userProfile.tiktok_handle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-[#0a2225]/50 hover:text-[#0a2225] transition-colors" title="TikTok">
                            <TikTokIcon className="h-4 w-4" />
                          </a>
                        )}
                        {userProfile.instagram_handle && (
                          <a href={`https://instagram.com/${userProfile.instagram_handle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-[#0a2225]/50 hover:text-[#0a2225] transition-colors" title="Instagram">
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                        {userProfile.website && (
                          <a href={userProfile.website.startsWith("http") ? userProfile.website : `https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="text-[#0a2225]/50 hover:text-[#0a2225] transition-colors" title="Website">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        <Link to="/travel-settings" className="ml-auto text-xs font-medium text-[#7A7151] hover:text-[#0a2225] underline underline-offset-2">
                          Edit profile
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitProposal} className="mt-5 space-y-5 text-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Price (USD)</label>
                      <input type="number" min={0} required className={luxuryInputClass} placeholder="e.g. 6500" value={newProposal.priceFrom} onChange={(e) => setNewProposal((prev) => ({ ...prev, priceFrom: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Timeline (days)</label>
                      <input type="text" className={luxuryInputClass} placeholder="e.g. 3–5" value={newProposal.timelineLabel} onChange={(e) => setNewProposal((prev) => ({ ...prev, timelineLabel: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Included</label>
                      <textarea rows={3} className={luxuryInputClass} placeholder="Hotels, transfers, breakfast, guided experiences…" value={newProposal.included} onChange={(e) => setNewProposal((prev) => ({ ...prev, included: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Not included</label>
                      <textarea rows={3} className={luxuryInputClass} placeholder="Flights, travel insurance, most dinners…" value={newProposal.notIncluded} onChange={(e) => setNewProposal((prev) => ({ ...prev, notIncluded: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#0a2225]">Itinerary overview</label>
                    <textarea rows={4} required className={luxuryInputClass} placeholder="Day 1: Arrival · Day 2: Private yacht · Day 3: Wine country…" value={newProposal.itineraryOverview} onChange={(e) => setNewProposal((prev) => ({ ...prev, itineraryOverview: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#0a2225]">Why you're a great fit</label>
                    <textarea rows={3} required className={luxuryInputClass} placeholder="Your expertise, hotel partners, on-the-ground connections…" value={newProposal.fitReason} onChange={(e) => setNewProposal((prev) => ({ ...prev, fitReason: e.target.value }))} />
                  </div>

                  <div className="space-y-3">
                    <CancellationPolicySelector
                      selectedPolicyId={newProposal.cancellationPolicyId || undefined}
                      onPolicySelect={(policyId) => setNewProposal((prev) => ({ ...prev, cancellationPolicyId: policyId }))}
                    />
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Additional cancellation terms (optional)</label>
                      <textarea rows={2} className={luxuryInputClass} placeholder="Blackout dates, non-refundable elements…" value={newProposal.customCancellationTerms} onChange={(e) => setNewProposal((prev) => ({ ...prev, customCancellationTerms: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Deposit (%)</label>
                      <input type="number" min={0} max={100} className={luxuryInputClass} placeholder="e.g. 30" value={newProposal.depositPercentage} onChange={(e) => setNewProposal((prev) => ({ ...prev, depositPercentage: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-medium text-[#0a2225]">Deposit due (days)</label>
                      <input type="number" min={0} className={luxuryInputClass} placeholder="e.g. 3" value={newProposal.depositDueDays} onChange={(e) => setNewProposal((prev) => ({ ...prev, depositDueDays: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-[#E5DFC6] bg-[#FDFBF5] px-4 py-3">
                    <p className="text-sm font-semibold text-[#0a2225]">Policy acknowledgements</p>
                    <label className="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
                      <Checkbox checked={newProposal.ackGoldsaintePolicies} onCheckedChange={(checked) => setNewProposal((prev) => ({ ...prev, ackGoldsaintePolicies: Boolean(checked) }))} />
                      <span>
                        I understand that Goldsainte operates as a marketplace and I am solely responsible for trip delivery. I've reviewed the{" "}
                        <Link to="/cancellation-refund-policy" className="underline underline-offset-2 text-[#7A7151]" target="_blank">Cancellation Policy</Link>{" "}and{" "}
                        <Link to="/terms" className="underline underline-offset-2 text-[#7A7151]" target="_blank">Terms</Link>.
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
                      <Checkbox checked={newProposal.ackAgentCancellation} onCheckedChange={(checked) => setNewProposal((prev) => ({ ...prev, ackAgentCancellation: Boolean(checked) }))} />
                      <span>I confirm the cancellation, refund, and deposit terms in this proposal are accurate and will be honored.</span>
                    </label>
                  </div>

                  <MarketplaceDisclaimer size="sm" />

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submittingProposal}
                      className="inline-flex items-center rounded-full bg-[#0c4d47] px-7 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submittingProposal ? "Submitting..." : "Submit proposal"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <MarketplaceDisclaimer size="sm" align="center" />
          </div>

          {/* ===== RIGHT SIDEBAR (380px, sticky) ===== */}
          <aside className="w-full lg:w-[380px] lg:flex-shrink-0">
            <div className="sticky top-20 space-y-5">

              {/* Posted By */}
              {travelerProfile && (
                <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
                  <GoldLabel>Posted by</GoldLabel>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-[#E5DFC6]">
                      {travelerProfile.avatar_url ? (
                        <AvatarImage src={travelerProfile.avatar_url} alt={travelerName} />
                      ) : null}
                      <AvatarFallback className="bg-[#0c4d47] text-white text-xs font-semibold">
                        {travelerName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-secondary text-sm text-[#0a2225]">{travelerName}</p>
                      {travelerProfile.created_at && (
                        <p className="text-xs text-[#9A9079]">
                          Member since {new Date(travelerProfile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Summary */}
              <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
                <GoldLabel>Trip Details</GoldLabel>
                <div className="mt-3 space-y-3">
                  {[
                    { label: "Destination", value: request.destination },
                    { label: "Departing from", value: request.departingFrom },
                    { label: "Dates", value: request.dateRangeLabel },
                    { label: "Travelers", value: `${request.travelers} ${request.travelers === 1 ? "person" : "people"}` },
                    { label: "Trip style", value: request.tripType },
                    { label: "Travel style", value: request.travelStyle },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between gap-2 border-b border-[#E5DFC6]/50 pb-2.5 last:border-0 last:pb-0">
                      <span className="text-xs text-[#9A9079]">{row.label}</span>
                      <span className="text-xs font-medium text-[#0a2225] text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                {(request.budgetMin > 0 || request.budgetMax > 0) && (
                  <div className="mt-4 rounded-xl border border-[#C7A962]/30 bg-[#C7A962]/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151]">Budget</p>
                    <p className="mt-0.5 font-secondary text-lg text-[#0a2225]">
                      {formatCurrency(request.budgetMin)} – {formatCurrency(request.budgetMax)}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Proposal CTA */}
              {!isRequestOwner && request.status === "open" && (
                <button
                  type="button"
                  onClick={() => document.getElementById("proposal-form")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90"
                >
                  Submit a Proposal
                </button>
              )}

              {/* Tips card */}
              <div className="rounded-2xl bg-[#0c4d47] p-5 text-emerald-50 shadow-sm">
                <h3 className="font-secondary text-sm font-semibold text-white">Tips for proposals</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-emerald-50/90">
                  <li>Compare what's included: flights, hotels, transfers.</li>
                  <li>Check reviews and destination experience.</li>
                  <li>Ask questions in chat before accepting.</li>
                  <li>Confirm cancellation and payment terms.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
