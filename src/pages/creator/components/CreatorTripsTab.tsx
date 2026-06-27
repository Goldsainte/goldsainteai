import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Eye, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CreatorTrip = {
  id: string;
  title: string | null;
  slug: string | null;
  destination: string | null;
  cover_image_url: string | null;
  status: string | null;
  price_per_person: number | null;
  created_at: string;
  booking_count: number | null;
  view_count: number | null;
};

const statusStyles: Record<string, string> = {
  draft: "bg-[#E5DFC6] text-[#0a2225]",
  pending_review: "bg-[#C7A962]/20 text-[#7a5e1f] border border-[#C7A962]/40",
  published: "bg-[#0c4d47] text-white",
  archived: "bg-[#6B7280]/20 text-[#6B7280]",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "In review",
  published: "Live",
  archived: "Archived",
};

export function CreatorTripsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<CreatorTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // All statuses — a creator's own trips are visible here the moment they're
      // created (draft / in-review / live), even before admin approval to go live.
      const { data, error } = await supabase
        .from("packaged_trips")
        .select(
          "id, title, slug, destination, cover_image_url, status, price_per_person, created_at, booking_count, view_count",
        )
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) console.error("Error loading creator trips:", error);
      else setTrips((data ?? []) as CreatorTrip[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-secondary text-2xl text-[#0a2225]">My Trip Packages</h2>
          <p className="mt-1 text-sm text-[#6B7280] max-w-md">
            Create and manage curated trips. New trips go to review before they're bookable on the
            marketplace — they appear here straight away.
          </p>
        </div>
        <Button
          onClick={() => navigate("/trip-builder")}
          className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d38] text-white px-6 self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Trip Package
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#C7A962]" />
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
          <p className="text-sm text-[#6B7280]">You haven't created any trips yet.</p>
          <Button
            onClick={() => navigate("/trip-builder")}
            className="mt-4 rounded-full bg-[#0c4d47] hover:bg-[#0a3d38] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Build your first trip
          </Button>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {trips.map((trip) => {
            const status = trip.status || "draft";
            return (
              <article
                key={trip.id}
                className="rounded-2xl border border-[#E5DFC6] bg-white overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#F6F0E4] overflow-hidden">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title ?? "Trip cover"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#8D8D8D]">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-secondary text-lg truncate">{trip.title || "Untitled trip"}</h3>
                      <p className="text-xs text-[#6B7280] truncate">{trip.destination || "Destination TBD"}</p>
                    </div>
                    <Badge
                      className={`${statusStyles[status] ?? statusStyles.draft} rounded-full text-[10px] uppercase tracking-wider px-2.5 py-0.5`}
                    >
                      {statusLabel[status] ?? status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>
                      <strong className="text-[#0a2225]">{trip.booking_count ?? 0}</strong> bookings
                    </span>
                    <span>
                      <strong className="text-[#0a2225]">{trip.view_count ?? 0}</strong> views
                    </span>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/trip-builder?edit=${trip.id}`)}
                      className="rounded-full border-[#E5DFC6] hover:bg-[#FDF9F0] text-[#0a2225] flex-1"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    {status === "published" && (
                      <Link to={`/marketplace/trip/${trip.slug ?? trip.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-full border-[#0c4d47] text-[#0c4d47] hover:bg-[#0c4d47]/5"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Listing
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
