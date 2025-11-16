import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProposalCard } from "@/components/marketplace/ProposalCard";
import { Loader2 } from "lucide-react";

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
  const [request, setRequest] = useState<TripRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProposal, setNewProposal] = useState({
    priceFrom: "",
    priceTo: "",
    timelineLabel: "",
    message: "",
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
      // Fetch trip request
      const { data: jobData, error: jobError } = await supabase
        .from("marketplace_jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (jobError) throw jobError;

      if (!jobData) {
        setError("Trip request not found.");
        return;
      }

      // Parse travel_dates and requirements from JSON
      const travelDates = jobData.travel_dates as any || {};
      const requirements = jobData.requirements as any || {};

      const mappedRequest: TripRequest = {
        id: jobData.id,
        tripTitle: jobData.title,
        status: jobData.status as any,
        destination: jobData.destination,
        departingFrom: requirements.departingFrom || "Not specified",
        dateRangeLabel: travelDates.startDate && travelDates.endDate
          ? `${new Date(travelDates.startDate).toLocaleDateString()} – ${new Date(travelDates.endDate).toLocaleDateString()}${travelDates.flexibleDates ? " (flexible)" : ""}`
          : "Dates TBD",
        travelers: jobData.number_of_travelers || 1,
        tripType: requirements.tripType || "Not specified",
        travelStyle: requirements.travelStyle || "Not specified",
        budgetMin: jobData.budget_min || 0,
        budgetMax: jobData.budget_max || 0,
        description: jobData.description,
        specialRequests: requirements.specialRequests,
        createdAt: jobData.created_at,
        userId: jobData.user_id,
      };

      setRequest(mappedRequest);

      // Fetch proposals (agent_bids)
      const { data: bidsData, error: bidsError } = await supabase
        .from("agent_bids")
        .select(`
          *,
          travel_agents (
            id,
            agency_name,
            rating,
            total_reviews,
            user_id
          )
        `)
        .eq("job_id", id)
        .order("created_at", { ascending: false });

      if (bidsError) throw bidsError;

      const mappedProposals: Proposal[] = (bidsData || []).map((bid: any) => {
        const agent = bid.travel_agents || {};
        return {
          id: bid.id,
          authorType: "agent",
          authorName: agent.agency_name || "Unknown Agent",
          handle: `@${agent.agency_name?.toLowerCase().replace(/\s+/g, "")}`,
          avatarInitials: agent.agency_name?.substring(0, 2).toUpperCase() || "AG",
          rating: agent.rating || 0,
          reviewsCount: agent.total_reviews || 0,
          priceFrom: bid.proposed_price || 0,
          priceTo: bid.proposed_price || 0,
          currency: bid.currency || "USD",
          timelineLabel: bid.delivery_time ? `${bid.delivery_time} days` : "Timeline TBD",
          highlights: bid.proposal_details?.highlights || [],
          createdAt: bid.created_at,
          status: bid.status as ProposalStatus,
          message: bid.message || "",
          agentId: bid.agent_id,
          validUntil: bid.valid_until || null,
        };
      });

      setProposals(mappedProposals);
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

      const booking = await createBookingFromProposal({
        tripId: id,
        proposalId: proposalId,
      });

      toast.success("Proposal accepted! Redirecting to booking...");
      
      // Redirect to booking page
      setTimeout(() => {
        navigate(`/bookings/${booking.id}`);
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

    if (!newProposal.priceFrom || !newProposal.message) {
      toast.error("Please fill in price and proposal message");
      return;
    }

    setSubmittingProposal(true);

    try {
      // Get or create agent profile for current user
      const { data: agentData } = await supabase
        .from("travel_agents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!agentData) {
        toast.error("You must have an agent profile to submit proposals");
        setSubmittingProposal(false);
        return;
      }

      // Create bid
      const { error: bidError } = await supabase
        .from("agent_bids")
        .insert({
          job_id: id,
          agent_id: agentData.id,
          proposed_price: parseFloat(newProposal.priceFrom),
          currency: "USD",
          estimated_completion_days: parseInt(newProposal.timelineLabel) || null,
          status: "pending",
          proposal_details: JSON.stringify({
            message: newProposal.message,
            highlights: [],
            timeline: newProposal.timelineLabel,
          }),
        } as any);

      if (bidError) throw bidError;

      toast.success("Proposal submitted successfully!");
      setNewProposal({
        priceFrom: "",
        priceTo: "",
        timelineLabel: "",
        message: "",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background">
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
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Price (USD)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 6500"
                        value={newProposal.priceFrom}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            priceFrom: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Timeline (days)</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. 3-5"
                        value={newProposal.timelineLabel}
                        onChange={(e) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            timelineLabel: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Proposal message</label>
                    <textarea
                      rows={3}
                      required
                      className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Explain your approach, what's included (flights, hotels, transfers, activities), and why you're a great fit for this trip."
                      value={newProposal.message}
                      onChange={(e) =>
                        setNewProposal((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={submittingProposal}
                      className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
                  Proposals ({proposals.length})
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Compare pricing, approach, and reviews before accepting one proposal.
                </p>
              </div>

              {proposals.length === 0 ? (
                <div className="rounded-2xl bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
                  No proposals yet. As agents and creators respond, they'll appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onAccept={() => handleAcceptProposal(proposal.id)}
                      onOpenChat={() => {
                        toast.info("Chat feature coming soon");
                      }}
                      formattedBudgetRange={`${formatCurrency(proposal.priceFrom, proposal.currency)}${proposal.priceTo !== proposal.priceFrom ? ` – ${formatCurrency(proposal.priceTo, proposal.currency)}` : ""}`}
                      isRequestOwner={isRequestOwner}
                    />
                  ))}
                </div>
              )}
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

              <div className="rounded-2xl bg-emerald-600 p-4 text-xs text-emerald-50 shadow-sm">
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
    </div>
  );
}
