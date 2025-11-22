import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type TripRequest = {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  trip_style: string[] | null;
  created_at: string;
};

export default function TripRequestsBoardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!user) return;
      setLoading(true);

      // MARKETPLACE VIEW: Query the same trip_requests table that travelers create
      // This is the public/external view filtered to show only 'open' requests
      // The same records appear in "My Trips → Requests" for the traveler who created them
      const { data, error } = await supabase
        .from("trip_requests")
        .select(
          "id, title, destination, start_date, end_date, budget_min, budget_max, travelers_adults, travelers_children, trip_style, created_at"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading trip_requests:", error);
        setRequests([]);
      } else {
        setRequests((data ?? []) as TripRequest[]);
      }
      setLoading(false);
    }

    if (user) {
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <>
      <Helmet>
        <title>Trip Requests · Goldsainte</title>
        <meta
          name="description"
          content="See traveler trip requests on Goldsainte and pitch your proposal as a TikTok creator or certified travel agent."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47]/15 px-3 py-1 text-[11px] font-medium text-[#E5DFC6] ring-1 ring-[#BFAD72]/60">
                <Sparkles className="h-3 w-3 text-[#BFAD72]" />
                <span>For creators & agents</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-[#E5DFC6] md:text-xl">
                Trip Requests Marketplace
              </h1>
              <p className="max-w-xl text-xs text-[#E5DFC6]/80 md:text-sm">
                These are live briefings from travelers. When you send a
                proposal, they'll see your pitch alongside your name and
                profile.
              </p>
            </div>
            <p className="text-[11px] text-[#E5DFC6]/70">
              Tip: Focus on the trips that align most with your niche and
              destination expertise.
            </p>
          </header>

          <section className="mt-6">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-40 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6]/40 bg-[#0a2225]/50 px-4 py-8 text-center text-xs text-[#E5DFC6]/85">
                There are no open trip requests right now. Check back soon or
                invite your travelers to post their first trip on Goldsainte.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {requests.map((req) => (
                  <TripRequestCard key={req.id} req={req} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function TripRequestCard({ req }: { req: TripRequest }) {
  const styles = (req.trip_style ?? []).join(", ");
  const budget =
    req.budget_max || req.budget_min
      ? `$${req.budget_min || ""}–$${req.budget_max || ""} pp`
      : "Budget not specified";

  const travelers =
    (req.travelers_adults || 0) + (req.travelers_children || 0);

  const dates =
    req.start_date && req.end_date
      ? `${req.start_date} → ${req.end_date}`
      : "Dates flexible / not set";

  return (
    <Link
      to={`/trip-request/${req.id}`}
      className="flex flex-col rounded-3xl bg-[#f6f3ea]/95 p-4 shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72] transition-all"
    >
      <div className="flex items-center justify-between gap-2 text-[10px] text-[#8D8D8D]">
        <span>{new Date(req.created_at).toLocaleDateString()}</span>
        <span className="rounded-full bg-[#0c4d47]/8 px-2 py-0.5 text-[10px] font-medium text-[#0c4d47]">
          Open for proposals
        </span>
      </div>

      <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-[#0a2225]">
        {req.title || `Trip to ${req.destination || "somewhere special"}`}
      </h2>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#4a4a4a]">
        <MapPin className="h-3 w-3 text-[#8D8D8D]" />
        <span>{req.destination || "Destination TBD"}</span>
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#4a4a4a]">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[#8D8D8D]" />
          <span className="line-clamp-1">{dates}</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <Users className="h-3 w-3 text-[#8D8D8D]" />
          <span>{travelers || "Unknown"} travelers</span>
        </div>
      </div>

      <p className="mt-1 text-[10px] text-[#4a4a4a]">{budget}</p>

      {styles && (
        <p className="mt-1 line-clamp-2 text-[10px] text-[#8D8D8D]">
          {styles}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-[#0c4d47] font-medium">
          View & send proposal →
        </span>
      </div>
    </Link>
  );
}
