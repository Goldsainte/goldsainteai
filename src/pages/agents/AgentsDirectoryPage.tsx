import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// AgentsDirectoryPage v2 — 1:1 with foratravel.com/advisors, corrected against
// the founder's live grid screenshots (Jul 15, 10:52 PM):
//   • Hero: H1 + two-line "gets your vibe" subtitle. No hero button.
//   • No on-page search or filter row (Fora keeps search in the global nav).
//   • 4-column card grid: beige card, ARCH-OVAL portrait inside a lighter
//     ring, centered serif name, centered "A, B, +N more" specialty line.
//   • Logo-only cards when an agency has a logo but no portrait (Travelara
//     pattern) via travel_agents.logo_url.
//   • Floating "Get matched →" pill pinned bottom-center → Post a Trip.
// Creators duplicate Friday with a kind switch.
// ============================================================================

interface DirectoryAgent {
  userId: string;
  name: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  tags: string[];
}

export default function AgentsDirectoryPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<DirectoryAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: rows } = await supabase
          .from("travel_agents")
          .select("user_id, agency_name, destinations, specializations, logo_url")
          .eq("is_active", true)
          .order("agency_name");
        const list = rows ?? [];
        const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
        const { data: profs } = ids.length
          ? await supabase
              .from("profiles")
              .select("id, full_name, display_name, avatar_url")
              .in("id", ids)
          : { data: [] as any[] };
        if (cancelled) return;
        const profById = new Map((profs ?? []).map((p: any) => [p.id, p]));
        setAgents(
          list
            .filter((r) => r.user_id && profById.has(r.user_id))
            .map((r) => {
              const p = profById.get(r.user_id);
              return {
                userId: r.user_id,
                name: p.display_name || p.full_name || r.agency_name || "Goldsainte Specialist",
                avatarUrl: p.avatar_url,
                logoUrl: r.logo_url ?? null,
                tags: [
                  ...new Set([...(r.specializations ?? []), ...(r.destinations ?? [])]),
                ] as string[],
              };
            })
        );
      } catch (e) {
        console.error("agents directory load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const specialtyLine = (tags: string[]) => {
    if (tags.length === 0) return null;
    const shown = tags.slice(0, 2).join(", ");
    const extra = tags.length - 2;
    return extra > 0 ? `${shown}, +${extra} more` : shown;
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-28">
      <Helmet>
        <title>Our Travel Specialists · Goldsainte</title>
        <meta
          name="description"
          content="Find a travel specialist who gets your vibe, and design your dream trip together."
        />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 pt-16 text-center">
        <h1 className="font-secondary text-5xl leading-tight text-[#0a2225] md:text-6xl">
          Our Travel Specialists
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-[#0a2225]/70">
          Find a travel specialist who gets your vibe, and design your dream trip
          together — all while booking securely through Goldsainte.
        </p>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-14 max-w-6xl px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-3xl border border-[#E5DFC6] bg-white/60 p-12 text-center">
            <p className="font-secondary text-xl text-[#0a2225]">Specialists coming soon</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Post your trip and we'll match you with the right one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <Link
                key={a.userId}
                to={`/agents/${a.userId}`}
                className="group rounded-2xl bg-[#F5F0E0]/70 px-6 pb-8 pt-8 text-center transition-shadow hover:shadow-[0_8px_28px_rgba(10,34,37,0.10)]"
              >
                <div className="mx-auto w-[72%] rounded-[50%] bg-[#EDE5D1]/80 p-3">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt={a.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full rounded-[50%] object-cover"
                    />
                  ) : a.logoUrl ? (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[50%] bg-white">
                      <img src={a.logoUrl} alt={a.name} loading="lazy" className="max-h-[60%] max-w-[70%] object-contain" />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[50%] bg-white font-secondary text-4xl text-[#0c4d47]">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="mt-6 font-secondary text-2xl text-[#0a2225]">{a.name}</h2>
                {specialtyLine(a.tags) && (
                  <p className="mt-2 text-[15px] leading-snug text-[#0a2225]/60">
                    {specialtyLine(a.tags)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Get matched pill ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate("/post-trip")}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0c4d47] px-8 py-4 text-[15px] font-medium text-[#f7f3ea] shadow-[0_10px_30px_rgba(10,34,37,0.30)] transition-colors hover:bg-[#0a2225]"
      >
        Get matched <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
