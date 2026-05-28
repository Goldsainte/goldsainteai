// src/pages/MyBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock } from "lucide-react";

type TripMeta = {
  id: string;
  title: string | null;
  destination: string | null;
  cover_image_url: string | null;
  duration_days: number | null;
  price_per_person: number | null;
};

type BookingRow = {
  id: string;
  status: string;
  currency: string | null;
  total_price: number | null;
  deposit_amount: number | null;
  created_at: string;
  metadata: any;
  trip: TripMeta | null;
};

const BOOKING_STATUSES = ["confirmed", "payment_pending", "paid_in_full", "completed"];

function formatCurrency(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "payment_pending":
      return "Payment pending";
    case "paid_in_full":
      return "Paid in full";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function bookingReference(id: string) {
  return `GS-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/auth?returnTo=/my-bookings", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("trip_bookings")
        .select(
          "id, status, currency, total_price, deposit_amount, created_at, metadata"
        )
        .eq("traveler_id", user.id)
        .in("status", BOOKING_STATUSES)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("[MyBookings] Failed to load bookings:", error);
        setBookings([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as any[];
      const tripIds = Array.from(
        new Set(
          rows
            .map((r) => r?.metadata?.trip_id)
            .filter((v): v is string => typeof v === "string" && v.length > 0)
        )
      );

      let tripsById = new Map<string, TripMeta>();
      if (tripIds.length > 0) {
        const { data: trips, error: tripsError } = await supabase
          .from("packaged_trips")
          .select("id, title, destination, cover_image_url, duration_days, price_per_person")
          .in("id", tripIds);
        if (tripsError) {
          console.error("[MyBookings] Failed to load trip metadata:", tripsError);
        } else {
          tripsById = new Map((trips ?? []).map((t: any) => [t.id, t as TripMeta]));
        }
      }

      const merged: BookingRow[] = rows.map((r) => ({
        id: r.id,
        status: r.status,
        currency: r.currency,
        total_price: r.total_price,
        deposit_amount: r.deposit_amount,
        created_at: r.created_at,
        metadata: r.metadata,
        trip: tripsById.get(r?.metadata?.trip_id) ?? null,
      }));

      setBookings(merged);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>My Bookings · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8D6B2F]">
              Your journeys
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#0a2225]">
              My Bookings
            </h1>
            <p className="max-w-2xl text-sm text-[#4a4a4a]">
              Trips you've confirmed through Goldsainte, with all the details
              your creators and travel agents are working from.
            </p>
          </header>

          <section className="mt-10">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-40 rounded-3xl bg-white/60 ring-1 ring-[#E5DFC6] animate-pulse"
                  />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-5">
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-[#E5DFC6] bg-white/80 px-6 py-16 text-center">
      <h2 className="font-serif text-2xl text-[#0a2225]">
        Your travel story starts here
      </h2>
      <p className="mt-3 text-sm text-[#4a4a4a]">
        Browse storyboards and request a trip with one of our creators or
        travel agents.
      </p>
      <Link
        to="/marketplace"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0a2225] transition-colors"
      >
        Explore the marketplace
      </Link>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const trip = booking.trip;
  const reference = bookingReference(booking.id);

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="group flex flex-col md:flex-row overflow-hidden rounded-3xl bg-white ring-1 ring-[#E5DFC6] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative md:w-64 aspect-[4/3] md:aspect-auto bg-[#f0ebdd] shrink-0">
        {trip?.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt={trip.title || trip.destination || "Trip cover"}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]">
            Goldsainte
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8D6B2F]">
              {reference}
            </p>
            <h2 className="mt-1 font-serif text-xl text-[#0a2225] line-clamp-2">
              {trip?.title || "Goldsainte trip"}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-[#0c4d47]/10 px-3 py-1 text-[10px] font-medium text-[#0c4d47]">
            {statusLabel(booking.status)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#4a4a4a]">
          {trip?.destination && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#8D6B2F]" />
              {trip.destination}
            </span>
          )}
          {trip?.duration_days ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8D6B2F]" />
              {trip.duration_days} days
            </span>
          ) : null}
          <span className="text-[#8D8D8D]">
            Booked {new Date(booking.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-[#E5DFC6] pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8D8D8D]">
              Deposit
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0a2225]">
              {formatCurrency(booking.deposit_amount, booking.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8D8D8D]">
              Trip total
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0a2225]">
              {formatCurrency(booking.total_price, booking.currency)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
