import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// AgentDirectRequestsTab — the agent counterpart to CreatorHiresTab (Jul 26).
//
// Creators already had an inbox for briefs addressed to them by name
// (CreatorHiresTab, filtering preferred_creator_id). Agents had NOTHING: the
// "Briefs" tab reads `marketplace_jobs`, a different table, so a trip request
// sent directly from an agent's public profile fired a notification and then
// existed nowhere in their dashboard. Clear the notification and the request
// was effectively lost.
//
// preferred_agent_id holds a USER id (both call sites pass one). Older rows may
// hold a travel_agents.id, so we resolve that too and query for either.
// ============================================================================

interface DirectRow {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  budget_min: number | null;
  budget_max: number | null;
  travelers_adults: number | null;
  source_metadata: any;
}

export function AgentDirectRequestsTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DirectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Historical rows may key on travel_agents.id rather than the user id.
      const { data: agentRows } = await supabase
        .from("travel_agents")
        .select("id")
        .eq("user_id", user.id);
      const ids = [user.id, ...((agentRows ?? []).map((a: any) => a.id))];

      const { data, error } = await (supabase
        .from("trip_requests")
        .select(
          "id, title, destination, start_date, end_date, status, created_at, budget_min, budget_max, travelers_adults, source_metadata" as any
        )
        .in("preferred_agent_id", ids)
        .order("created_at", { ascending: false }) as any);

      if (cancelled) return;
      if (error) console.error("direct request inbox load failed:", error);
      setRows((((data as any) || []) as DirectRow[]));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const money = (min: number | null, max: number | null) => {
    if (min == null && max == null) return null;
    const f = (n: number) => `$${n.toLocaleString()}`;
    if (min != null && max != null) return `${f(min)} – ${f(max)}`;
    return f((min ?? max) as number);
  };

  const dates = (a: string | null, b: string | null) => {
    if (!a) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return b ? `${fmt(a)} – ${fmt(b)}` : fmt(a);
  };

  if (loading) {
    return <p className="py-10 text-center text-[15px] text-[#0a2225]/50">Loading your direct requests…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="border-t border-[#E5DFC6] pt-8">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Direct requests</p>
        <h3 className="mt-2 font-secondary text-xl text-[#0a2225] md:text-2xl">No one has requested you directly yet</h3>
        <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/70">
          When a traveler sends you a trip from your profile, it lands here — newest first. These are addressed to
          you by name and aren't visible on the public board.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-t border-[#E5DFC6] pt-8">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Direct requests</p>
        <h3 className="mt-2 font-secondary text-xl text-[#0a2225] md:text-2xl">
          {rows.length === 1 ? "One traveler asked for you" : `${rows.length} travelers asked for you`}
        </h3>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-[#0a2225]/70">
          Addressed to you by name — not on the public board. Open one to read the brief and send a proposal.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const received = new Date(r.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const budget = money(r.budget_min, r.budget_max);
          const when = dates(r.start_date, r.end_date);
          const closed = r.status !== "open" && r.status !== "matched";
          return (
            <Link
              key={r.id}
              to={`/marketplace/request/${r.id}`}
              className="group block rounded-2xl bg-white p-6 ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D6B2F]">{received}</p>
                {closed && (
                  <span className="shrink-0 rounded-full bg-[#0a2225]/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-[#0a2225]/60">
                    {r.status}
                  </span>
                )}
              </div>
              <p className="mt-2 font-secondary text-[21px] leading-snug text-[#0a2225]">
                {r.title || `Trip to ${r.destination ?? "somewhere"}`}
              </p>
              <dl className="mt-4 space-y-1.5 text-[14px] text-[#0a2225]/75">
                {r.destination && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-[#0a2225]/45">Where</dt>
                    <dd>{r.destination}</dd>
                  </div>
                )}
                {when && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-[#0a2225]/45">When</dt>
                    <dd>{when}</dd>
                  </div>
                )}
                {budget && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-[#0a2225]/45">Budget</dt>
                    <dd>{budget}</dd>
                  </div>
                )}
                {r.travelers_adults != null && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-[#0a2225]/45">Party</dt>
                    <dd>
                      {r.travelers_adults} {r.travelers_adults === 1 ? "traveler" : "travelers"}
                    </dd>
                  </div>
                )}
              </dl>
              <span className="mt-5 inline-block text-[13px] font-medium text-[#0c4d47] underline underline-offset-4 group-hover:text-[#0a2225]">
                Read the brief →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
