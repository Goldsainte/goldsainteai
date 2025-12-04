// src/pages/CreatorTripsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Calendar, Users, Sparkles } from "lucide-react";

interface TripRequest {
  id: string;
  title: string | null;
  description: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
}

export default function CreatorTripsPage() {
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trip_requests")
          .select("id, title, description, destination, start_date, end_date, travelers_adults, travelers_children, budget_min, budget_max, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        if (!cancelled) {
          setTrips(data || []);
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

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const getTravelerCount = (adults: number | null, children: number | null) => {
    const total = (adults || 0) + (children || 0);
    return total > 0 ? total : null;
  };

  return (
    <main className="min-h-screen bg-[#FDF9F0] text-[#0a2225] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C7A962]" />
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold">
              Collab Opportunities
            </h1>
          </div>
          <p className="text-sm text-[#0a2225]/60 max-w-xl">
            Discover trip requests from travelers looking for TikTok-worthy experiences you can curate.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
          </div>
        )}

        {/* Empty State */}
        {!loading && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#C7A962]/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-[#C7A962]" />
            </div>
            <h3 className="font-secondary text-lg font-medium mb-1">
              No collab opportunities yet
            </h3>
            <p className="text-sm text-[#0a2225]/60 max-w-sm">
              Check back soon—travelers are posting new trip requests every day.
            </p>
          </div>
        )}

        {/* Trip Cards Grid */}
        {!loading && trips.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => {
              const budget = formatBudget(trip.budget_min, trip.budget_max);
              const travelerCount = getTravelerCount(trip.travelers_adults, trip.travelers_children);
              
              return (
                <Link
                  key={trip.id}
                  to={`/marketplace/request/${trip.id}`}
                  className="group block rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#C7A962]/50 transition-all duration-200"
                >
                  {/* Title & Budget */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-secondary text-lg font-semibold text-[#0a2225] group-hover:text-[#0a2225]/80 transition-colors">
                      {trip.title || "Untitled trip"}
                    </h2>
                    {budget && (
                      <span className="shrink-0 rounded-full bg-[#C7A962]/10 px-3 py-1 text-xs font-medium text-[#0a2225]">
                        {budget}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {trip.description && (
                    <p className="text-sm text-[#0a2225]/70 line-clamp-2 mb-4">
                      {trip.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#0a2225]/60 mb-4">
                    {trip.destination && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {trip.destination}
                      </span>
                    )}
                    {trip.start_date && trip.end_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(trip.start_date).toLocaleDateString()} – {new Date(trip.end_date).toLocaleDateString()}
                      </span>
                    )}
                    {travelerCount && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {travelerCount} traveler{travelerCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="text-sm font-medium text-[#C7A962] group-hover:text-[#B89952] transition-colors">
                    View details →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
