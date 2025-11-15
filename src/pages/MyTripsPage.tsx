// src/pages/MyTripsPage.tsx
import { useEffect, useState } from "react";
import { getMyTrips, Trip } from "@/services/tripService";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?redirect=/my-trips", { replace: true });
        return;
      }

      try {
        const data = await getMyTrips();
        if (!cancelled) setTrips(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">My Trip Requests</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/post-trip")}
            className="rounded-full"
          >
            + Post a new trip
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {error || "Could not load trips."}
          </p>
        )}

        {!loading && trips.length === 0 && (
          <p className="text-xs text-muted-foreground">
            You haven't posted any trips yet. Start by{" "}
            <button
              className="underline hover:text-foreground"
              onClick={() => navigate("/post-trip")}
            >
              posting your first trip
            </button>
            .
          </p>
        )}

        <div className="space-y-3">
          {trips.map((trip) => (
            <Link
              to={`/trip/${trip.id}`}
              key={trip.id}
              className="block rounded-3xl border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Posted {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                  <h2 className="text-sm font-semibold">
                    {trip.title || "Untitled trip"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {trip.destination || "Destination TBD"}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-medium">
                  {trip.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
