import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CountryTile } from "./CountryTile";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Search, X } from "lucide-react";
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
  homeBase: string | null;
}

const COPY: Record<DirectoryKind, { titleKey: string; title: string; subKey: string; subtitle: string; link: (id: string) => string }> = {
  agent: {
    titleKey: "directory.agentTitle",
    title: "Our Travel Specialists",
    subKey: "directory.agentSub",
    subtitle:
      "Find a travel specialist who gets your vibe, and design your dream trip together — all while booking securely through Goldsainte.",
    link: (id) => `/agents/${id}`,
  },
  creator: {
    titleKey: "directory.creatorTitle",
    title: "Our Travel Creators",
    subKey: "directory.creatorSub",
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
          homeBase: null,
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
      homeBase: r.home_base ?? null,
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

  // ── Filtering (Jul 25) — the directory will hold thousands of profiles;
  // search + specialty chips keep it navigable. Client-side over the ranked
  // set; server-side pagination is the boarded v2 once volume demands it.
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeCountries, setActiveCountries] = useState<string[]>([]);

  // Most common specialties across the loaded set, as filter chips.
  // Tags are free-typed by creators/agents, so "Adventure", "adventure", and
  // "ADVENTURE" are the same specialty — group case-insensitively and show one
  // canonical Title Case chip (founder catch, Jul 25).
  // topTags removed Jul 26 with the specialty chip row — the computation had
  // no remaining consumer. Search still matches tags directly.

  // COUNTRY FILTER (Jul 26). home_base is free text — "Santorini, Greece",
  // "Charlotte, NC, USA", "Dehradun, Uttarakhand, India", "Morocco" — so the
  // country is the last comma-separated segment. Common variants are folded
  // together so "USA", "US" and "United States" are one chip.
  const COUNTRY_ALIASES: Record<string, string> = {
    usa: "United States",
    us: "United States",
    "u.s.": "United States",
    "u.s.a.": "United States",
    "united states of america": "United States",
    uk: "United Kingdom",
    "u.k.": "United Kingdom",
    england: "United Kingdom",
    scotland: "United Kingdom",
    wales: "United Kingdom",
    uae: "United Arab Emirates",
  };

  const countryOf = (homeBase: string | null): string | null => {
    if (!homeBase) return null;
    const last = homeBase.split(",").pop()?.trim();
    if (!last) return null;
    const key = last.toLowerCase();
    return (
      COUNTRY_ALIASES[key] ??
      last.replace(/\b\w/g, (ch) => ch.toUpperCase())
    );
  };

  // Countries present in the loaded set, most common first. Agents don't
  // populate home_base, so this list is naturally empty for that directory
  // and the row hides itself.
  const topCountries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cards) {
      const country = countryOf(c.homeBase);
      if (country) counts.set(country, (counts.get(country) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [cards]);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.homeBase ?? "").toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.some((t) =>
          c.tags.some((ct) => ct.trim().toLowerCase() === t.trim().toLowerCase())
        );
      const matchesCountry =
        activeCountries.length === 0 ||
        (() => {
          const country = countryOf(c.homeBase);
          return !!country && activeCountries.includes(country);
        })();
      return matchesQuery && matchesTags && matchesCountry;
    });
  }, [cards, query, activeTags, activeCountries]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleCountry = (c: string) =>
    setActiveCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  const clearFilters = () => {
    setQuery("");
    setActiveTags([]);
    setActiveCountries([]);
  };
  const filtersActive =
    query.trim() !== "" || activeTags.length > 0 || activeCountries.length > 0;

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
    return extra > 0 ? `${shown}, ` + t("directory.moreN", { count: extra, defaultValue: "+{{count}} more" }) : shown;
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-28">
      <Helmet>
        <title>{t(copy.titleKey, copy.title) + " · Goldsainte"}</title>
        <meta name="description" content={t(copy.subKey, copy.subtitle)} />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 pt-10 text-center md:pt-16">
        <h1 className="font-secondary text-3xl leading-tight text-[#0a2225] sm:text-5xl md:text-6xl">{t(copy.titleKey, copy.title)}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#0a2225]/70 md:mt-6 md:text-[18px]">{t(copy.subKey, copy.subtitle)}</p>
      </div>

      {/* Filter bar */}
      {!loading && cards.length > 0 && (
        <div className="mx-auto mt-8 max-w-6xl px-4 md:mt-12">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={kind === "agent" ? t("directory.searchAgents", "Search specialists, destinations…") : t("directory.searchCreators", "Search creators, niches, places…")}
                className="w-full rounded-full border border-[#E5DFC6] bg-white py-3 pl-11 pr-4 text-[14.5px] text-[#0a2225] outline-none placeholder:text-[#9CA3AF] focus:border-[#C7A962]"
              />
            </div>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[13.5px] text-[#0a2225]/70 hover:text-[#0a2225]"
              >
                <X className="h-3.5 w-3.5" /> {t("directory.clear", "Clear")}
              </button>
            )}
            {/* Roster size removed Jul 26 (founder call): the marketplace's
                exact headcount isn't something visitors need — and early on it
                reads as scarcity rather than curation. */}
          </div>
          {/* Specialty chips removed Jul 26 (founder call): country is the
              only filter for now — one clear axis beats two competing ones.
              Search still matches niches, so "adventure" typed in the box
              still works. A second layer is a deliberate decision to make
              after seeing this one in use. */}

          {topCountries.length > 0 && (
            <div className="mt-6 flex flex-nowrap items-end gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topCountries.map((c) => (
                <CountryTile
                  key={c}
                  country={c}
                  active={activeCountries.includes(c)}
                  onToggle={toggleCountry}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-6xl px-4 md:mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C7A962]" />
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-[#E5DFC6] bg-white/60 p-12 text-center">
            <p className="font-secondary text-xl text-[#0a2225]">
              {kind === "agent" ? t("directory.agentsSoon", "Specialists coming soon") : t("directory.creatorsSoon", "Creators coming soon")}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">{t("directory.postToMatch", "Post your trip and we'll match you.")}</p>
          </div>
        ) : visibleCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
            <p className="font-secondary text-xl text-[#0a2225]">{t("directory.noMatches", "No matches")}</p>
            <button type="button" onClick={clearFilters} className="mt-3 text-sm text-[#0c4d47] underline underline-offset-4">
              {t("directory.clearAll", "Clear filters and show everyone")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {/* Mobile = compact Fora-style 2-up grid (flat rectangular photos,
                left-aligned name + specialty). sm and up = the original oval-ring
                editorial cards, unchanged. One markup, responsive classes. */}
            {visibleCards.map((a) => (
              <Link
                key={a.userId}
                to={copy.link(a.userId)}
                className="group rounded-2xl bg-transparent px-0 pb-1 pt-0 text-left transition-shadow sm:bg-[#F5F0E0]/70 sm:px-6 sm:pb-8 sm:pt-8 sm:text-center sm:hover:shadow-[0_8px_28px_rgba(10,34,37,0.10)]"
              >
                <div className="mx-auto w-full rounded-2xl bg-transparent p-0 sm:w-[72%] sm:rounded-[50%] sm:bg-[#EDE5D1]/80 sm:p-3">
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} alt={a.name} loading="lazy" className="aspect-[4/5] w-full rounded-2xl object-cover sm:rounded-[50%]" />
                  ) : a.logoUrl ? (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-white sm:rounded-[50%]">
                      <img src={a.logoUrl} alt={a.name} loading="lazy" className="max-h-[60%] max-w-[70%] object-contain" />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-white font-secondary text-3xl text-[#0c4d47] sm:rounded-[50%] sm:text-4xl">
                      {a.name.replace("@", "").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="mt-3 font-secondary text-lg leading-snug text-[#0a2225] sm:mt-6 sm:text-2xl">{a.name}</h2>
                {specialtyLine(a.tags) && (
                  <p className="mt-1 text-[12px] leading-snug text-[#0a2225]/60 sm:mt-2 sm:text-[15px]">{specialtyLine(a.tags)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/get-matched")} // AI front door (31 Jul); wizard remains at /post-trip
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0c4d47] px-8 py-4 text-[15px] font-medium text-[#f7f3ea] shadow-[0_10px_30px_rgba(10,34,37,0.30)] transition-colors hover:bg-[#0a2225]"
      >
        {t("directory.getMatched", "Get matched")} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default PartnerDirectory;
