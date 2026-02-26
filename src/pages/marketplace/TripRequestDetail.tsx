import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalCard from "@/components/marketplace/ProposalCard";
import { Loader2, MapPin, Calendar, Users, DollarSign, Send } from "lucide-react";
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
  interests?: string[];
  tripLengthDays?: number | null;
  budgetPerPerson?: boolean;
  mustHaves?: string[];
  dealbreakers?: string[];
};

type TravelerProfile = {
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
      {children}
    </p>
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
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile | null>(null);

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

  function handleSubmitProposal() {
    if (!user) {
      toast.error("Please sign in to submit a proposal");
      navigate("/auth");
      return;
    }
    navigate(`/proposals/new?tripId=${request?.id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#0a2225]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl bg-white px-8 py-6 text-sm text-[#0a2225] shadow-lg text-center">
          <p className="font-secondary text-lg mb-1">Something went wrong</p>
          <p className="text-[#6B7280]">{error || "Trip request not found."}</p>
        </div>
      </div>
    );
  }

  const isRequestOwner = user?.id === request.userId;
  const travelerName = travelerProfile?.full_name || "A Goldsainte Traveler";

  return (
    <main className="min-h-screen bg-white text-[#0a2225]">
      {/* ===================== HERO ===================== */}
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

      {/* ===================== TWO-COLUMN LAYOUT ===================== */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ===== LEFT COLUMN: Brief Only ===== */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Trip Brief Card */}
            <div className="rounded-2xl bg-white p-5 md:p-6 shadow-[0_1px_12px_rgba(0,0,0,0.06)] space-y-5">
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
                <div className="border-t border-[#E5DFC6]/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151] mb-2">Special Requests</p>
                  <p className="text-sm text-[#0a2225] leading-relaxed">{request.specialRequests}</p>
                </div>
              )}

              {/* Vibe Tags */}
              {request.interests && request.interests.length > 0 && (
                <div className="border-t border-[#E5DFC6]/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151] mb-2">Vibe & Experience Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.interests.map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-[#0c4d47]/10 border border-[#0c4d47]/20 px-2.5 py-1 text-[11px] font-medium text-[#0c4d47]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Must-Haves */}
              {request.mustHaves && request.mustHaves.length > 0 && (
                <div className="border-t border-[#E5DFC6]/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 mb-2">Must-Haves</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.mustHaves.map(item => (
                      <span key={item} className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dealbreakers */}
              {request.dealbreakers && request.dealbreakers.length > 0 && (
                <div className="border-t border-[#E5DFC6]/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-600 mb-2">Dealbreakers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.dealbreakers.map(item => (
                      <span key={item} className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600">
                        ✗ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[#E5DFC6]/60 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A7151] mb-3">Visual Brief</p>
                <TripStoryboardViewer tripId={request.id} variant="gallery" />
              </div>
            </div>

            {/* Proposals section — only for trip owner */}
            {isRequestOwner && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-secondary text-lg text-[#0a2225]">Proposals</h2>
                  <span className="inline-flex items-center rounded-full bg-[#FDFBF5] border border-[#E5DFC6] px-2.5 py-0.5 text-xs font-semibold text-[#7A7151]">
                    {proposals.length}
                  </span>
                </div>

                {proposals.length === 0 ? (
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

                        {proposal.status !== "accepted" && proposal.status !== "declined" && (
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
                )}
              </div>
            )}

          </div>

          {/* ===== RIGHT SIDEBAR (380px, sticky) ===== */}
          <aside className="w-full lg:w-[380px] lg:flex-shrink-0">
            <div className="sticky top-20 space-y-5">

              {/* Posted By */}
              {travelerProfile && (
                <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
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
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
                <GoldLabel>Trip Details</GoldLabel>
                <div className="mt-3 space-y-3">
                  {[
                    { label: "Destination", value: request.destination },
                    { label: "Departing from", value: request.departingFrom },
                    { label: "Dates", value: request.dateRangeLabel },
                    ...(request.tripLengthDays ? [{ label: "Trip length", value: `${request.tripLengthDays} days` }] : []),
                    { label: "Travelers", value: `${request.travelers} ${request.travelers === 1 ? "person" : "people"}` },
                    { label: "Trip type", value: request.tripType },
                    { label: "Accommodation", value: request.travelStyle },
                  ].filter(row => row.value && row.value !== "Not specified" && row.value !== "Dates TBD").map((row, i) => (
                    <div key={i} className="flex justify-between gap-2 border-b border-[#E5DFC6]/40 pb-2.5 last:border-0 last:pb-0">
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
                      {request.budgetPerPerson && <span className="text-xs font-normal text-[#9A9079] ml-1">per person</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Competitive Context + CTA */}
              {!isRequestOwner && request.status === "open" && (
                <div className="rounded-2xl bg-white p-5 shadow-[0_1px_12px_rgba(0,0,0,0.06)] space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c4d47]/10">
                      <Send className="h-4 w-4 text-[#0c4d47]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0a2225]">
                        {proposalsCount === 0
                          ? "Be the first to propose"
                          : `${proposalsCount} proposal${proposalsCount === 1 ? "" : "s"} submitted`}
                      </p>
                      <p className="text-xs text-[#9A9079]">
                        {proposalsCount === 0
                          ? "No one has bid on this trip yet"
                          : "Stand out with a compelling proposal"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitProposal}
                    className="w-full rounded-full bg-[#0c4d47] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90 hover:shadow-lg min-h-[48px]"
                  >
                    Submit Your Proposal
                  </button>
                </div>
              )}

              {/* How it works */}
              <div className="rounded-2xl bg-[#0c4d47] p-5 text-emerald-50 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
                <h3 className="font-secondary text-sm font-semibold text-white">How it works</h3>
                <ol className="mt-3 space-y-2.5 text-xs text-emerald-50/90">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">1</span>
                    <span>Review the traveler's brief and visual inspiration</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">2</span>
                    <span>Submit your proposal with pricing and itinerary</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">3</span>
                    <span>The traveler reviews and compares proposals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">4</span>
                    <span>If accepted, it becomes a confirmed booking</span>
                  </li>
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky mobile CTA bar */}
      {!isRequestOwner && request.status === "open" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#E5DFC6]/60 px-4 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
            {(request.budgetMin > 0 || request.budgetMax > 0) && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#9A9079] font-semibold">Budget</p>
                <p className="font-secondary text-sm font-semibold text-[#0a2225] truncate">
                  {formatCurrency(request.budgetMin)} – {formatCurrency(request.budgetMax)}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmitProposal}
              className="inline-flex items-center rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c4d47]/90 whitespace-nowrap min-h-[44px]"
            >
              Submit Your Proposal
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
