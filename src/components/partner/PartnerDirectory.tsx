import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// PartnerDirectory — the shared Fora-/advisors-model directory (Jul 16 AM).
// One component, two kinds: agents (travel_agents+profiles) and creators
// (creator_profiles). Same oval-ring cards, centered "+N more" line, 4-col
// grid, floating Get matched pill. AgentsDirectoryPage and
// CreatorsDirectoryPage are 3-line wrappers over this.
// ============================================================================

export type DirectoryKind = "agent" | "creator";

interface DirectoryCard {
  userId: string;
  name: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  tags: string[];
}

const COPY: Record<DirectoryKind, { title: string; subtitle: string; link: (id: string) => string }> = {
  agent: {
    title: "Our Travel Specialists",
    subtitle:
      "Find a travel specialist who gets your vibe, and design your dream trip together — all while booking securely through Goldsainte.",
    link: (id) => `/agents/${id}`,
  },
  creator: {
    title: "Our Travel Creators",
    subtitle:
      "Follow creators whose journeys inspire yours — then turn their content into your next trip, booked securely through Goldsainte.",
    link: (id) => `/creators/${id}`,
  },
};

async function fetchCards(kind: DirectoryKind): Promise<DirectoryCard[]> {
  if (kind === "agent") {
    // profiles/travel_agents are RLS-locked for non-owners — public pages
    // read through the public_* window views (173).
    const { data: rows } = await supabase
      .from("public_travel_agents" as unknown as "travel_agents")
      .select("user_id, agency_name, destinations, specializations, logo_url")
      .eq("is_active", true)
      .order("agency_name");
    const list = rows ?? [];
    const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
    const { data: profs } = ids.length
      ? await supabase
          .from("public_profiles" as unknown as "profiles")
          .select("id, full_name, display_name, avatar_url")
          .in("id", ids)
      : { data: [] as any[] };
    const profById = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return list
      .filter((r) => r.user_id && profById.has(r.user_id))
      .map((r) => {
        const p = profById.get(r.user_id);
        return {
          userId: r.user_id,
          name: p.display_name || p.full_name || r.agency_name || "Goldsainte Specialist",
          avatarUrl: p.avatar_url,
          logoUrl: r.logo_url ?? null,
          tags: [...new Set([...(r.specializations ?? []), ...(r.destinations ?? [])])] as string[],
        };
      });
  }
  // Creators live in profiles behind the existing creator_directory public
  // window (same source the original creators marketplace used).
  const { data: rows } = await supabase
    .from("creator_directory" as unknown as "profiles")
    .select("id, display_name, full_name, avatar_url, creator_niches, content_style_tags, home_base");
  return ((rows ?? []) as any[])
    .filter((r) => r.id && (r.display_name || r.full_name))
    .map((r) => ({
      userId: r.id,
      name: r.display_name || r.full_name,
      avatarUrl: r.avatar_url,
      logoUrl: null,
      tags: [
        ...new Set([...(r.creator_niches ?? []), ...(r.content_style_tags ?? [])]),
      ] as string[],
    }));
}

// Placement v1 — completeness-first: real photo, then richer tag sets, then
// name. Finish your profile, rank higher. (Engagement-weighted ranking is the
// boarded v2 once views/bookings accumulate.)
function rankCards(cards: DirectoryCard[]): DirectoryCard[] {
  return [...cards].sort((a, b) => {
    const photo = Number(Boolean(b.avatarUrl)) - Number(Boolean(a.avatarUrl));
    if (photo !== 0) return photo;
    const tags = Math.min(b.tags.length, 6) - Math.min(a.tags.length, 6);
    if (tags !== 0) return tags;
    return a.name.localeCompare(b.name);
  });
}

export function PartnerDirectory({ kind }: { kind: DirectoryKind }) {
  const navigate = useNavigate();
  const copy = COPY[kind];
  const [cards, setCards] = useState<DirectoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchCards(kind);
        if (!cancelled) setCards(rankCards(result));
      } catch (e) {
        console.error(`${kind} directory load failed`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const specialtyLine = (tags: string[]) => {
    if (tags.length === 0) return null;
    const shown = tags.slice(0, 2).join(", ");
    const extra = tags.length - 2;
    return extra > 0 ? `${shown}, +${extra} more` : shown;
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-28">
      <Helmet>
        <title>{copy.title + " · Goldsainte"}</title>
        <meta name="description" content={copy.subtitle} />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 pt-16 text-center">
        <h1 className="font-secondary text-5xl leading-tight text-[#0a2225] md:text-6xl">{copy.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-[#0a2225]/70">{copy.subtitle}</p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-[#E5DFC6] bg-white/60 p-12 text-center">
            <p className="font-secondary text-xl text-[#0a2225]">
              {kind === "agent" ? "Specialists coming soon" : "Creators coming soon"}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">Post your trip and we'll match you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((a) => (
              <Link
                key={a.userId}
                to={copy.link(a.userId)}
                className="group rounded-2xl bg-[#F5F0E0]/70 px-6 pb-8 pt-8 text-center transition-shadow hover:shadow-[0_8px_28px_rgba(10,34,37,0.10)]"
              >
                <div className="mx-auto w-[72%] rounded-[50%] bg-[#EDE5D1]/80 p-3">
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} alt={a.name} loading="lazy" className="aspect-[4/5] w-full rounded-[50%] object-cover" />
                  ) : a.logoUrl ? (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[50%] bg-white">
                      <img src={a.logoUrl} alt={a.name} loading="lazy" className="max-h-[60%] max-w-[70%] object-contain" />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[50%] bg-white font-secondary text-4xl text-[#0c4d47]">
                      {a.name.replace("@", "").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="mt-6 font-secondary text-2xl text-[#0a2225]">{a.name}</h2>
                {specialtyLine(a.tags) && (
                  <p className="mt-2 text-[15px] leading-snug text-[#0a2225]/60">{specialtyLine(a.tags)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

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

export default PartnerDirectory;
