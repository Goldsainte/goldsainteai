import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { SlidersHorizontal, ChevronDown } from "lucide-react";


type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type Creator = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  tiktokHandle: string | null;
  followers: number | null;
  avgViews: number | null;
  city: string | null;
  country: string | null;
  languages: string[];
  niches: string[];
};

type CreatorFilters = {
  search: string;
  followersMin?: number;
  followersMax?: number;
  engagementMin?: number;
  country?: string;
  language?: string;
  niche?: string;
};

const defaultFilters: CreatorFilters = {
  search: "",
};

function sanitizeStringArray(value?: (string | null)[] | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

function normalizeLanguages(profile: ProfileRow): string[] {
  const values: string[] = [];
  if (profile.preferred_language) {
    values.push(profile.preferred_language);
  }

  const pref = profile.preferences;
  if (pref && typeof pref === "object" && !Array.isArray(pref)) {
    const languagesRaw = (pref as { languages?: unknown }).languages;
    if (Array.isArray(languagesRaw)) {
      languagesRaw.forEach((lng) => {
        if (typeof lng === "string" && lng.trim()) {
          values.push(lng.trim());
        }
      });
    } else if (typeof languagesRaw === "string" && languagesRaw.trim()) {
      values.push(languagesRaw.trim());
    }
  }

  return Array.from(new Set(sanitizeStringArray(values)));
}

function normalizeLocation(value: string | null): { city: string | null; country: string | null } {
  if (!value) {
    return { city: null, country: null };
  }
  const parts = value.split(",");
  const city = parts[0]?.trim() || null;
  const country = parts.slice(1).join(",").trim() || null;
  return { city, country };
}

function mapProfileToCreator(row: ProfileRow): Creator {
  const followers =
    row.tiktok_followers ?? row.followers_count ?? row.creator_followers ?? null;
  const avgViews = row.creator_avg_views ?? null;
  const homeBaseLocation = normalizeLocation(row.home_base);
  const primaryNiches = sanitizeStringArray(row.creator_niches);
  const fallbackNiches = sanitizeStringArray(row.content_style_tags);
  const nicheTags = primaryNiches.length ? primaryNiches : fallbackNiches;
  const languages = normalizeLanguages(row);

  return {
    id: row.id,
    displayName: row.display_name || row.full_name || row.username || "Creator",
    avatarUrl: row.avatar_url,
    tiktokHandle: row.tiktok_handle ?? row.tiktok_username ?? row.username,
    followers,
    avgViews,
    city: homeBaseLocation.city,
    country: row.country ?? homeBaseLocation.country,
    languages,
    niches: nicheTags ?? [],
  };
}

function computeEngagementRate(creator: Creator): number | null {
  if (creator.followers && creator.avgViews && creator.followers > 0) {
    return (creator.avgViews / creator.followers) * 100;
  }
  return null;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CreatorFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<"followers" | "engagement" | "relevance">(
    "followers"
  );
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function loadCreators() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            display_name,
            avatar_url,
            tiktok_handle,
            tiktok_username,
            tiktok_followers,
            followers_count,
            creator_followers,
            creator_avg_views,
            home_base,
            country,
            creator_niches,
            content_style_tags,
            preferred_language,
            preferences,
            full_name,
            username
          `
        )
        .eq("account_type", "creator");

      if (!error && data) {
        setCreators(data.map(mapProfileToCreator));
      }
      setLoading(false);
    }

    loadCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    let result = [...creators];
    const search = filters.search.trim().toLowerCase();

    if (search) {
      result = result.filter((creator) => {
        const name = creator.displayName.toLowerCase();
        const handle = (creator.tiktokHandle || "").toLowerCase();
        const city = (creator.city || "").toLowerCase();
        const country = (creator.country || "").toLowerCase();
        const languages = creator.languages.join(" ").toLowerCase();
        const niches = creator.niches.join(" ").toLowerCase();
        return (
          name.includes(search) ||
          handle.includes(search) ||
          city.includes(search) ||
          country.includes(search) ||
          languages.includes(search) ||
          niches.includes(search)
        );
      });
    }

    if (filters.followersMin != null) {
      result = result.filter(
        (creator) =>
          creator.followers != null && creator.followers >= filters.followersMin!
      );
    }

    if (filters.followersMax != null) {
      result = result.filter(
        (creator) =>
          creator.followers != null && creator.followers <= filters.followersMax!
      );
    }

    if (filters.engagementMin != null) {
      result = result.filter((creator) => {
        const rate = computeEngagementRate(creator);
        return rate != null && rate >= filters.engagementMin!;
      });
    }

    if (filters.country) {
      const needle = filters.country.toLowerCase();
      result = result.filter((creator) =>
        (creator.country || "").toLowerCase().includes(needle)
      );
    }

    if (filters.language) {
      const needle = filters.language.toLowerCase();
      result = result.filter((creator) =>
        creator.languages.some((lng) => lng.toLowerCase().includes(needle))
      );
    }

    if (filters.niche) {
      const needle = filters.niche.toLowerCase();
      result = result.filter((creator) =>
        creator.niches.some((n) => n.toLowerCase().includes(needle))
      );
    }

    if (sortBy === "followers") {
      result.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    } else if (sortBy === "engagement") {
      result.sort(
        (a, b) => (computeEngagementRate(b) || 0) - (computeEngagementRate(a) || 0)
      );
    }

    return result;
  }, [creators, filters, sortBy]);

  const sortControl = (
    <select
      className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-xs text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
      value={sortBy}
      onChange={(event) =>
        setSortBy(event.target.value as "followers" | "engagement" | "relevance")
      }
    >
      <option value="followers">Sort by followers</option>
      <option value="engagement">Sort by engagement rate</option>
      <option value="relevance">Sort by relevance</option>
    </select>
  );

  const filtersPanel = (
    <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-5">
      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Followers</div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-1/2 rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            value={filters.followersMin ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                followersMin: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
          <input
            type="number"
            placeholder="Max"
            className="w-1/2 rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            value={filters.followersMax ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                followersMax: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">
          Min engagement rate (%)
        </label>
        <input
          type="number"
          placeholder="e.g. 3"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.engagementMin ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              engagementMin: event.target.value ? Number(event.target.value) : undefined,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Creator location</label>
        <input
          type="text"
          placeholder="Country or city"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.country ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, country: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Language</label>
        <input
          type="text"
          placeholder="e.g. English"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.language ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, language: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Travel niche</label>
        <input
          type="text"
          placeholder="Luxury, family, solo..."
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.niche ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, niche: event.target.value }))
          }
        />
      </div>

      <button
        type="button"
        className="col-span-full flex justify-self-end rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-[11px] font-medium text-[#0a2225] transition hover:bg-[#f7f3ea] sm:w-auto sm:justify-self-end"
        onClick={() => setFilters({ ...defaultFilters })}
      >
        Clear filters
      </button>
    </div>
  );

  const activeFilterCount = [
    filters.followersMin,
    filters.followersMax,
    filters.engagementMin,
    filters.country,
    filters.language,
    filters.niche,
  ].filter((v) => v !== undefined && v !== "").length;

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="container max-w-6xl px-4 pt-4">
        <BackButton label="Back" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-secondary text-2xl font-semibold text-[#0a2225]">Creator Marketplace</h1>
          <p className="mt-1 text-sm text-[#0a2225]/60">
            Discover travel creators and partner with them to bring trips to life through Goldsainte.
          </p>
        </div>

        {/* Control bar — replaces the permanent sidebar with an on-demand panel */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Search by destination, vibe, or handle"
            className="min-w-[220px] flex-1 rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
          />
          {sortControl}
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
              showFilters || activeFilterCount > 0
                ? "border-[#0c4d47] bg-[#0c4d47] text-white"
                : "border-[#E5DFC6] bg-white text-[#0a2225] hover:bg-[#f7f3ea]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white/25 px-1.5 text-[10px]">{activeFilterCount}</span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <button
            type="button"
            className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-xs font-medium text-[#0a2225] transition hover:bg-[#f7f3ea]"
            onClick={() => navigate("/post-trip")}
          >
            Post a trip brief
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-sm">
            {filtersPanel}
          </div>
        )}

        <div className="mt-4 text-xs text-[#0a2225]/60">
          {filteredCreators.length} {filteredCreators.length === 1 ? "match" : "matches"} for your current filters
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-10 text-sm text-[#0a2225]/60">Loading creators…</div>
          ) : filteredCreators.length === 0 ? (
            <div className="py-10 text-sm text-[#0a2225]/60">
              No creators match these filters yet. Try widening your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredCreators.map((creator) => {
                const engagementRate = computeEngagementRate(creator);
                return (
                  <button
                    key={creator.id}
                    type="button"
                    onClick={() => navigate(`/creators/${creator.id}`)}
                    className="group flex flex-col justify-between rounded-2xl border border-[#E5DFC6] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#E5DFC6] bg-[#f7f3ea]">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.displayName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#0a2225]/60">
                            {creator.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-secondary text-sm font-semibold text-[#0a2225]">
                          {creator.displayName}
                        </div>
                        <div className="truncate text-[11px] text-[#0a2225]/60">
                          {creator.tiktokHandle ? `@${creator.tiktokHandle}` : "Creator"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {creator.followers != null && (
                        <span className="rounded-full bg-[#f7f3ea] px-2.5 py-1 text-[#0a2225] slashed-zero tabular-nums">
                          {creator.followers.toLocaleString()} followers
                        </span>
                      )}
                      {engagementRate != null && (
                        <span className="rounded-full bg-[#f7f3ea] px-2.5 py-1 text-[#0a2225]">
                          {engagementRate.toFixed(1)}% engagement
                        </span>
                      )}
                      {(creator.city || creator.country) && (
                        <span className="rounded-full bg-[#f7f3ea] px-2.5 py-1 text-[#0a2225]">
                          {[creator.city, creator.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>

                    {creator.niches.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {creator.niches.slice(0, 2).map((niche) => (
                          <span
                            key={niche}
                            className="rounded-full bg-[#C7A962]/10 px-2 py-1 text-[9.5px] font-medium text-[#0a2225]"
                          >
                            {niche}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-1.5 text-[11px] font-semibold text-white transition group-hover:bg-[#0a3d39]">
                      View profile
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
