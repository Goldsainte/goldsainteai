// src/pages/bookings/BookingDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
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
      return "Trip completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
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
  const title = trip?.title || trip?.destination || "Goldsainte trip booking";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-6 md:pt-16">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-xs tracking-wide text-[#0a2225]/60 hover:text-[#0a2225] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Bookings
        </Link>
      </section>

      {loading && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <p className="text-sm text-[#0a2225]/50">Loading…</p>
        </section>
      )}

      {error && !loading && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      )}

      {booking && !loading && (
        <section className="mx-auto max-w-4xl px-6 pb-20 space-y-12">
          {/* Headline */}
          <header className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8D6B2F]">
              Your booking
            </p>
            <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-tight text-[#0a2225]">
              {title}
            </h1>
            {trip?.destination && (
              <p className="font-secondary italic text-base md:text-lg text-[#0a2225]/60">
                {trip.destination}
                {trip.duration_days ? ` · ${trip.duration_days} days` : ""}
              </p>
            )}
          </header>

          <div className="w-full h-px bg-[#0a2225]" />

          {/* Cover image */}
          {trip?.cover_image_url && (
            <div className="overflow-hidden">
              <TripCoverImage
                src={trip.cover_image_url}
                alt={title}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          )}

          {/* Metadata block */}
          <div className="space-y-0">
            <Row label="Booking reference" value={reference} mono />
            <Row
              label="Status"
              value={
                <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1 text-[11px]">
                  {humanBookingStatus(booking.status)}
                </span>
              }
            />
            <Row label="Trip total" value={formatMoney(total, currency)} />
            <Row label="Deposit paid" value={formatMoney(deposit, currency)} />
            <Row
              label="Balance remaining"
              value={formatMoney(balance, currency)}
            />
          </div>

          {/* Chat */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#8D6B2F]" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8D6B2F]">
                Trip messages
              </p>
            </div>
            <div className="border-t border-[#E5DFC6] pt-4">
              <BookingConversation bookingId={booking.id} />
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8D6B2F]">
              Policies
            </p>
            <TripPoliciesPanel
              bookingStatus={booking.status}
              proposalPolicies={null}
            />
          </div>
        </section>
      )}
    </main>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[#E5DFC6]">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/60">
        {label}
      </span>
      <span
        className={`text-sm text-[#0a2225] ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
