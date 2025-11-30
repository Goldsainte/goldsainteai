import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Sparkles } from "lucide-react";

interface TripInboxRow {
  id: string;
  destination: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  assignments?: { role: string; profiles?: { full_name?: string | null } | null }[];
}

const statusCopy: Record<string, string> = {
  new: "New",
  matched: "In progress",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TripInboxPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripInboxRow[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("trip_requests")
      .select(
        "id, destination, status, start_date, end_date, created_at"
      )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setTrips((data as TripInboxRow[]) ?? []);
    };

    void load();
  }, [user]);

  const grouped = useMemo(() => {
    return {
      all: trips,
      new: trips.filter((t) => t.status === "new" || !t.status),
      in_progress: trips.filter((t) => t.status === "in_progress" || t.status === "matched"),
      completed: trips.filter((t) => t.status === "completed"),
    };
  }, [trips]);

  const renderTrips = (rows: TripInboxRow[]) => {
    if (rows.length === 0) {
      return (
        <Card className="rounded-3xl border-dashed border-[#E5DFC6] bg-white">
          <CardContent className="space-y-3 py-6 text-sm text-[#4a4a4a]">
            <p>Start with a moodboard or collection that feels like you.</p>
            <div className="flex gap-2">
              <Button asChild size="sm" className="rounded-full text-xs">
                <Link to="/marketplace">Browse collections</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                <Link to="/concierge">Ask Madison</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((trip) => {
          const creator = trip.assignments?.find((a) => a.role === "creator");
          const agent = trip.assignments?.find((a) => a.role === "agent");
          return (
            <Card key={trip.id} className="rounded-3xl border-[#E5DFC6] bg-white">
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center justify-between text-[11px] text-[#7A7151]">
                  <Badge variant="secondary" className="rounded-full border-[#E5DFC6] bg-[#F5F0E0] text-[#7A7151]">
                    {statusCopy[trip.status ?? "new"] ?? "New"}
                  </Badge>
                  <span>{new Date(trip.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#0a2225]">
                  {trip.destination || "Destination TBD"}
                </h3>
                <p className="text-sm text-[#4a4a4a]">
                  {trip.start_date && trip.end_date
                    ? `${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}`
                    : "Flexible dates"}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-[#7A7151]">
                  {creator?.profiles?.full_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
                      <Sparkles className="h-3 w-3" /> {creator.profiles.full_name}
                    </span>
                  )}
                  {agent?.profiles?.full_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E0] px-3 py-1">
                      <MapPin className="h-3 w-3" /> {agent.profiles.full_name}
                    </span>
                  )}
                </div>
                <Button asChild variant="ghost" className="rounded-full text-xs">
                  <Link to={`/trip/${trip.id}`}>Open trip</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Trip inbox</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">All your trips in one place</h1>
        <p className="text-sm text-[#4a4a4a] max-w-2xl">
          Keep tabs on the journeys you’ve kicked off with Goldsainte. Revisit matches, messages, and bookings.
        </p>
      </header>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="rounded-full bg-[#F5F0E0] p-1 text-[11px]">
          <TabsTrigger value="all" className="rounded-full px-4">All</TabsTrigger>
          <TabsTrigger value="new" className="rounded-full px-4">New</TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-full px-4">In progress</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-full px-4">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTrips(grouped.all)}</TabsContent>
        <TabsContent value="new">{renderTrips(grouped.new)}</TabsContent>
        <TabsContent value="in_progress">{renderTrips(grouped.in_progress)}</TabsContent>
        <TabsContent value="completed">{renderTrips(grouped.completed)}</TabsContent>
      </Tabs>
    </div>
  );
}

