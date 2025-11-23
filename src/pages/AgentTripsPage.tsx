// src/pages/AgentTripsPage.tsx
import { useEffect, useState } from "react";
import { getOpenTrips, Trip } from "@/services/tripService";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getOpenTrips();
        if (!cancelled) {
          setTrips(data);
        }
      } catch (err) {
        console.error("Error loading trips:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-lg font-semibold">Available Trip Requests</h1>
        <p className="text-xs text-muted-foreground">
          Browse open trip requests from travelers and send proposals to win their business.
        </p>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && trips.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No open trip requests at the moment. Check back soon!
          </p>
        )}

        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-3xl border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  to={`/trip/${trip.id}`}
                  className="flex-1"
                >
                  <h2 className="text-sm font-semibold">
                    {trip.title || "Untitled trip"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {trip.destination || "Destination TBD"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Budget: {trip.budget_range || "Not specified"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {trip.travelers_count ? `${trip.travelers_count} travelers` : "Travelers count not specified"}
                  </p>
                  {trip.start_date && trip.end_date && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  )}
                </Link>
                <Button
                  onClick={() => navigate(`/agent/trips/${trip.id}/contract`)}
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  <FileText className="h-4 w-4" />
                  Create Contract
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
