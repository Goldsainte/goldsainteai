import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, HandCoins, Sparkles } from "lucide-react";

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
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TripRequestWithProposals[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        navigate("/login?redirect=/my-trip-requests", { replace: true });
        return;
      }

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
          trip_proposals ( status )
        `
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading my trip_requests:", error);
        setRequests([]);
      } else {
        setRequests((data ?? []) as TripRequestWithProposals[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>My Trip Requests · Goldsainte</title>
        <meta
          name="description"
          content="View and manage your Goldsainte trip requests, and see proposals from TikTok creators and certified travel agents."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-[#0a2225] via-[#0a2225] to-[#E5DFC6]">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-12">
          {/* Header */}
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47]/15 px-3 py-1 text-[11px] font-medium text-[#E5DFC6] ring-1 ring-[#BFAD72]/60">
                <Sparkles className="h-3 w-3 text-[#BFAD72]" />
                <span>Your Goldsainte trips</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-[#E5DFC6] md:text-xl">
                My Trip Requests
              </h1>
              <p className="max-w-xl text-xs text-[#E5DFC6]/80 md:text-sm">
                These are the trips you've posted to the Goldsainte
                marketplace. As creators and agents send proposals, you'll see
                them here and can choose your favorite.
              </p>
            </div>
            <Link
              to="/marketplace/request-trip"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-[#BFAD72] px-4 py-2 text-[11px] font-semibold text-[#0a2225] shadow-sm hover:bg-[#d4c58d] md:mt-0"
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
              <div className="rounded-3xl border border-dashed border-[#E5DFC6]/40 bg-[#0a2225]/50 px-4 py-8 text-center text-xs text-[#E5DFC6]/85">
                You haven't posted any trips yet.
                <br />
                <Link
                  to="/marketplace/request-trip"
                  className="mt-2 inline-block text-[#BFAD72] underline"
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
      </main>
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
      className="flex flex-col gap-3 rounded-3xl bg-[#f6f3ea]/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-[#8D8D8D]">
            Posted {new Date(req.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-1 line-clamp-2 text-sm font-semibold">
            {req.title || `Trip to ${req.destination || "somewhere special"}`}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium ring-1 ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 text-[11px] text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#8D8D8D]" />
            <span>{req.destination || "Destination TBD"}</span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#8D8D8D]" />
            <span className="line-clamp-1">{dates}</span>
          </p>
        </div>
        <div className="space-y-1 text-[11px] text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#8D8D8D]" />
            <span>{travelers || "Unknown"} travelers</span>
          </p>
          <p className="flex items-center gap-1">
            <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
            <span>{budget}</span>
          </p>
        </div>
        <div className="space-y-1 text-[11px] text-[#4a4a4a]">
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

      <div className="flex items-center justify-between text-[11px] text-[#0c4d47]">
        <span>View full brief & proposals →</span>
      </div>
    </Link>
  );
}
