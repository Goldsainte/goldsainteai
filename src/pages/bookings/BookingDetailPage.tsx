// src/pages/bookings/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingConversation } from "@/components/chat/BookingConversation";
import { TripPoliciesPanel } from "@/components/trips/TripPoliciesPanel";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";
import { createDispute, getBookingDisputes } from "@/services/disputeService";

type DisputeRow = {
  id: string;
  booking_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  status: string;
  traveler_id: string;
  partner_id: string | null;
  partner_role: string | null;
  total_price: number | null;
  deposit_amount: number | null;
  currency: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  stripe_payment_intent_id: string | null;
};

type TripRow = {
  id: string;
  title: string | null;
  destination: string | null;
  cover_image_url: string | null;
  duration_days: number | null;
  price_per_person: number | null;
};

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (amount == null) return "—";
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

function humanBookingStatus(status: string) {
  switch (status) {
    case "payment_pending":
      return "Awaiting payment";
    case "confirmed":
      return "Confirmed";
    case "paid_in_full":
      return "Paid in full";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispute / claim state
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookingId) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: bookingRow, error: bookingErr } = await supabase
          .from("trip_bookings")
          .select(
            "id, status, traveler_id, partner_id, partner_role, total_price, deposit_amount, currency, created_at, metadata, stripe_payment_intent_id"
          )
          .eq("id", bookingId)
          .single();

        if (bookingErr) throw bookingErr;
        if (!bookingRow) throw new Error("Booking not found.");

        if (bookingRow.traveler_id !== user.id) {
          navigate("/my-bookings");
          return;
        }

        const tripId = (bookingRow.metadata as any)?.trip_id;
        let tripRow: TripRow | null = null;
        if (tripId) {
          const { data: t } = await supabase
            .from("packaged_trips")
            .select(
              "id, title, destination, cover_image_url, duration_days, price_per_person"
            )
            .eq("id", tripId)
            .maybeSingle();
          tripRow = t as TripRow | null;
        }

        // Existing claims for this booking (so we don't offer a duplicate).
        let disputeRows: DisputeRow[] = [];
        try {
          disputeRows = (await getBookingDisputes(bookingId)) as DisputeRow[];
        } catch {
          // Non-fatal: if claims can't be loaded, the page still renders and
          // the traveler can still file one.
          disputeRows = [];
        }

        if (!cancelled) {
          setBooking(bookingRow as BookingRow);
          setTrip(tripRow);
          setDisputes(disputeRows);
        }
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
  }, [bookingId, navigate]);

  async function handleFileClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimReason.trim() || !bookingId) return;
    setClaimSubmitting(true);
    setClaimError(null);
    try {
      await createDispute({ bookingId, reason: claimReason.trim() });
      // Refresh the claim list and reflect the new booking status locally.
      const refreshed = (await getBookingDisputes(bookingId)) as DisputeRow[];
      setDisputes(refreshed);
      setBooking((prev) => (prev ? { ...prev, status: "disputed" } : prev));
      setClaimReason("");
      setShowClaimForm(false);
    } catch (err: any) {
      setClaimError(err.message || "Could not file your claim. Please try again.");
    } finally {
      setClaimSubmitting(false);
    }
  }

  const hasOpenClaim = disputes.some(
    (d) => d.status === "open" || d.status === "under_review"
  );

  const currency = booking?.currency || "USD";
  const total = booking?.total_price ?? 0;
  const deposit = booking?.deposit_amount ?? 0;
  const balance = Math.max(0, total - deposit);
  const reference = booking ? `GS-${booking.id.slice(0, 8).toUpperCase()}` : "";
  const title = trip?.title || trip?.destination || "Goldsainte trip";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* Back link */}
      <section className="mx-auto max-w-5xl px-6 pt-8 pb-2">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/50 hover:text-[#0a2225] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
      </section>

      {loading && (
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-6">
          <div className="aspect-[21/9] max-h-[420px] w-full rounded-sm bg-white/40 animate-pulse" />
          <div className="mt-8 space-y-3">
            <div className="h-3 w-24 bg-white/50 animate-pulse" />
            <div className="h-10 w-2/3 bg-white/50 animate-pulse" />
          </div>
        </section>
      )}

      {error && !loading && (
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-6">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      )}

      {booking && !loading && (
        <article className="mx-auto max-w-5xl px-6 pb-24 pt-4">
          {/* Hero image — first, as the anchor */}
          {trip?.cover_image_url && (
            <figure className="overflow-hidden rounded-sm">
              <TripCoverImage
                src={trip.cover_image_url}
                alt={title}
                className="w-full aspect-[21/9] max-h-[420px] object-cover"
              />
            </figure>
          )}

          {/* Title block */}
          <header className={`space-y-3 ${trip?.cover_image_url ? "mt-10" : "mt-6"}`}>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
              Your journey
            </p>
            <h1 className="font-secondary text-3xl md:text-4xl leading-[1.05] text-[#0a2225] max-w-3xl">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#0a2225]/60 pt-1">
              {trip?.destination && (
                <span className="font-secondary italic">{trip.destination}</span>
              )}
              {trip?.duration_days ? (
                <>
                  <span className="text-[#0a2225]/30">·</span>
                  <span>
                    {trip.duration_days} {trip.duration_days === 1 ? "day" : "days"}
                  </span>
                </>
              ) : null}
              <span className="text-[#0a2225]/30">·</span>
              <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                {humanBookingStatus(booking.status)}
              </span>
            </div>
          </header>

          {/* Data grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 border-t border-[#E5DFC6] mt-12 pt-8">
            <Stat label="Reference" value={reference} mono />
            <Stat label="Trip total" value={formatMoney(total, currency)} />
            <Stat label="Deposit paid" value={formatMoney(deposit, currency)} />
            <Stat label="Balance remaining" value={formatMoney(balance, currency)} />
          </section>

          {/* Messages section */}
          <section className="mt-20">
            <header className="flex items-baseline justify-between mb-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                Messages
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/40">
                Direct line to your travel professional
              </p>
            </header>
            <BookingConversation bookingId={booking.id} />
          </section>

          {/* Policies section */}
          <section className="mt-20">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F] mb-6">
              Policies
            </p>
            <TripPoliciesPanel
              bookingStatus={booking.status}
              proposalPolicies={null}
            />
          </section>

          {/* Claims / disputes section — matches the cancellation policy's
              promise: "if something goes wrong, file a claim from your booking
              page." */}
          <section className="mt-20 border-t border-[#E5DFC6] pt-8">
            <header className="flex items-baseline justify-between mb-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                Something wrong?
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/40">
                File a claim about this booking
              </p>
            </header>

            {/* Existing claims */}
            {disputes.length > 0 && (
              <ul className="mb-6 space-y-3">
                {disputes.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-[#E5DFC6] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#8D6B2F]">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Claim ·{" "}
                        {new Date(d.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#F6F0E4] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#0a2225]">
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#0a2225]/80 leading-relaxed break-words">
                      {d.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* File-a-claim control */}
            {hasOpenClaim ? (
              <p className="text-sm text-[#0a2225]/60 leading-relaxed">
                You have an open claim on this booking. Our team is reviewing it
                and will reach out through your booking messages. You can add
                details any time in the Messages section above.
              </p>
            ) : showClaimForm ? (
              <form onSubmit={handleFileClaim} className="space-y-4">
                <label
                  htmlFor="claim-reason"
                  className="block text-sm text-[#0a2225]/70"
                >
                  Tell us what went wrong. Be as specific as you can — dates,
                  amounts, and what you expected all help us resolve it faster.
                </label>
                <textarea
                  id="claim-reason"
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe the issue with this booking…"
                  className="w-full rounded-2xl border border-[#E5DFC6] bg-white p-4 text-sm text-[#0a2225] leading-relaxed outline-none focus:border-[#C7A962] focus:ring-1 focus:ring-[#C7A962]"
                />
                {claimError && (
                  <p className="text-sm text-red-700">{claimError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={claimSubmitting || !claimReason.trim()}
                    className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claimSubmitting ? "Filing…" : "Submit claim"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimForm(false);
                      setClaimReason("");
                      setClaimError(null);
                    }}
                    className="text-sm text-[#0a2225]/50 hover:text-[#0a2225] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#0a2225]/60 leading-relaxed max-w-xl">
                  If something went wrong with this trip, you can file a claim
                  and our team will step in. Most issues are resolved fastest by
                  messaging your travel professional first.
                </p>
                <button
                  type="button"
                  onClick={() => setShowClaimForm(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#0c4d47] transition-colors hover:bg-[#0c4d47] hover:text-[#E5DFC6] shrink-0"
                >
                  <ShieldAlert className="h-4 w-4" />
                  File a claim
                </button>
              </div>
            )}
          </section>
        </article>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] uppercase tracking-[0.24em] text-[#0a2225]/50">
        {label}
      </p>
      <p
        className={
          mono
            ? "font-mono text-[13px] tracking-wide text-[#0a2225]"
            : "font-secondary text-xl text-[#0a2225]"
        }
      >
        {value}
      </p>
    </div>
  );
}
