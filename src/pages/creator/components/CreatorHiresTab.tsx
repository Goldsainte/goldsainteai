import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { capLabel } from "@/lib/onTripCapabilities";

// The addressee's inbox for direct hire requests. Hire requests are kept off
// the public marketplace by design, which until now meant the ONLY way back
// to one was the notification bell. This lists every trip_request addressed
// to the signed-in creator, newest first, in the compact pipeline card style.

interface HireRow {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at: string;
  budget_max: number | null;
  source_metadata: any;
}

export function CreatorHiresTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<HireRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase
        .from("trip_requests")
        .select("id, title, destination, start_date, end_date, status, created_at, budget_max, source_metadata" as any)
        .eq("preferred_creator_id", user.id)
        .order("created_at", { ascending: false }) as any);
      if (error) console.error("hire inbox load failed:", error);
      setRows(((data as any) || []) as HireRow[]);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-[#0a2225]/50">Loading your requests…</p>;
  }
  if (rows.length === 0) {
    return (
      <div className="border-t border-[#E5DFC6] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Direct requests</p>
        <h3 className="mt-2 font-secondary text-xl text-[#0a2225] md:text-2xl">No one has requested you yet</h3>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/70">
          When a traveler hires you from your profile — or sends you a trip directly — it lands here, newest first.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((r) => {
        const received = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const meta: any = r.source_metadata || {};
        const isHire = Boolean(meta.hire_on_trip);
        const caps: string[] = Array.isArray(meta.hire_capabilities) ? meta.hire_capabilities : [];
        return (
          <Link
            key={r.id}
            to={`/marketplace/request/${r.id}`}
            className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
                <span className="font-secondary text-lg italic text-[#C7A962]/80">{r.destination || "Goldsainte"}</span>
              </div>
              {r.destination && (
                <img
                  src={getTripRequestImageUrl(r.destination)}
                  alt={r.destination}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/20 to-transparent" />
              {isHire && (
                <span className="absolute right-3 top-3 rounded-lg bg-[#C7A962] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#0a2225]">
                  On-trip hire
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#E5DFC6]/80">Received {received}</p>
                <p className="mt-1 font-secondary text-[17px] leading-[1.15] text-[#fdfaf2] line-clamp-2">
                  {r.title || `Trip to ${r.destination ?? "\u2026"}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12.5px] text-[#0a2225]/70">
                {caps.length > 0
                  ? caps.slice(0, 2).map(capLabel).join(" \u00b7 ")
                  : r.budget_max
                  ? `\u2248 $${Number(r.budget_max).toLocaleString()}`
                  : r.status ?? ""}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#0c4d47] transition-colors group-hover:text-[#0a2225]">
                View request →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
