// src/pages/bookings/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { getBookingDetail, type BookingDetail } from "@/services/bookingsService";
import { BookingConversation } from "@/components/chat/BookingConversation";
import { TrustSafetyInline } from "@/components/trust/TrustSafetyInline";
import { TripPoliciesPanel } from "@/components/trips/TripPoliciesPanel";

const CONFIRMED_STATUSES = new Set([
  "proposal_accepted",
  "pending_payment",
  "deposit_paid",
  "paid_in_full",
  "completed",
  "confirmed",
]);

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (!amount) return "—";
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function humanBookingStatus(status: string) {
  switch (status) {
    case "proposal_accepted":
      return "Proposal accepted";
    case "pending_payment":
      return "Awaiting payment";
    case "deposit_paid":
      return "Deposit paid";
    case "paid_in_full":
      return "Paid in full";
    case "completed":
      return "Trip completed";
    case "cancelled_refunded":
      return "Cancelled / refunded";
    case "disputed":
      return "In review";
    default:
      return status;
  }
}

function humanPayoutStatus(status: string) {
  switch (status) {
    case "not_eligible":
      return "Not yet eligible";
    case "pending":
      return "Pending payout";
    case "partial":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "on_hold":
      return "On hold";
    default:
      return status;
  }
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookingId) return;
      try {
        const b = await getBookingDetail(bookingId);
        if (!cancelled) setBooking(b);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load booking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const title =
    booking?.trip?.title ||
    booking?.trip?.destination ||
    "Goldsainte trip booking";

  const currency = booking?.currency || "USD";

  // Build simple timeline from available timestamps
  const timeline = booking
    ? [
        {
          key: "created",
          label: "Proposal accepted",
          date: formatDate(booking.created_at),
          active: true,
        },
        {
          key: "deposit",
          label: "Deposit paid",
          date: formatDate(booking.deposit_paid_at),
          active: !!booking.deposit_paid_at,
        },
        {
          key: "paid_full",
          label: "Paid in full / protected in escrow",
          date: formatDate(booking.paid_in_full_at),
          active: !!booking.paid_in_full_at,
        },
        {
          key: "completed",
          label: "Trip completed",
          date: formatDate(booking.completed_at),
          active: !!booking.completed_at,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/tiktok-lab"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Goldsainte Creator Lab
          </Link>
        </div>

        {loading && <p className="text-[11px] text-[#8D8D8D]">Loading…</p>}
        {error && (
          <p className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        {booking && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                  Booking
                </p>
                <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap gap-3 text-[10px] text-[#4a4a4a]">
                  {booking.trip?.destination && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.trip.destination}
                    </span>
                  )}
                  {booking.trip?.starts_on && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(booking.trip.starts_on)}
                      {booking.trip.ends_on &&
                        ` – ${formatDate(booking.trip.ends_on)}`}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Traveler:{" "}
                    {booking.traveler?.display_name || "Goldsainte guest"}
                  </span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1 text-[10px]">
                  {humanBookingStatus(booking.status)}
                </span>
                <p className="text-[11px] text-[#4a4a4a]">
                  Total trip value:{" "}
                  <span className="font-semibold">
                    {formatMoney(booking.total_amount, currency)}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {booking && (
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20 space-y-5">
          {booking.status && CONFIRMED_STATUSES.has(booking.status) && (
            <div className="rounded-3xl border border-[#E5DFC6] bg-white/95 p-4 text-[11px] text-[#4a4a4a]">
              <p className="text-[12px] font-semibold text-[#0c4d47]">Your booking is confirmed.</p>
              <p className="mt-1">
                All future changes, questions, and approvals should stay inside Goldsainte so we can step in if anything needs review.
              </p>
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Left: timeline + chat */}
            <div className="space-y-5">
              {/* Timeline */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Trip timeline
                    </p>
                    <p className="text-[12px] font-semibold">
                      How this booking is progressing
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 pt-1">
                  {timeline.map((step, index) => (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] ${
                            step.active
                              ? "bg-[#0c4d47] text-[#E5DFC6]"
                              : "bg-[#f7f3ea] text-[#8D8D8D] border border-[#E5DFC6]"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="flex-1 w-px bg-[#E5DFC6] min-h-[20px]" />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold">
                          {step.label}
                        </p>
                        <p className="text-[10px] text-[#8D8D8D]">
                          {step.date || "Not reached yet"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Chat */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0c4d47]">
                      <MessageSquare className="h-3 w-3 text-[#E5DFC6]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                        Trip chat
                      </p>
                      <p className="text-[12px] font-semibold">
                        Keep everything in one place
                      </p>
                    </div>
                  </div>
                </div>

                <TrustSafetyInline />

                <div className="mt-2">
                  <BookingConversation bookingId={booking.id} />
                </div>
              </div>
            </div>

            {/* Right: money + parties + safety */}
            <div className="space-y-5">
              {/* Money */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                      Money & protection
                    </p>
                    <p className="text-[12px] font-semibold">Earnings overview</p>
                  </div>
                  <Wallet className="h-4 w-4 text-[#0c4d47]" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#4a4a4a]">Total trip value</p>
                    <p className="text-[11px] font-semibold">
                      {formatMoney(booking.total_amount, currency)}
                    </p>
                  </div>
                  {booking.creator_earnings !== null && (
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#4a4a4a]">
                        Creator&apos;s share
                      </p>
                      <p className="text-[11px] font-semibold">
                        {formatMoney(booking.creator_earnings, currency)}
                      </p>
                    </div>
                  )}
                  {booking.agent_earnings !== null && (
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#4a4a4a]">
                        Travel agent&apos;s share
                      </p>
                      <p className="text-[11px] font-semibold">
                        {formatMoney(booking.agent_earnings, currency)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-[#4a4a4a]">
                    Payout status:{" "}
                    <span className="font-semibold">
                      {humanPayoutStatus(booking.payout_status)}
                    </span>
                  </p>
                  {booking.payout_status === "pending" &&
                    booking.payout_expected_at && (
                      <p className="text-[9px] text-[#8D8D8D]">
                        Expected payout around{" "}
                        {formatDate(booking.payout_expected_at) || "—"}
                      </p>
                    )}
                  {booking.payout_status === "paid" &&
                    booking.payout_paid_at && (
                      <p className="text-[9px] text-[#8D8D8D]">
                        Paid on{" "}
                        {formatDate(booking.payout_paid_at) || "—"}
                      </p>
                    )}
                </div>

                <p className="text-[9px] text-[#8D8D8D] pt-1">
                  Goldsainte holds traveler funds for a short protected window
                  before releasing payouts to partners. This helps protect
                  everyone if something doesn&apos;t go to plan.
                </p>
              </div>

              {/* People */}
              <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                    Who&apos;s on this trip
                  </p>
                  <p className="text-[12px] font-semibold">
                    Traveler & partners
                  </p>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <p className="text-[#8D8D8D]">Traveler</p>
                    <p className="font-semibold">
                      {booking.traveler?.display_name || "Goldsainte guest"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8D8D8D]">Creator</p>
                    <p className="font-semibold">
                      {booking.creator?.display_name || "Not applicable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8D8D8D]">Travel agent</p>
                    <p className="font-semibold">
                      {booking.agent?.display_name || "Not assigned yet"}
                    </p>
                  </div>
                </div>

                <p className="text-[9px] text-[#8D8D8D]">
                  All communication and key decisions should happen here in the
                  booking chat so that Goldsainte can protect travelers and
                  partners if we ever need to review something.
                </p>
              </div>

              {/* Policies - NEW */}
              <TripPoliciesPanel
                bookingStatus={booking.status}
                proposalPolicies={booking.proposal_policies ? {
                  cancellationPolicyName: booking.proposal_policies.cancellation_policy_name,
                  customCancellationTerms: booking.proposal_policies.custom_cancellation_terms,
                  depositPercentage: booking.proposal_policies.deposit_percentage,
                  depositDueDays: booking.proposal_policies.deposit_due_days,
                } : null}
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
