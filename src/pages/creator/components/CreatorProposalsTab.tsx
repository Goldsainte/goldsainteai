import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTripRequestImageUrl } from "@/utils/tripImages";

// Pipeline → Proposals: every proposal this creator/agent has sent, rendered
// in the same card language as the traveler journeys page (MyBookingsPage):
// photo-is-the-card with the sanctioned deep-green fallback panel, status
// pill on the image, scrim with gold destination eyebrow + cream serif
// title, slim footer strip.

type Row = {
  id: string;
  headline: string | null;
  status: string | null;
  price_from: number | null;
  currency: string | null;
  created_at: string;
  trip_request: { title: string | null; destination: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  pending: "Pending",
  traveler_review: "In review",
  accepted: "Accepted",
  declined: "Not selected",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export function CreatorProposalsTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      // Two-step fetch, no embed — and errors are SHOWN, never converted
      // into a fake "no proposals" empty state.
      const { data, error } = await supabase
        .from("trip_proposals")
        .select("id, headline, status, price_from, currency, created_at, trip_request_id")
        .or(`proposer_id.eq.${user.id},agent_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[MyProposals] load failed:", error);
        if (!cancelled) setLoadError(error.message);
        return;
      }
      const base = (data as any[]) ?? [];
      const tripIds = [...new Set(base.map((r) => r.trip_request_id).filter(Boolean))];
      let tripsById: Record<string, { title: string | null; destination: string | null }> = {};
      if (tripIds.length > 0) {
        const { data: trips, error: tripsError } = await supabase
          .from("trip_requests")
          .select("id, title, destination")
          .in("id", tripIds);
        if (tripsError) console.error("[MyProposals] trip lookup failed:", tripsError);
        for (const t of (trips as any[]) ?? []) tripsById[t.id] = t;
      }
      if (!cancelled)
        setRows(
          base.map((r) => ({ ...r, trip_request: tripsById[r.trip_request_id] ?? null }))
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loadError) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-[#E5DFC6] p-8 text-center">
        <p className="text-[15px] text-[#0a2225]/70">
          We couldn't load your proposals. Please refresh — and if this
          persists, contact support.
        </p>
        <p className="mt-2 font-mono text-[12.5px] text-[#0a2225]/40">{loadError}</p>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-[#E5DFC6] p-8 text-center text-[15px] text-[#0a2225]/50">
        Loading your proposals…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-[#E5DFC6] p-8 md:p-12 text-center">
        <p className="text-[12px] md:text-[12.5px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          Your pipeline
        </p>
        <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">No proposals yet</h2>
        <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-[#0a2225]/60">
          Browse the trip requests on the marketplace and send your first
          tailored proposal — travelers are waiting for the right specialist.
        </p>
        <Link
          to="/marketplace?tab=trip-requests"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-7 py-3 text-[12.5px] font-medium uppercase tracking-[0.18em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
        >
          Browse trip requests
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((r) => {
        const submitted = new Date(r.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return (
          <Link
            key={r.id}
            to={`/proposals/${r.id}`}
            className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)]"
          >
            {/* Photo IS the card — same destination imagery as the
                marketplace request cards, gradient beneath as fallback */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
                <span className="font-secondary text-xl italic text-[#C7A962]/80">
                  {r.trip_request?.destination || "Goldsainte"}
                </span>
              </div>
              {r.trip_request?.destination && (
                <img
                  src={getTripRequestImageUrl(r.trip_request.destination)}
                  alt={r.trip_request.destination}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              )}

              {/* Status pill on the panel */}
              <span className="absolute right-3.5 top-3.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6] ring-1 ring-[#E5DFC6]/25">
                {STATUS_LABELS[r.status ?? ""] ?? r.status ?? "—"}
              </span>

              {/* Bottom scrim with serif headline */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061418]/85 to-transparent px-5 pb-4 pt-12">
                {r.trip_request?.title && (
                  <p className="text-[12px] uppercase tracking-[0.24em] text-[#C7A962]/95">
                    {r.trip_request.title}
                  </p>
                )}
                <p className="mt-1 font-secondary text-[17px] leading-[1.15] text-[#fdfaf2] line-clamp-2">
                  {r.headline || "Untitled proposal"}
                </p>
                <p className="mt-1.5 text-[14px] text-[#fdfaf2]/80">
                  Submitted {submitted}
                </p>
              </div>
            </div>

            {/* Slim footer strip */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] text-[#0a2225]/55">
                {typeof r.price_from === "number"
                  ? `from $${Number(r.price_from).toLocaleString()}`
                  : "—"}
              </span>
              <span className="text-[12.5px] font-medium uppercase tracking-[0.2em] text-[#0c4d47] transition-colors group-hover:text-[#0a2225]">
                View proposal →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
