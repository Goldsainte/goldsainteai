// src/pages/proposals/ProposalDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Shield,
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

function formatMoney(
  amount: number | null | undefined,
  currency: string = "USD"
) {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function humanStatus(status: string) {
  switch (status) {
    case "pending":
      return "Awaiting your decision";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "withdrawn":
      return "Withdrawn";
    case "expired":
      return "Expired";
    default:
      return status;
  }
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
          const type = (profile?.account_type || "traveler") as AccountType;
          setAccountType(type);
        }

        setProposal(detail);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  const isTraveler = proposal && currentUserId === proposal.traveler?.id;
  const isPartner =
    !isTraveler && (accountType === "creator" || accountType === "agent");

  async function handleAcceptConfirmed() {
    if (!proposalId || !proposal) return;
    setActionError(null);
    setActionLoading("accept");
    try {
      const result = await acceptProposal(proposalId);
      const bookingId = result?.booking_id;
      if (bookingId) {
        navigate(`/bookings/${bookingId}`);
      } else {
        // fall back: reload proposal
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
  const title =
    proposal?.headline ||
    trip?.title ||
    trip?.destination ||
    "Trip proposal";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={isTraveler ? "/my-trips" : "/tiktok-lab/trips"}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to trips
          </Link>
        </div>

        {loading && (
          <p className="text-[11px] text-[#8D8D8D]">Loading proposal…</p>
        )}
        {error && (
          <p className="text-[11px] text-red-600">{error}</p>
        )}

        {proposal && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                  Trip proposal
                </p>
                <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap gap-2 text-[10px] text-[#4a4a4a]">
                  {trip?.destination && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {trip.destination}
                    </span>
                  )}
                  {trip?.start_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(trip.start_date)}
                      {trip.end_date && ` – ${formatDate(trip.end_date)}`}
                    </span>
                  )}
                  {proposal.nights && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {proposal.nights} night{proposal.nights === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] ${
                    proposal.status === "pending"
                      ? "bg-[#0c4d47] text-[#E5DFC6]"
                      : proposal.status === "accepted"
                      ? "bg-[#E5DFC6] text-[#0c4d47] border border-[#0c4d47]"
                      : "bg-[#f7f3ea] text-[#8D8D8D] border border-[#E5DFC6]"
                  }`}
                >
                  {humanStatus(proposal.status)}
                </span>
                <p className="text-[11px] font-semibold">
                  {formatMoney(proposal.price_from, proposal.currency || "USD")}
                </p>
                {proposal.valid_until && proposal.status === "pending" && (
                  <p className="text-[9px] text-[#8D8D8D]">
                    Valid until {formatDate(proposal.valid_until)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {proposal && (
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Left: details */}
            <div className="space-y-5 text-[11px]">
              {/* Itinerary + message */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Overview
                    </p>
                    <p className="text-[12px] font-semibold">
                      How your {proposal.proposer?.role || "partner"} imagines this trip
                    </p>
                  </div>
                  <Shield className="h-4 w-4 text-[#0c4d47]" />
                </div>

                {proposal.message && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      Personal note
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] whitespace-pre-line">
                      {proposal.message}
                    </p>
                  </div>
                )}

                {proposal.inclusions && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      What&apos;s included
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] whitespace-pre-line">
                      {proposal.inclusions}
                    </p>
                  </div>
                )}

                {proposal.exclusions && (
                  <div>
                    <p className="text-[10px] text-[#8D8D8D] mb-1">
                      What&apos;s not included
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] whitespace-pre-line">
                      {proposal.exclusions}
                    </p>
                  </div>
                )}

                {!proposal.message &&
                  !proposal.inclusions &&
                  !proposal.exclusions && (
                    <p className="text-[10px] text-[#8D8D8D]">
                      This proposal doesn&apos;t have details filled in yet.
                      Please ask your {proposal.proposer?.role || "partner"} in chat to clarify
                      what&apos;s included.
                    </p>
                  )}
              </div>

              {/* Payment schedule */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Payment plan
                    </p>
                    <p className="text-[12px] font-semibold">
                      How payment would work
                    </p>
                  </div>
                </div>

                {proposal.payment_schedule && proposal.payment_schedule.length > 0 ? (
                  <ul className="space-y-1.5">
                    {proposal.payment_schedule.map((item, idx) => (
                      <li
                        key={`${item.label}-${idx}`}
                        className="flex items-center justify-between gap-2 text-[10px]"
                      >
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          {item.due_on && (
                            <p className="text-[#8D8D8D]">
                              Due {formatDate(item.due_on)}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold">
                          {item.amount
                            ? formatMoney(item.amount, proposal.currency || "USD")
                            : "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-[#8D8D8D]">
                    Payment schedule hasn&apos;t been specified. You can confirm
                    deposit and balance structure with your {proposal.proposer?.role || "partner"} before moving ahead.
                  </p>
                )}

                <p className="text-[9px] text-[#8D8D8D] pt-1">
                  All payments are handled through Goldsainte&apos;s secure flow
                  so that your booking and any eligible refunds or payouts stay
                  protected.
                </p>
              </div>

              <TrustSafetyInline />
            </div>

            {/* Right: people + actions */}
            <div className="space-y-5 text-[11px]">
              {/* Who sent this */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                    Who this is from
                  </p>
                  <p className="text-[12px] font-semibold">
                    Your Goldsainte partner
                  </p>
                </div>

                <div className="space-y-1 text-[10px]">
                  {proposal.proposer && (
                    <p>
                      {proposal.proposer.role === "creator" ? "Creator" : "Travel agent"}:{" "}
                      <span className="font-semibold">
                        {proposal.proposer.display_name}
                      </span>
                    </p>
                  )}
                  {proposal.traveler && (
                    <p className="text-[#8D8D8D]">
                      For traveler:{" "}
                      <span className="font-semibold">
                        {proposal.traveler.display_name}
                      </span>
                    </p>
                  )}
                </div>

                <p className="text-[9px] text-[#8D8D8D]">
                  All communication and key decisions should happen in your
                  Goldsainte trip chat so that we can help if anything doesn&apos;t
                  go to plan.
                </p>
              </div>

              {/* Actions */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                    Next steps
                  </p>
                  <p className="text-[12px] font-semibold">
                    What you can do with this proposal
                  </p>
                </div>

                {actionError && (
                  <p className="text-[10px] text-red-600">{actionError}</p>
                )}

                {isTraveler ? (
                  <>
                    {proposal.status === "pending" && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea]/80 p-3 space-y-1">
                          <p className="text-[11px] font-semibold text-[#0a2225]">Before you confirm</p>
                          <p className="text-[10px] text-[#4a4a4a]">
                            Please make sure you&apos;re comfortable with the itinerary, total price, and cancellation terms. Keep all future
                            changes, payments, and approvals inside Goldsainte so everything stays protected.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSafetyModal(true)}
                            className="text-[10px] font-semibold text-[#0c4d47] underline-offset-4 hover:underline"
                          >
                            Review safety &amp; liability details
                          </button>
                        </div>
                        <p className="text-[10px] text-[#4a4a4a]">
                          If this feels right, you can accept and move into Goldsainte&apos;s protected booking flow. If not, you can
                          decline and wait for other options.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleAcceptConfirmed}
                            disabled={actionLoading === "accept"}
                            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:bg-[#073331] disabled:opacity-60"
                          >
                            {actionLoading === "accept"
                              ? "Accepting…"
                              : "Accept & continue to booking"}
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDecline}
                            disabled={actionLoading === "decline"}
                            className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ea] text-[#0a2225] border border-[#E5DFC6] px-4 py-1.5 text-[10px] font-semibold hover:border-[#BFAD72] disabled:opacity-60"
                          >
                            {actionLoading === "decline"
                              ? "Updating…"
                              : "Decline this proposal"}
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {proposal.status !== "pending" && proposal.status === "accepted" && (
                      <div className="rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea]/80 p-3 space-y-1">
                        <p className="text-[11px] font-semibold text-[#0c4d47]">Your booking is confirmed.</p>
                        <p className="text-[10px] text-[#4a4a4a]">
                          All future changes, questions, and approvals should be handled inside Goldsainte to keep your trip protected.
                        </p>
                      </div>
                    )}

                    {proposal.status !== "pending" && proposal.status !== "accepted" && (
                      <p className="text-[10px] text-[#4a4a4a]">
                        This proposal is{" "}
                        <span className="font-semibold">
                          {humanStatus(proposal.status)}
                        </span>
                        . If your plans have changed significantly, you can post a new trip or review other proposals from your trip
                        view.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-[#4a4a4a]">
                    This is how the traveler will see your proposal. If you need
                    to adjust it, edit from your proposals list once editing
                    is implemented, or send clarifications in the trip chat.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <TrustSafetyModal
        open={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        context="booking"
      />
    </main>
  );
}
