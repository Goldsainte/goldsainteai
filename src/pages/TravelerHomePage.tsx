import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, MapPinned, Sparkles } from "lucide-react";

interface CollectionRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  collection_stats?: {
    views_count: number;
    saves_count: number;
    trip_inquiries_count: number;
  } | null;
}

interface TripRow {
  id: string;
  destination: string | null;
  status: string | null;
  date_range: string | null;
  created_at: string;
  assigned_creator_name?: string | null;
  assigned_agent_name?: string | null;
}

export default function TravelerHomePage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [activeTrips, setActiveTrips] = useState<TripRow[]>([]);
  const [savedCollections, setSavedCollections] = useState<CollectionRow[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [{ data: recs }, { data: trips }, { data: saves }] = await Promise.all([
        supabase
          .from("brand_collections")
          .select("id, title, description, cover_image_url, tags, collection_stats(views_count, saves_count, trip_inquiries_count)")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("trip_requests")
          .select(
            "id, destination, status, date_range, created_at, assignments:trip_assignments(assignee_profile_id, role, profiles(full_name))"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("moodboard_collection_saves")
          .select("id, brand_collections(id, title, description, cover_image_url, tags)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setCollections((recs as CollectionRow[]) ?? []);

      const mappedTrips: TripRow[] = (trips ?? []).map((row: any) => {
        const creator = row.assignments?.find((a: any) => a.role === "creator");
        const agent = row.assignments?.find((a: any) => a.role === "agent");
        return {
          id: row.id,
          destination: row.destination,
          status: row.status,
          date_range: row.date_range,
          created_at: row.created_at,
          assigned_creator_name: creator?.profiles?.full_name,
          assigned_agent_name: agent?.profiles?.full_name,
        };
      });
      setActiveTrips(mappedTrips);

      const mappedSaves = (saves ?? [])
        .map((s: any) => s.brand_collections as CollectionRow)
        .filter(Boolean);
      setSavedCollections(mappedSaves);
    };

    void load();
  }, [user]);

  const heroCTA = user ? "/madison" : "/auth?returnTo=/madison";

  const continuePlanning = useMemo(() => {
    return activeTrips.filter(
      (t) => t.status && !["completed", "cancelled"].includes(t.status)
    );
  }, [activeTrips]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <section className="space-y-4 rounded-3xl bg-gradient-to-br from-[#0a2225] via-[#0a2225]/90 to-[#0a2225]/70 p-6 text-[#E5DFC6] shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#E5DFC6]/70">Goldsainte traveler</p>
        <h1 className="font-secondary text-3xl md:text-4xl leading-tight">Where are we taking you next?</h1>
        <p className="max-w-2xl text-sm md:text-base text-[#E5DFC6]/80">
          Start with a collection that feels like you, then let Madison and our creators turn it into a real trip.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to={heroCTA}>Ask Madison</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="rounded-full border border-[#E5DFC6]/50 bg-transparent text-[#E5DFC6] hover:bg-[#E5DFC6]/10">
            <Link to="/trips">Trip inbox</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">For you</p>
            <h2 className="font-secondary text-xl text-[#0a2225]">Collections we’d start with</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-xs">
            <Link to="/collections">Browse all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {collections.length === 0 && (
            <div className="rounded-3xl border border-[#E5DFC6] bg-white p-4 text-sm text-[#4a4a4a]">
              We’re curating your recommendations. Check back soon.
            </div>
          )}
          {collections.map((collection) => (
            <Card key={collection.id} className="overflow-hidden rounded-3xl border-[#E5DFC6] bg-white">
              {collection.cover_image_url && (
                <div className="h-40 w-full overflow-hidden bg-[#F5F0E0]">
                  <img
                    src={collection.cover_image_url}
                    alt={collection.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg text-[#0a2225]">{collection.title}</CardTitle>
                <p className="text-sm text-[#4a4a4a] line-clamp-2">
                  {collection.description ?? "Modern luxury, crafted for you."}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(collection.tags ?? []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#F5F0E0] px-3 py-1 text-[10px] uppercase tracking-wide text-[#7A7151]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A7151]">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {collection.collection_stats?.trip_inquiries_count ?? 0} inquiries
                  </span>
                  <Link
                    to={`/collection/${collection.id}`}
                    className="text-[#0a2225] underline-offset-4 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Continue planning</p>
            <h2 className="font-secondary text-xl text-[#0a2225]">Trips in motion</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-xs">
            <Link to="/trips">View all</Link>
          </Button>
        </div>
        {continuePlanning.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-[#E5DFC6] bg-white">
            <CardContent className="flex flex-col gap-3 py-6">
              <p className="text-sm text-[#4a4a4a]">No active trips yet. Start with a collection you love.</p>
              <div className="flex gap-2">
                <Button asChild className="rounded-full text-xs">
                  <Link to="/collections">Explore collections</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full text-xs">
                  <Link to={heroCTA}>Ask Madison</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {continuePlanning.map((trip) => (
              <Card key={trip.id} className="rounded-3xl border-[#E5DFC6] bg-white">
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-center justify-between text-[11px] text-[#7A7151]">
                    <span className="uppercase tracking-wide">{trip.status ?? "new"}</span>
                    <span>{new Date(trip.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0a2225]">
                    {trip.destination || "Destination TBD"}
                  </h3>
                  <p className="text-sm text-[#4a4a4a]">{trip.date_range || "Flexible dates"}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#7A7151]">
                    {trip.assigned_creator_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
                        <Sparkles className="h-3 w-3" /> {trip.assigned_creator_name}
                      </span>
                    )}
                    {trip.assigned_agent_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
                        <MapPinned className="h-3 w-3" /> {trip.assigned_agent_name}
                      </span>
                    )}
                  </div>
                  <Button asChild variant="ghost" className="rounded-full text-xs">
                    <Link to={`/trip/${trip.id}`}>Open trip</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Saved</p>
            <h2 className="font-secondary text-xl text-[#0a2225]">Your moodboard collections</h2>
          </div>
        </div>
        {savedCollections.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-[#E5DFC6] bg-white">
            <CardContent className="flex items-center gap-3 py-5 text-sm text-[#4a4a4a]">
              <Bookmark className="h-4 w-4 text-[#7A7151]" />
              Save collections you love to keep planning.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {savedCollections.map((collection) => (
              <Card key={collection.id} className="rounded-3xl border-[#E5DFC6] bg-white">
                <CardContent className="space-y-2 py-4">
                  <h3 className="text-sm font-semibold text-[#0a2225]">{collection.title}</h3>
                  <p className="text-xs text-[#4a4a4a] line-clamp-2">
                    {collection.description ?? "Saved to your moodboard."}
                  </p>
                  <Button asChild variant="ghost" className="rounded-full text-xs">
                    <Link to={`/collection/${collection.id}`}>Open collection</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

