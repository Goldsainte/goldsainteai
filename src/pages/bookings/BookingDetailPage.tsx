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

  // Specialist (partner) profile for the sidebar card
  const [partnerProfile, setPartnerProfile] = useState<{
    display_name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null>(null);

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
          disputeRows = (await getBookingDisputes(bookingId!)) as DisputeRow[];
        } catch {
          disputeRows = [];
        }

        // Specialist profile (best-effort; platform bookings may have none)
        let partnerRow: any = null;
        if (bookingRow.partner_id) {
          const { data: p } = await supabase
            .from("profiles")
            .select("display_name, full_name, avatar_url")
            .eq("id", bookingRow.partner_id)
            .maybeSingle();
          partnerRow = p ?? null;
        }

        if (!cancelled) {
          setBooking(bookingRow as BookingRow);
          setTrip(tripRow);
          setDisputes(disputeRows);
          setPartnerProfile(partnerRow);
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
  const title =
    trip?.title ||
    (booking?.metadata as any)?.trip_title ||
    trip?.destination ||
    "Goldsainte trip";
  const specialistName =
    partnerProfile?.display_name ||
    partnerProfile?.full_name ||
    "Goldsainte Concierge";
  const specialistInitials =
    specialistName
      .split(/\s+/)
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GS";
  const paidPct =
    total > 0 ? Math.min(100, Math.round((deposit / total) * 100)) : 0;
  const progressPct = booking?.status === "paid_in_full" ? 100 : paidPct;



  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-2">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/50 transition-colors hover:text-[#0a2225]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to My Bookings
        </Link>
      </section>

      {loading ? (
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-6">
          <div className="h-[300px] w-full animate-pulse rounded-2xl bg-white/40" />
          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="h-64 animate-pulse rounded-2xl bg-white/50" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/50" />
          </div>
        </section>
      ) : error ? (
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-6">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      ) : (
        booking && (
          <article className="mx-auto max-w-6xl px-6 pb-24 pt-4">
            {/* ── Hero: full-bleed image with serif title overlaid ── */}
            <div className="relative h-[280px] overflow-hidden rounded-2xl md:h-[340px]">
              {trip?.cover_image_url ? (
                <TripCoverImage
                  src={trip.cover_image_url}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c4d47] to-[#0a2225]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061418]/85 via-[#061418]/20 to-[#061418]/30" />
              <div className="absolute inset-x-0 bottom-0 px-7 pb-14 md:px-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962]/95">
                  Your journey · {reference}
                </p>
                <h1 className="mt-2 max-w-3xl font-secondary text-3xl leading-[1.05] text-[#fdfaf2] md:text-4xl">
                  {title}
                </h1>
                <p className="mt-2.5 text-[13px] text-[#fdfaf2]/80">
                  {trip?.destination && (
                    <span className="font-secondary italic">
                      {trip.destination}
                    </span>
                  )}
                  {trip?.destination && " · "}
                  {trip?.duration_days
                    ? `${trip.duration_days} ${
                        trip.duration_days === 1 ? "day" : "days"
                      } · `
                    : ""}
                  <span className="inline-flex items-center rounded-full bg-[#0c4d47]/95 px-2.5 py-0.5 align-[2px] text-[9px] uppercase tracking-[0.14em] text-[#E5DFC6]">
                    {humanBookingStatus(booking.status)}
                  </span>
                </p>
              </div>
            </div>

            {/* ── Content overlapping the hero ── */}
            <div className="relative -mt-8 grid gap-6 px-0 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:px-3">
              {/* LEFT column */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#E5DFC6] bg-white px-7 py-6">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                    What happens next
                  </p>
                  <div className="mt-5 space-y-4">
                    <TimelineItem n="i.">
                      Your specialist confirms trip details within 24 hours.
                    </TimelineItem>
                    <TimelineItem n="ii.">
                      {balance > 0
                        ? `Your ${formatMoney(balance, currency)} balance is due before departure.`
                        : "Your trip is paid in full — nothing further is due."}
                    </TimelineItem>
                    <TimelineItem n="iii.">
                      Funds stay in escrow, released to your specialist on
                      agreed milestones.
                    </TimelineItem>
                  </div>
                </div>

                <div
                  id="booking-messages"
                  className="rounded-2xl border border-[#E5DFC6] bg-white px-6 py-6 md:px-7"
                >
                  <header className="mb-5 flex items-baseline justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                      Messages
                    </p>
                    <p className="text-right text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/40">
                      Your direct line to your specialist
                    </p>
                  </header>
                  <BookingConversation
                    bookingId={booking.id}
                    travelerId={booking.traveler_id}
                    partnerId={booking.partner_id}
                  />
                </div>
              </div>

              {/* RIGHT column */}
              <div className="space-y-5 md:sticky md:top-6 md:self-start">
                <div className="rounded-2xl border border-[#E5DFC6] bg-white px-6 py-6">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                    Payment
                  </p>
                  <p className="mt-3 font-secondary text-[26px] text-[#0a2225]">
                    {formatMoney(deposit, currency)}{" "}
                    <span className="text-[14px] text-[#0a2225]/45">
                      of {formatMoney(total, currency)} paid
                    </span>
                  </p>
                  <div className="mt-3.5 h-[5px] overflow-hidden rounded-full bg-[#EFE8D6]">
                    <span
                      className="block h-full rounded-full bg-[#C7A962] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#0a2225]/45">
                    {progressPct}% paid · held in escrow
                  </p>
                  <div className="mt-4 border-t border-[#E5DFC6] pt-4">
                    <p className="flex items-center justify-between text-[12.5px] text-[#0a2225]/60">
                      <span>Balance remaining</span>
                      <span className="font-secondary text-[15px] text-[#0a2225]">
                        {formatMoney(balance, currency)}
                      </span>
                    </p>
                    <p className="mt-2 flex items-center justify-between text-[12.5px] text-[#0a2225]/60">
                      <span>Due</span>
                      <span className="text-[#0a2225]">Before departure</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0c4d47] px-6 py-5">
                  <div className="flex items-center gap-3">
                    {partnerProfile?.avatar_url ? (
                      <img
                        src={partnerProfile.avatar_url}
                        alt={specialistName}
                        className="h-11 w-11 rounded-full border border-[#C7A962]/50 object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C7A962]/50 bg-[#C7A962]/25 font-secondary text-[15px] text-[#E5DFC6]">
                        {specialistInitials}
                      </span>
                    )}
                    <span>
                      <span className="block text-[9px] uppercase tracking-[0.22em] text-[#C7A962]/90">
                        Your specialist
                      </span>
                      <span className="mt-0.5 block font-secondary text-[16px] text-[#fdfaf2]">
                        {specialistName}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("booking-messages")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="mt-4 block w-full rounded-full border border-[#C7A962]/55 py-2.5 text-center text-[10px] uppercase tracking-[0.2em] text-[#E5DFC6] transition-colors hover:bg-[#C7A962]/15"
                  >
                    Message your specialist
                  </button>
                </div>
              </div>
            </div>

            {/* ── Policies ── */}
            <section className="mt-14 md:px-3">
              <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                Policies
              </p>
              <TripPoliciesPanel
                bookingStatus={booking.status}
                proposalPolicies={null}
              />
            </section>

            {/* ── Claims / disputes ── */}
            <section className="mt-14 border-t border-[#E5DFC6] pt-8 md:px-3">
              <header className="mb-6 flex items-baseline justify-between">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">
                  Something wrong?
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/40">
                  File a claim about this booking
                </p>
              </header>

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
                      <p className="mt-2 break-words text-sm leading-relaxed text-[#0a2225]/80">
                        {d.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {hasOpenClaim ? (
                <p className="text-sm leading-relaxed text-[#0a2225]/60">
                  You have an open claim on this booking. Our team is reviewing
                  it and will reach out through your booking messages. You can
                  add details any time in the Messages section above.
                </p>
              ) : showClaimForm ? (
                <form onSubmit={handleFileClaim} className="space-y-4">
                  <label
                    htmlFor="claim-reason"
                    className="block text-sm text-[#0a2225]/70"
                  >
                    Tell us what went wrong. Be as specific as you can — dates,
                    amounts, and what you expected all help us resolve it
                    faster.
                  </label>
                  <textarea
                    id="claim-reason"
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe the issue with this booking…"
                    className="w-full rounded-2xl border border-[#E5DFC6] bg-white p-4 text-sm leading-relaxed text-[#0a2225] outline-none focus:border-[#C7A962] focus:ring-1 focus:ring-[#C7A962]"
                  />
                  {claimError && (
                    <p className="text-sm text-red-700">{claimError}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={claimSubmitting || !claimReason.trim()}
                      className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="text-sm text-[#0a2225]/50 transition-colors hover:text-[#0a2225]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-relaxed text-[#0a2225]/60">
                    If something went wrong with this trip, you can file a claim
                    and our team will step in. Most issues are resolved fastest
                    by messaging your travel professional first.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(true)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#0c4d47] transition-colors hover:bg-[#0c4d47] hover:text-[#E5DFC6]"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    File a claim
                  </button>
                </div>
              )}
            </section>
          </article>
        )
      )}
    </main>
  );
}

function TimelineItem({
  n,
  children,
}: {
  n: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-6 shrink-0 font-secondary text-[16px] italic text-[#8a7a3f]">
        {n}
      </span>
      <p className="text-[13.5px] leading-relaxed text-[#0a2225]/75">
        {children}
      </p>
    </div>
  );
}
