// src/pages/MyBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, HandCoins, Users } from "lucide-react";

type BookingRow = {
  id: string;
  status: string;
  total_price: number;
  currency: string;
  created_at: string;
  trip_requests: {
    id: string;
    title: string | null;
    destination: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
  } | null;
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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
          `
          id,
          status,
          total_price,
          currency,
          created_at,
          trip_requests:trip_request_id (
            id,
            title,
            destination,
            travelers_adults,
            travelers_children
          )
        `
        )
        .eq("traveler_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading bookings:", error);
        setBookings([]);
      } else {
        setBookings((data ?? []) as BookingRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>My Booked Trips · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <header className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight text-[#E5DFC6] md:text-xl">
              My Booked Trips
            </h1>
            <p className="text-xs text-[#E5DFC6]/80 md:text-sm max-w-2xl">
              These are trips you've confirmed through Goldsainte with creators and travel agents.
            </p>
          </header>

          <section className="mt-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6]/40 bg-[#0a2225]/50 px-4 py-8 text-center text-xs text-[#E5DFC6]/85">
                You don't have any booked trips yet.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <BookingRowCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function BookingRowCard({ booking }: { booking: BookingRow }) {
  const trip = booking.trip_requests;
  const travelers =
    (trip?.travelers_adults || 0) + (trip?.travelers_children || 0);

  const amount =
    booking.total_price != null
      ? `$${(booking.total_price / 100).toFixed(2)} ${booking.currency}`
      : "—";

  return (
    <Link
      to={`/trip-request/${trip?.id}`}
      className="flex flex-col gap-2 rounded-3xl bg-[#f6f3ea]/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-[#8D8D8D]">
            Booked {new Date(booking.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-1 text-sm font-semibold">
            {trip?.title || trip?.destination || "Goldsainte trip"}
          </h2>
        </div>
        <span className="rounded-full bg-[#0c4d47]/8 px-3 py-1 text-[10px] font-medium text-[#0c4d47]">
          {booking.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4a4a4a]">
        <div className="flex items-center gap-3">
          {trip?.destination && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#8D8D8D]" />
              {trip.destination}
            </span>
          )}
          {travelers > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-[#8D8D8D]" />
              {travelers} travelers
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1">
          <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
          {amount}
        </span>
      </div>
    </Link>
  );
}
