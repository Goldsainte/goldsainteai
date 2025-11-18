// src/pages/traveler/TravelerDashboardPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyTrips } from "@/services/tripService";
import { getMyTravelerBookingsDetailed } from "@/services/bookingService";
import { Sparkles, Plane, Calendar, ArrowRight } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";

export default function TravelerDashboardPage() {
  const { checking, allowed } = useRequireOnboarding();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('returnTo', '/traveler');
        navigate("/auth?returnTo=/traveler", { replace: true });
        return;
      }

      try {
        const [myTrips, myBookings] = await Promise.all([
          getMyTrips(),
          getMyTravelerBookingsDetailed(),
        ]);
        if (!cancelled) {
          setTrips(myTrips);
          setBookings(myBookings);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Could not load traveler dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#0a2225] text-[#E5DFC6] flex items-center justify-center">
        <p className="text-xs">Loading your Goldsainte space…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] text-primary font-semibold">
              <Sparkles className="h-3 w-3" />
              Goldsainte traveler
            </p>
            <h1 className="text-lg md:text-xl font-semibold">
              Your trips, bookings & TikTok journeys
            </h1>
            <p className="text-[11px] text-muted-foreground max-w-md">
              Keep track of the trips you've posted, who you're matched with,
              and what's already booked — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              onClick={() => navigate("/post-trip")}
              className="rounded-full bg-primary text-primary-foreground px-3 py-1 font-semibold hover:bg-primary/90"
            >
              + Post a new trip
            </button>
            <Link
              to="/tiktok-lab"
              className="rounded-full border border-border bg-card px-3 py-1 hover:bg-accent"
            >
              Open Goldsainte Creator Lab
            </Link>
          </div>
        </header>

        {error && (
          <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/40 rounded-2xl px-3 py-2">
            {error}
          </p>
        )}

        {loading && <p className="text-xs">Loading your trips and bookings…</p>}

        {/* Trips section */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-card border border-border p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold">Trip requests</p>
                <p className="text-[10px] text-muted-foreground">
                  Everything you've asked Goldsainte and our TikTok partners to
                  design.
                </p>
              </div>
              <Calendar className="h-4 w-4 text-primary" />
            </div>

            {trips.length === 0 && !loading ? (
              <p className="text-[11px] text-muted-foreground">
                You haven't posted any trips yet.{" "}
                <button
                  onClick={() => navigate("/post-trip")}
                  className="underline"
                >
                  Start with your first brief.
                </button>
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    className="w-full text-left rounded-2xl bg-muted/40 border border-border px-3 py-2 hover:border-primary"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[12px] font-semibold">
                      {trip.title || "Untitled trip"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {trip.destination || "Destination TBD"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[9px] rounded-full bg-card border border-border px-2 py-0.5">
                      Status: <span className="text-primary">{trip.status}</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bookings section */}
          <div className="rounded-3xl bg-card border border-border p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold">Bookings</p>
                <p className="text-[10px] text-muted-foreground">
                  Trips you've actually locked in — with payment, partners, and
                  timelines.
                </p>
              </div>
              <Plane className="h-4 w-4 text-primary" />
            </div>

            {bookings.length === 0 && !loading ? (
              <p className="text-[11px] text-muted-foreground">
                Once you accept a proposal and complete payment, your bookings
                will show up here.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {bookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => navigate(`/booking/${booking.id}`)}
                    className="w-full text-left rounded-2xl bg-muted/40 border border-border px-3 py-2 hover:border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[12px] font-semibold">
                          {booking.trips?.title || "Trip booking"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {booking.trips?.destination || "Destination TBD"}
                        </p>
                      </div>
                      <div className="text-right">
                        {booking.total_amount && (
                          <p className="text-[11px] text-primary font-semibold">
                            {booking.currency || "USD"} {booking.total_amount}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground">
                          {booking.status}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Optional: highlight next steps / CTA */}
        <section className="rounded-3xl bg-accent text-accent-foreground p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="space-y-1 max-w-xl">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              NEXT
            </p>
            <p className="text-sm font-semibold">
              Ready to turn your next TikTok inspo into a real booking?
            </p>
            <p className="text-[11px] text-muted-foreground">
              Use Goldsainte Creator Lab to pair your favorite creators with Goldsainte
              agents — then see everything land back here in your dashboard.
            </p>
          </div>
          <Link
            to="/tiktok-lab"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] hover:bg-accent/50"
          >
            Open Goldsainte Creator Lab
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </main>
  );
}
