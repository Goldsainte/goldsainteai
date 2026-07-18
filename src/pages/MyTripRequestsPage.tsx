import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, HandCoins, Sparkles, ArrowRight } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-40 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/70 px-4 py-8 text-center text-xs text-[#4a4a4a]">
                No requests from this account yet.
                <br />
                <Link
                  to="/post-trip"
                  className="mt-2 inline-block text-[#0c4d47] underline"
                >
                  Post a trip — or hire a creator from their profile
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

  const proposalsCount = Array.isArray((req as any).trip_proposals) ? (req as any).trip_proposals.length : 0;
  const rawImg = req.destination ? getTripRequestImageUrl(req.destination) : null;
  const imgUrl = rawImg && String(rawImg).length > 0 ? rawImg : null;
  const isHireReq = Boolean((req as any).source_metadata?.hire_on_trip);
  return (
    <Link
      to={`/trip-request/${req.id}`}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)]"
    >
      <div className={`relative overflow-hidden ${imgUrl ? "aspect-[4/3]" : "min-h-[150px]"}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
          <span className="font-secondary text-xl italic text-[#C7A962]/80">Goldsainte</span>
        </div>
        {imgUrl && (
          <img src={imgUrl} alt={req.destination || "Trip"} loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        )}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6]">
          {statusLabel}
        </span>
        {isHireReq && (
          <span className="absolute left-3.5 top-3.5 rounded bg-[#C7A962] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0a2225]">
            On-trip hire
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061418]/85 to-transparent px-5 pb-4 pt-12">
          {req.destination && (
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#C7A962]/95">{req.destination}</p>
          )}
          <p className="mt-1.5 font-secondary text-[22px] leading-[1.1] text-[#fdfaf2] line-clamp-2">
            {req.title || `Trip to ${req.destination || "somewhere special"}`}
          </p>
          <p className="mt-1.5 text-[12.5px] text-[#fdfaf2]/80">
            Posted {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {(req as any).addresseeName ? ` \u00b7 Sent to ${(req as any).addresseeName}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-[12.5px] text-[#0a2225]/55">
          {dates}
          {" \u00b7 "}
          {proposalsCount} proposal{proposalsCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-[#0c4d47]">
          View request
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
