// src/pages/proposals/ProposalDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getProposalDetail,
  acceptProposal,
  declineProposal,
  type ProposalDetail,
} from "@/services/proposalsService";
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";
import { TrustSafetyModal } from "@/components/trust/TrustSafetyModal";

type AccountType = "traveler" | "creator" | "agent" | "admin" | null;

function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function humanStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Awaiting Review",
    sent: "Awaiting Review",
    traveler_review: "Under Review",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    expired: "Expired",
  };
  return map[status] || status;
}

function statusColor(status: string) {
  if (status === "accepted") return "bg-[#0c4d47] text-white";
  if (status === "declined" || status === "withdrawn" || status === "expired") return "bg-muted text-muted-foreground";
  return "bg-[#C7A962]/15 text-[#0a2225] border border-[#C7A962]/40";
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!proposalId) return;
      try {
        const [{ data: authData }, detail] = await Promise.all([
          supabase.auth.getUser(),
          getProposalDetail(proposalId),
        ]);
        if (cancelled) return;
        const user = authData.user;
        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("id", user.id)
            .maybeSingle();
          setAccountType((profile?.account_type || "traveler") as AccountType);
        }
        setProposal(detail);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [proposalId]);

  const isTraveler = proposal && currentUserId === proposal.traveler?.id;
  const isPending = proposal?.status === "pending" || proposal?.status === "sent" || proposal?.status === "traveler_review";

  async function handleAccept() {
    if (!proposalId || !proposal) return;
    setActionError(null);
    setActionLoading("accept");
    try {
      const result = await acceptProposal(proposalId);
      const bookingId = result?.booking_id;
      if (bookingId) {
        navigate(`/bookings/${bookingId}`);
      } else {
        const refreshed = await getProposalDetail(proposalId);
        setProposal(refreshed);
      }
    } catch (err: any) {
      setActionError(err.message || "We couldn't accept this proposal.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline() {
    if (!proposalId || !proposal) return;
    setActionError(null);
    setActionLoading("decline");
    try {
      await declineProposal(proposalId);
      const refreshed = await getProposalDetail(proposalId);
      setProposal(refreshed);
    } catch (err: any) {
      setActionError(err.message || "We couldn't update this proposal.");
    } finally {
      setActionLoading(null);
    }
  }

  const trip = proposal?.trip_request;
  const title = proposal?.headline || trip?.title || trip?.destination || "Trip Proposal";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading proposal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-[#0c4d47] underline">Go back</button>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <main className="min-h-screen bg-white text-foreground">
      {/* Hero header */}
      <section className="bg-[#FDF9F0] border-b border-[#E5DFC6]/60">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <Link
            to={isTraveler ? "/my-trips" : "/marketplace/trip-requests"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to trips
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962] font-medium">
                Trip Proposal
              </p>
              <h1 className="font-secondary text-2xl md:text-[28px] leading-tight text-[#0a2225]">
                {title}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {trip?.destination && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination}
                  </span>
                )}
                {trip?.start_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(trip.start_date)}
                    {trip.end_date && ` – ${formatDate(trip.end_date)}`}
                  </span>
                )}
                {proposal.nights && (
                  <span>{proposal.nights} night{proposal.nights === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${statusColor(proposal.status)}`}>
                {humanStatus(proposal.status)}
              </span>
              <p className="font-secondary text-3xl md:text-4xl text-[#0a2225] font-semibold">
                {formatMoney(proposal.price_from, proposal.currency || "USD")}
              </p>
              {proposal.valid_until && isPending && (
                <p className="text-xs text-muted-foreground">
                  Valid until {formatDate(proposal.valid_until)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: Main content */}
          <div className="space-y-8">
            {/* Pitch / Message */}
            {proposal.message && (
              <div className="bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium mb-2">The Pitch</p>
                <p className="text-[15px] leading-relaxed text-[#0a2225] whitespace-pre-line">
                  {proposal.message}
                </p>
              </div>
            )}

            {/* Inclusions */}
            {proposal.inclusions && (
              <div className="bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium mb-3">What's Included</p>
                <p className="text-[15px] leading-relaxed text-[#0a2225] whitespace-pre-line">
                  {proposal.inclusions}
                </p>
              </div>
            )}

            {/* Exclusions */}
            {proposal.exclusions && (
              <div className="bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-medium mb-3">What's Not Included</p>
                <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                  {proposal.exclusions}
                </p>
              </div>
            )}

            {/* No content fallback */}
            {!proposal.message && !proposal.inclusions && !proposal.exclusions && (
              <div className="bg-[#FDF9F0] rounded-2xl p-6 md:p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  This proposal doesn't have detailed notes yet. Ask your {proposal.proposer?.role || "partner"} for more information via chat.
                </p>
              </div>
            )}

            {/* Payment Schedule */}
            <div className="bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium mb-4">Payment Plan</p>
              {proposal.payment_schedule && proposal.payment_schedule.length > 0 ? (
                <div className="space-y-3">
                  {proposal.payment_schedule.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="flex items-center justify-between py-3 border-b border-[#E5DFC6]/40 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0a2225]">{item.label}</p>
                        {item.due_on && <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(item.due_on)}</p>}
                      </div>
                      <p className="text-sm font-semibold text-[#0a2225]">
                        {item.amount ? formatMoney(item.amount, proposal.currency || "USD") : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Payment schedule hasn't been specified yet. You can confirm the deposit and balance structure with your {proposal.proposer?.role || "partner"} before proceeding.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-[#E5DFC6]/40">
                All payments are handled through Goldsainte's secure flow so your booking and any eligible refunds stay protected.
              </p>
            </div>

            <TrustSafetyInline />
          </div>

          {/* Right: Sticky sidebar */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Proposer info */}
              <div className="bg-[#FDF9F0] rounded-2xl p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium mb-3">Your Goldsainte Partner</p>
                {proposal.proposer && (
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[#0a2225]">
                      {proposal.proposer.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {proposal.proposer.role === "creator" ? "TikTok Creator" : "Travel Agent"}
                    </p>
                  </div>
                )}
                {proposal.traveler && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Prepared for <span className="font-medium">{proposal.traveler.display_name}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#C7A962] font-medium">Next Steps</p>

                {actionError && <p className="text-sm text-destructive">{actionError}</p>}

                {isTraveler ? (
                  <>
                    {isPending && (
                      <div className="space-y-4">
                        <div className="bg-[#FDF9F0] rounded-xl p-4 space-y-2">
                          <p className="text-sm font-semibold text-[#0a2225]">Before you confirm</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Make sure you're comfortable with the itinerary, total price, and cancellation terms. Keep all changes and payments inside Goldsainte for protection.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSafetyModal(true)}
                            className="text-xs font-semibold text-[#0c4d47] hover:underline underline-offset-4"
                          >
                            Review safety & liability details →
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleAccept}
                          disabled={actionLoading === "accept"}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0c4d47] text-white px-6 py-3.5 text-sm font-semibold hover:bg-[#073331] disabled:opacity-60 transition-colors"
                        >
                          {actionLoading === "accept" ? "Accepting…" : "Accept & Continue to Booking"}
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleDecline}
                          disabled={actionLoading === "decline"}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0a2225] border border-[#E5DFC6] px-6 py-3.5 text-sm font-semibold hover:border-[#C7A962] disabled:opacity-60 transition-colors"
                        >
                          {actionLoading === "decline" ? "Updating…" : "Decline This Proposal"}
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {proposal.status === "accepted" && (
                      <div className="bg-[#0c4d47]/5 rounded-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-[#0c4d47]">Your booking is confirmed</p>
                        <p className="text-sm text-muted-foreground">
                          All future changes, questions, and approvals should be handled inside Goldsainte to keep your trip protected.
                        </p>
                      </div>
                    )}

                    {!isPending && proposal.status !== "accepted" && (
                      <p className="text-sm text-muted-foreground">
                        This proposal is <span className="font-semibold">{humanStatus(proposal.status)}</span>.
                        You can post a new trip or review other proposals from your trip view.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This is how the traveler will see your proposal. You can send clarifications via the trip chat.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustSafetyModal
        open={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        context="booking"
      />
    </main>
  );
}
