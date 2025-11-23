import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalCard from "@/components/marketplace/ProposalCard";
import { Loader2 } from "lucide-react";
import { CancellationPolicySelector } from "@/components/CancellationPolicySelector";
import { Checkbox } from "@/components/ui/checkbox";

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
  // NEW FIELDS for enriched proposals
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
  // Admin-only fields
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

  const [newProposal, setNewProposal] = useState({
    priceFrom: "",
    priceTo: "",
    timelineLabel: "",
    message: "", // kept for backward-compatibility
    included: "",
    notIncluded: "",
    itineraryOverview: "",
    fitReason: "",
    // NEW: Legal/commercial fields
    cancellationPolicyId: "" as string | "",
    customCancellationTerms: "",
    depositPercentage: "",
    depositDueDays: "",
    // NEW: Policy acknowledgements
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
      // Fetch trip request (without invalid join)
      const { data: tripData, error: tripError } = await supabase
        .from("trip_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (tripError) throw tripError;

      if (!tripData) {
        setError("Trip request not found.");
        return;
      }

      // Fetch profile separately if user_id exists
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

      // Check if current user is the request owner
      const isRequestOwner = user?.id === tripData.user_id;

      // Fetch proposals based on ownership
      if (isRequestOwner) {
        // Owner sees full proposal details
        const { data: proposalsData, error: proposalsError } = await supabase
          .from("trip_proposals")
          .select(`
            *,
            profiles!proposer_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("trip_request_id", id)
          .order("created_at", { ascending: false });

        if (proposalsError) throw proposalsError;

    const mappedProposals: Proposal[] = (proposalsData || []).map((proposal: any) => {
      const proposer = proposal.profiles || {};
      const nights = proposal.nights || 7;
      return {
        id: proposal.id,
        authorType: proposal.proposer_role === "agent" ? "agent" : "creator",
        authorName: proposer.full_name || "Unknown",
        handle: `@${proposer.full_name?.toLowerCase().replace(/\s+/g, "") || "unknown"}`,
        avatarInitials: proposer.full_name?.substring(0, 2).toUpperCase() || "??",
        rating: 0, // TODO: calculate from reviews
        reviewsCount: 0, // TODO: calculate from reviews
        priceFrom: proposal.price_from || 0,
        priceTo: proposal.price_from || 0,
        currency: proposal.currency || "USD",
        timelineLabel: `${nights} nights`,
        highlights: [], // Deprecated - using inclusions/exclusions instead
        createdAt: proposal.created_at,
        status: proposal.status as ProposalStatus,
        message: proposal.message || "", // Itinerary overview
        agentId: proposal.proposer_id,
        validUntil: proposal.valid_until || null,
        // NEW: Preserve enriched fields
        inclusions: proposal.inclusions,
        exclusions: proposal.exclusions,
        headline: proposal.headline, // "Why I'm a great fit"
        nights: proposal.nights,
        proposer: {
          id: proposer.id,
          full_name: proposer.full_name,
          avatar_url: proposer.avatar_url,
        },
        proposer_role: proposal.proposer_role,
        // NEW: Preserve admin-only fields
        admin_margin_amount: proposal.admin_margin_amount,
        admin_margin_percent: proposal.admin_margin_percent,
        admin_cost_basis: proposal.admin_cost_basis,
        admin_complexity_score: proposal.admin_complexity_score,
        admin_supplier_notes: proposal.admin_supplier_notes,
      };
    });

        setProposals(mappedProposals);
      } else {
        // Non-owners only see proposal count
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
      // Create booking from proposal using the booking service
      const { createBookingFromProposal } = await import("@/services/bookingService");
      
      // Find the proposal to get trip_id
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        throw new Error("Proposal not found");
      }

      await createBookingFromProposal({
        tripId: id,
        proposalId: proposalId,
      });

      toast.success("Proposal accepted! Booking created successfully.");
      
      // Redirect to bookings page
      setTimeout(() => {
        navigate("/bookings");
      }, 1000);
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

    // Check agent terms acceptance before allowing proposal submission
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
      // Determine user role (agent or creator)
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      const proposerRole = profile?.account_type === "agent" ? "agent" : "creator";

      // Create proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from("trip_proposals")
        .insert({
          trip_request_id: id,
          proposer_id: user.id,
          proposer_role: proposerRole,
          price_from: parseFloat(newProposal.priceFrom),
          currency: "USD",
          nights: parseInt(newProposal.timelineLabel) || 7,
          status: "sent",
          // New, structured fields mapped to existing columns
          inclusions: newProposal.included || null,
          exclusions: newProposal.notIncluded || null,
          // Use itinerary as main body, fitReason as the headline
          message: newProposal.itineraryOverview,
          headline:
            newProposal.fitReason ||
            `${proposerRole === "agent" ? "Agent" : "Creator"} proposal`,
          // NEW: Legal/commercial fields
          cancellation_policy_id: newProposal.cancellationPolicyId || null,
          custom_cancellation_terms: newProposal.customCancellationTerms || null,
          deposit_percentage: newProposal.depositPercentage
            ? parseFloat(newProposal.depositPercentage)
            : null,
          deposit_due_days: newProposal.depositDueDays
            ? parseInt(newProposal.depositDueDays)
            : null,
          acknowledged_goldsainte_policies: true,
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Trigger admin insights computation (fire-and-forget, non-blocking)
      if (proposalData?.id) {
        supabase.functions
          .invoke("compute-proposal-insights", {
            body: { proposalId: proposalData.id },
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("❌ Failed to compute admin insights:", error);
            } else {
              console.log("✅ Admin insights computed:", data);
            }
          })
          .catch((err) => {
            console.error("❌ Admin insights computation error:", err);
          });
      }

      toast.success("Proposal submitted successfully!");
      setNewProposal({
        priceFrom: "",
        priceTo: "",
        timelineLabel: "",
        message: "",
        included: "",
        notIncluded: "",
        itineraryOverview: "",
        fitReason: "",
        cancellationPolicyId: "",
        customCancellationTerms: "",
        depositPercentage: "",
        depositDueDays: "",
        ackGoldsaintePolicies: false,
        ackAgentCancellation: false,
      });
      fetchData(); // Refresh proposals
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl bg-card px-5 py-4 text-sm text-destructive shadow-sm ring-1 ring-border">
          {error || "Trip request not found."}
        </div>
      </div>
    );
  }

  const isRequestOwner = user?.id === request.userId;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back to marketplace
            </button>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {request.tripTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Trip request · <span className="capitalize">{request.travelStyle}</span> · {request.tripType}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs">
            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 font-medium",
                request.status === "open"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : request.status === "in_progress"
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-muted text-muted-foreground ring-1 ring-border",
              ].join(" ")}
            >
              {request.status === "open" && "Open to proposals"}
              {request.status === "in_progress" && "In progress"}
              {request.status === "closed" && "Closed"}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Posted on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* LEFT: Proposals list + submit form */}
          <div className="w-full md:w-2/3">
            {/* Proposal submission form - only show if not request owner and request is open */}
            {!isRequestOwner && request.status === "open" && (
              <div className="mb-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Submit a proposal
                </h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Share your pricing range and a clear outline of how you'll design and manage this trip.
                </p>

                <form onSubmit={handleSubmitProposal} className="mt-3 space-y-3 text-xs">
                  {/* Price + timeline */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Price (USD)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 6500"
                        value={newProposal.priceFrom}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            priceFrom: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Total estimated trip price per request details.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Timeline (days)</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 3–5"
                        value={newProposal.timelineLabel}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            timelineLabel: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Approximate trip length based on your proposed itinerary.
                      </p>
                    </div>
                  </div>

                  {/* Included / not included */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Included in this proposal</label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Hotels, private transfers, daily breakfast, guided experiences, concierge support…"
                        value={newProposal.included}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            included: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Be specific about flights, hotels, ground transport, activities, and support.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-foreground">
                        Not included / optional add-ons
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="International flights, travel insurance, most dinners, spa treatments, optional excursions…"
                        value={newProposal.notIncluded}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            notIncluded: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Help the traveler understand what&apos;s extra or upgradable.
                      </p>
                    </div>
                  </div>

                  {/* Itinerary overview */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Sample itinerary overview</label>
                    <textarea
                      rows={4}
                      required
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={`Day 1: Arrival & check-in · Day 2: Private yacht & coastal exploring · Day 3: Wine country · Day 4: Departure…`}
                      value={newProposal.itineraryOverview}
                      onChange={(e) =>
                        setNewProposal((prev) => ({
                          ...prev,
                          itineraryOverview: e.target.value,
                        }))
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      A concise day-by-day outline so the traveler can instantly feel the trip.
                    </p>
                  </div>

                  {/* Why you're a great fit */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Why you&apos;re a great fit</label>
                    <textarea
                      rows={3}
                      required
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Your expertise with this destination, hotel partners, on-the-ground connections, and similar trips you've designed."
                      value={newProposal.fitReason}
                      onChange={(e) =>
                        setNewProposal((prev) => ({
                          ...prev,
                          fitReason: e.target.value,
                        }))
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Think of this as your editorial intro – why this trip is perfectly matched to you.
                    </p>
                  </div>

                  {/* Cancellation policy selection */}
                  <div className="space-y-2">
                    <CancellationPolicySelector
                      selectedPolicyId={newProposal.cancellationPolicyId || undefined}
                      onPolicySelect={(policyId) =>
                        setNewProposal((prev) => ({ ...prev, cancellationPolicyId: policyId }))
                      }
                    />
                    <div className="space-y-1">
                      <label className="font-medium text-foreground text-xs">
                        Additional cancellation / refund terms (optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Add any agency-specific nuances, blackout dates, or non-refundable elements."
                        value={newProposal.customCancellationTerms}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            customCancellationTerms: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Deposit / payment structure */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground text-xs">
                        Required deposit (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 30"
                        value={newProposal.depositPercentage}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            depositPercentage: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        If left blank, we'll treat this as due in full at confirmation.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-foreground text-xs">
                        Deposit due (days after acceptance)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 3"
                        value={newProposal.depositDueDays}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            depositDueDays: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        When the traveler must pay the deposit to keep this proposal valid.
                      </p>
                    </div>
                  </div>

                  {/* Legal acknowledgements */}
                  <div className="space-y-2 rounded-xl border border-border bg-muted/40 px-3 py-3">
                    <p className="text-[11px] font-semibold text-foreground">
                      Legal & policy acknowledgements
                    </p>

                    <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Checkbox
                        checked={newProposal.ackGoldsaintePolicies}
                        onCheckedChange={(checked) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            ackGoldsaintePolicies: Boolean(checked),
                          }))
                        }
                      />
                      <span>
                        I understand that Goldsainte operates as a marketplace and that I, as the
                        travel professional, am solely responsible for trip delivery, supplier
                        contracts, and compliance. I've reviewed the{" "}
                        <Link
                          to="/cancellation-refund-policy"
                          className="underline underline-offset-2"
                          target="_blank"
                        >
                          Cancellation & Refund Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/terms"
                          className="underline underline-offset-2"
                          target="_blank"
                        >
                          Terms & Conditions
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Checkbox
                        checked={newProposal.ackAgentCancellation}
                        onCheckedChange={(checked) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            ackAgentCancellation: Boolean(checked),
                          }))
                        }
                      />
                      <span>
                        I confirm that the cancellation, refund, and deposit terms in this
                        proposal are accurate, clearly communicated, and will be honored exactly
                        as stated if the traveler accepts.
                      </span>
                    </label>
                  </div>

                  {/* Inline legal helper */}
                  <p className="text-[10px] leading-relaxed text-muted-foreground mt-1">
                    Goldsainte is a curated marketplace. By submitting this proposal, you acknowledge that 
                    you are the travel professional responsible for trip delivery, supplier coordination, 
                    cancellations, refunds, and all service obligations. Cancellation and refund rules 
                    published in this proposal must be honored exactly as stated if the traveler accepts.
                  </p>

                  {/* Submit */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={submittingProposal}
                      className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
                <h2 className="text-sm font-semibold text-foreground">
                  Proposals ({isRequestOwner ? proposals.length : proposalsCount})
                </h2>
                {isRequestOwner && (
                  <p className="text-[11px] text-muted-foreground">
                    Compare pricing, approach, and reviews before accepting one proposal.
                  </p>
                )}
              </div>

              {isRequestOwner ? (
                // Owner sees full proposals
                proposals.length === 0 ? (
                  <div className="rounded-2xl bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
                    No proposals yet. As agents and creators respond, they'll appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="space-y-3">
                        <ProposalCard proposal={proposal} showAdminInsights={isAdmin} />
                        
                        {/* Actions */}
                        {isRequestOwner && (
                          <div className="flex items-center justify-between gap-2 px-2">
                            <button
                              type="button"
                              onClick={() => {
                                toast.info("Chat feature coming soon");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-muted-foreground hover:text-foreground"
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
                                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                              ].join(" ")}
                            >
                              {proposal.status === "accepted" ? "Accepted" : "Accept proposal"}
                            </button>
                          </div>
                        )}

                        {/* Policy notice for travelers */}
                        {isRequestOwner && proposal.status !== "accepted" && proposal.status !== "declined" && (
                          <div className="mx-2 rounded-2xl bg-muted border border-border p-2.5 text-[10px] text-foreground">
                            <p>
                              <span className="font-semibold">
                                By accepting this proposal
                              </span>
                              , your trip and payments stay protected by Goldsainte.
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
                // Non-owners only see count
                <div className="rounded-2xl bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
                  {proposalsCount > 0 
                    ? `${proposalsCount} ${proposalsCount === 1 ? 'proposal' : 'proposals'} submitted so far. Your proposal will only be visible to the trip owner.`
                    : "No proposals yet. Be the first to submit a proposal!"}
                </div>
              )}

              {/* Marketplace disclaimer - shown to all users */}
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                All proposals are created and managed by independent travel professionals. Goldsainte 
                does not operate flights, hotels, transfers, or tours. Always review proposal-specific 
                cancellation, refund, and deposit terms before accepting a trip.
              </p>
            </div>
          </div>

          {/* RIGHT: Trip request summary */}
          <aside className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <h2 className="text-sm font-semibold text-foreground">Trip summary</h2>
                <div className="mt-3 space-y-2 text-xs text-foreground">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-medium">{request.destination}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Departing from</span>
                    <span className="font-medium">{request.departingFrom}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Dates</span>
                    <span className="text-right font-medium">{request.dateRangeLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Travelers</span>
                    <span className="font-medium">
                      {request.travelers} {request.travelers === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Budget range</span>
                    <span className="text-right font-semibold text-foreground">
                      {formatCurrency(request.budgetMin)} – {formatCurrency(request.budgetMax)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3 text-xs">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Trip overview
                  </p>
                  <p className="mt-1 text-foreground">{request.description}</p>

                  {request.specialRequests && (
                    <>
                      <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                        Special requests
                      </p>
                      <p className="mt-1 text-foreground">{request.specialRequests}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-[#0c4d47] p-4 text-xs text-emerald-50 shadow-sm">
                <h3 className="text-sm font-semibold text-white">Tips for choosing a proposal</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-emerald-50/90">
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
