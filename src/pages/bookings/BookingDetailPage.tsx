// src/pages/bookings/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingConversation } from "@/components/chat/BookingConversation";
import { TripPoliciesPanel } from "@/components/trips/TripPoliciesPanel";
import { TripCoverImage } from "@/components/marketplace/TripCoverImage";

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

        if (!cancelled) {
          setBooking(bookingRow as BookingRow);
          setTrip(tripRow);
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