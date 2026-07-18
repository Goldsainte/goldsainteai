// src/pages/MyBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
 
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
 
const BOOKING_STATUSES = ["confirmed", "payment_pending", "paid_in_full", "completed", "cancelled"];
 
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
 
  const upcoming = bookings.filter(
    (b) => !["completed", "cancelled"].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ["completed", "cancelled"].includes(b.status)
  );

  return (
    <>
      <Helmet>
        <title>My Bookings · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-20">
          {/* Editorial header */}
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.3em] text-[#8D6B2F]">
                Your journeys
              </p>
              <h1 className="mt-3 font-secondary text-4xl leading-[1.02] text-[#0a2225] md:text-5xl">
                Where you're
                <br />
                headed next
              </h1>
            </div>
            <p className="max-w-xs text-[14.5px] leading-relaxed text-[#0a2225]/55 md:text-right">
              Payments, contracts, and your specialist — every detail, held in
              one place.
            </p>
          </header>

          {loading ? (
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 rounded-2xl bg-white/50 ring-1 ring-[#E5DFC6] animate-pulse"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="mt-14">
              <EmptyState />
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <SectionRule left="Upcoming" right={past.length > 0 ? "" : "Past journeys"} />
              {upcoming.length === 0 ? (
                <p className="mt-6 text-[15px] italic text-[#0a2225]/50">
                  No upcoming journeys yet — your next one starts in the
                  marketplace.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <>
                  <div className="mt-14">
                    <SectionRule left="Past journeys" right="" />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {past.map((b) => (
                      <BookingCard key={b.id} booking={b} muted />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function SectionRule({ left, right }: { left: string; right: string }) {
  return (
    <div className="mt-12 flex items-center gap-4">
      <span className="text-[12px] uppercase tracking-[0.24em] text-[#0a2225]">
        {left}
      </span>
      <span className="h-px flex-1 bg-[#E5DFC6]" />
      {right ? (
        <span className="text-[12px] uppercase tracking-[0.24em] text-[#0a2225]/35">
          {right}
        </span>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white px-6 py-20 text-center">
      <h2 className="font-secondary text-3xl text-[#0a2225]">
        Your first journey awaits
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#0a2225]/60">
        Explore trips curated by our creators and travel agents. When you book,
        it'll live here — with every detail and a direct line to your
        specialist.
      </p>
      <Link
        to="/marketplace"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-7 py-3 text-[12.5px] font-medium uppercase tracking-[0.18em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
      >
        Explore the marketplace
      </Link>
    </div>
  );
}

function BookingCard({
  booking,
  muted,
}: {
  booking: BookingRow;
  muted?: boolean;
}) {
  const trip = booking.trip;
  const reference = bookingReference(booking.id);
  const title =
    trip?.title || (booking.metadata as any)?.trip_title || "Goldsainte Trip";
  // Hire bookings have no packaged_trips row (cover_image_url null), so fall
  // back to the destination image library — same source the detail page uses.
  // This is why the card was empty but the detail page had a photo.
  const cardDestination =
    trip?.destination || (booking.metadata as any)?.destination || (booking.metadata as any)?.trip_title || null;
  const cardImage = trip?.cover_image_url || getTripRequestImageUrl(cardDestination);
  const total = (booking.total_price ?? 0) / 100; // column stores cents
  const deposit = (booking.deposit_amount ?? 0) / 100;
  const balance = Math.max(0, total - deposit);
  const balanceLine =
    booking.status === "paid_in_full" || (total > 0 && balance === 0)
      ? "Paid in full"
      : booking.status === "cancelled"
      ? "Cancelled"
      : booking.status === "completed"
      ? "Completed"
      : `${formatCurrency(balance, booking.currency)} balance due`;

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)] ${
        muted ? "opacity-80 hover:opacity-100" : ""
      }`}
    >
      {/* Photo IS the card */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Placeholder sits BEHIND the image so if the image ever 404s and
            hides itself, the branded fallback shows through — never an empty box. */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
          <span className="font-secondary text-xl italic text-[#C7A962]/80">
            Goldsainte
          </span>
        </div>
        <img
          src={cardImage}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {/* Status pill on the photo */}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6]">
          {statusLabel(booking.status)}
        </span>

        {/* Bottom scrim with serif title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061418]/85 to-transparent px-5 pb-4 pt-12">
          {trip?.destination && (
            <p className="text-[12px] uppercase tracking-[0.24em] text-[#C7A962]/95">
              {trip.destination}
            </p>
          )}
          <p className="mt-1.5 font-secondary text-[22px] leading-[1.1] text-[#fdfaf2] line-clamp-2">
            {title}
          </p>
          <p className="mt-1.5 text-[14px] text-[#fdfaf2]/80">
            {trip?.duration_days
              ? `${trip.duration_days} ${trip.duration_days === 1 ? "day" : "days"} · `
              : ""}
            Booked{" "}
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Slim footer strip */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-[14px] text-[#0a2225]/55">
          <span className="font-mono text-[13px] tracking-wide">
            {reference}
          </span>
          {" · "}
          {balanceLine}
        </span>
        <span className="inline-flex items-center gap-1 text-[12.5px] uppercase tracking-[0.18em] text-[#0c4d47]">
          View journey
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
