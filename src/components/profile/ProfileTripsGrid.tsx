import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Trip {
  id: string;
  title: string;
  slug: string;
  destination: string | null;
  cover_image_url: string | null;
  price_per_person: number | null;
  currency: string | null;
  duration_days: number | null;
}

interface ProfileTripsGridProps {
  creatorId: string;
  creatorType?: "creator" | "agent";
  title?: string;
}

export function ProfileTripsGrid({
  creatorId,
  creatorType,
  title = "Marketplace Trips",
}: ProfileTripsGridProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      let query = supabase
        .from("packaged_trips")
        .select(
          "id, title, slug, destination, cover_image_url, price_per_person, currency, duration_days"
        )
        .eq("creator_id", creatorId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (creatorType) {
        query = query.eq("creator_type", creatorType);
      }

      const { data } = await query;
      setTrips((data as Trip[]) || []);
      setLoading(false);
    }

    loadTrips();
  }, [creatorId, creatorType]);

  if (loading) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          {title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[#E5DFC6] bg-white overflow-hidden"
            >
              <div className="aspect-[16/10] bg-[#E5DFC6]" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-[#E5DFC6]" />
                <div className="h-3 w-1/2 rounded bg-[#E5DFC6]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151] mb-4">
          {title}
        </h2>
        <div className="rounded-2xl border border-[#E5DFC6] bg-gradient-to-br from-white to-[#F5F0E0]/50 p-8 text-center">
          <p className="font-secondary text-lg text-[#0a2225]">
            Trips coming soon
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {creatorType === "agent"
              ? "This specialist is building their trip collection."
              : "This creator is building their trip collection."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          {title}
        </h2>
        <span className="text-xs text-[#8C8470]">
          {trips.length} {trips.length === 1 ? "trip" : "trips"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            to={`/trips/${trip.slug}`}
            className="group overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white transition-all hover:border-[#C7B892] hover:shadow-lg"
          >
            <div className="aspect-[16/10] overflow-hidden bg-[#F5F0E0]">
              {trip.cover_image_url ? (
                <img
                  src={trip.cover_image_url}
                  alt={trip.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"/>
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#F5F0E0] to-[#E5DFC6]" />
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-[#0a2225] group-hover:text-[#0c4d47] transition-colors line-clamp-1">
                {trip.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                {trip.destination && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {trip.destination}
                  </span>
                )}
                {trip.duration_days && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {trip.duration_days} days
                  </span>
                )}
              </div>
              {trip.price_per_person != null && (
                <p className="text-sm font-semibold text-[#0a2225]">
                  From{" "}
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: trip.currency || "USD",
                    minimumFractionDigits: 0,
                  }).format(trip.price_per_person)}
                  <span className="font-normal text-[#6B7280]"> / person</span>
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
