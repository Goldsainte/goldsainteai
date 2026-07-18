import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, HandCoins, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type TripRequestWithProposals = {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  created_at: string;
  trip_proposals?: { status: string }[];
};

export default function MyTripRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TripRequestWithProposals[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("trip_requests")
        .select(
          `
          id,
          title,
          destination,
          start_date,
          end_date,
          status,
          budget_min,
          budget_max,
          travelers_adults,
          travelers_children,
          created_at,
          source_metadata,
          preferred_creator_id,
          trip_proposals ( status )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading my trip_requests:", error);
        {
        const rows: any[] = ([] as any[]) || [];
        try {
          const ids = Array.from(new Set(rows.map((r) => r.preferred_creator_id).filter(Boolean)));
          if (ids.length) {
            const { data: profs } = await (supabase
              .from("profiles")
              .select("id, display_name, full_name, first_name" as any)
              .in("id", ids) as any);
            const nameById: Record<string, string> = {};
            for (const pr of ((profs as any[]) || [])) {
              nameById[pr.id] = pr.display_name || pr.full_name || pr.first_name || "your host";
            }
            for (const r of rows) {
              if (r.preferred_creator_id) (r as any).addresseeName = nameById[r.preferred_creator_id];
            }
          }
        } catch { /* names are an enhancement */ }
        setRequests(rows as any);
      }
      } else {
        setRequests((data ?? []) as any);
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
        <title>My Trip Requests · Goldsainte</title>
        <meta
          name="description"
          content="View and manage your Goldsainte trip requests, and see proposals from TikTok creators and certified travel agents."
        />
      </Helmet>

      <div className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-12">
          {/* Header */}
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962]">
                Your trips
              </p>
              <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">
                My Trip Requests
              </h1>
              <p className="text-sm text-[#6B7280]">
                These are the trips you've posted to the Goldsainte
                marketplace. As creators and agents send proposals, you'll see
                them here and can choose your favorite.
              </p>
            </div>
            <Link
              to="/post-trip"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-[#BFAD72] px-4 py-2 text-sm font-semibold text-[#0a2225] shadow-sm hover:bg-[#d4c58d] md:mt-0"
            >
              Post another trip
            </Link>
          </header>

          {/* Content */}
          <section className="mt-6">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-40 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/70 px-4 py-8 text-center text-xs text-[#4a4a4a]">
                You haven't posted any trips yet.
                <br />
                <Link
                  to="/post-trip"
                  className="mt-2 inline-block text-[#0c4d47] underline"
                >
                  Post your first trip to the marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <TripRequestRow key={req.id} req={req} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function TripRequestRow({ req }: { req: TripRequestWithProposals }) {
  const proposals = req.trip_proposals ?? [];
  const proposalCount = proposals.length;
  const acceptedCount = proposals.filter(
    (p) => p.status === "accepted"
  ).length;

  const travelers =
    (req.travelers_adults || 0) + (req.travelers_children || 0);

  const dates =
    req.start_date && req.end_date
      ? `${req.start_date} → ${req.end_date}`
      : "Dates flexible / not set";

  const budget =
    req.budget_max || req.budget_min
      ? `$${req.budget_min || ""}–$${req.budget_max || ""} pp`
      : "Budget not specified";

  const statusLabel =
    req.status === "open"
      ? "Open"
      : req.status === "matched"
      ? "Matched"
      : req.status === "completed"
      ? "Completed"
      : "Archived";

  const statusColor =
    req.status === "open"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : req.status === "matched"
      ? "bg-[#BFAD72]/15 text-[#BFAD72] ring-[#BFAD72]/30"
      : req.status === "completed"
      ? "bg-[#0c4d47]/10 text-[#0c4d47] ring-[#0c4d47]/30"
      : "bg-[#8D8D8D]/10 text-[#8D8D8D] ring-[#8D8D8D]/30";

  return (
    <Link
      to={`/trip-request/${req.id}`}
      className="flex flex-col gap-3 rounded-3xl bg-white/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[#8D8D8D]">
            Posted {new Date(req.created_at).toLocaleDateString()}
          </p>
          {(req as any).addresseeName && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#0a2225]">
              <span className="font-medium">Sent directly to {(req as any).addresseeName}</span>
              {Boolean((req as any).source_metadata?.hire_on_trip) && (
                <span className="rounded bg-[#C7A962] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#0a2225]">
                  On-trip hire
                </span>
              )}
            </p>
          )}
          <h2 className="mt-1 line-clamp-2 text-sm font-semibold">
            {req.title || `Trip to ${req.destination || "somewhere special"}`}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#8D8D8D]" />
            <span>{req.destination || "Destination TBD"}</span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#8D8D8D]" />
            <span className="line-clamp-1">{dates}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#8D8D8D]" />
            <span>{travelers || "Unknown"} travelers</span>
          </p>
          <p className="flex items-center gap-1">
            <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
            <span>{budget}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p>
            <span className="font-medium">{proposalCount}</span> proposal
            {proposalCount === 1 ? "" : "s"} received
          </p>
          {acceptedCount > 0 && (
            <p className="text-emerald-700">
              {acceptedCount} proposal
              {acceptedCount === 1 ? "" : "s"} marked as accepted
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-[#0c4d47]">
        <span>View full brief & proposals →</span>
      </div>
    </Link>
  );
}
