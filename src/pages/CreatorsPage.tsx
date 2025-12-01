import React, { useEffect, useMemo, useState } from "react";
import { MarketplaceShell } from "@/components/marketplace/MarketplaceShell";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const accountType = ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const showCreatorLabButton = accountType === "creator" || accountType === "agent" || accountType === "brand";

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
      className="rounded-full border px-3 py-1 text-xs"
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
    <div className="space-y-4 text-xs">
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-slate-700">Followers</div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-1/2 rounded-lg border px-2 py-1 text-xs"
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
            className="w-1/2 rounded-lg border px-2 py-1 text-xs"
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

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-700">
          Min engagement rate (%)
        </label>
        <input
          type="number"
          placeholder="e.g. 3"
          className="w-full rounded-lg border px-2 py-1 text-xs"
          value={filters.engagementMin ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              engagementMin: event.target.value ? Number(event.target.value) : undefined,
            }))
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-700">Creator location</label>
        <input
          type="text"
          placeholder="Country or city"
          className="w-full rounded-lg border px-2 py-1 text-xs"
          value={filters.country ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, country: event.target.value }))
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-700">Language</label>
        <input
          type="text"
          placeholder="e.g. English"
          className="w-full rounded-lg border px-2 py-1 text-xs"
          value={filters.language ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, language: event.target.value }))
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-700">Travel niche</label>
        <input
          type="text"
          placeholder="Luxury, family, solo..."
          className="w-full rounded-lg border px-2 py-1 text-xs"
          value={filters.niche ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, niche: event.target.value }))
          }
        />
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-full border px-3 py-1 text-[11px] text-slate-700"
        onClick={() => setFilters({ ...defaultFilters })}
      >
        Clear filters
      </button>
    </div>
  );

  const headerRight = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Search creators by destination, vibe, or handle"
        className="w-full rounded-full border px-4 py-2 text-xs sm:w-64"
        value={filters.search}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, search: event.target.value }))
        }
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full border px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
          onClick={() => navigate("/post-trip")}
        >
          Post a trip brief
        </button>
        {showCreatorLabButton && (
          <button
            type="button"
            className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black"
            onClick={() => navigate("/tiktok-lab")}
          >
            Go to Goldsainte Creator Lab
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-6xl px-4 pt-4">
        <BackButton label="Back" />
      </div>
      <MarketplaceShell
        title="Creator Marketplace"
        subtitle="Discover TikTok travel creators and partner with them to sell trips through Goldsainte."
        filters={filtersPanel}
        headerRight={headerRight}
        resultCount={filteredCreators.length}
        sortControl={sortControl}
      >
      {loading ? (
        <div className="py-10 text-sm text-slate-500">Loading creators…</div>
      ) : filteredCreators.length === 0 ? (
        <div className="py-10 text-sm text-slate-500">
          No creators match these filters yet. Try widening your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCreators.map((creator) => {
            const engagementRate = computeEngagementRate(creator);
            return (
              <button
                key={creator.id}
                type="button"
                onClick={() => navigate(`/creators/${creator.id}`)}
                className="flex flex-col justify-between rounded-2xl border bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                    {creator.avatarUrl ? (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {creator.displayName}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {creator.tiktokHandle ? `@${creator.tiktokHandle}` : "TikTok creator"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {creator.followers != null && (
                    <span className="rounded-full bg-slate-50 px-2 py-1">
                      {creator.followers.toLocaleString()} followers
                    </span>
                  )}
                  {engagementRate != null && (
                    <span className="rounded-full bg-slate-50 px-2 py-1">
                      {engagementRate.toFixed(1)}% engagement
                    </span>
                  )}
                  {(creator.city || creator.country) && (
                    <span className="rounded-full bg-slate-50 px-2 py-1">
                      {[creator.city, creator.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {creator.niches.slice(0, 3).map((niche) => (
                    <span
                      key={niche}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800"
                    >
                      {niche}
                    </span>
                  ))}
                </div>

                {creator.languages.length > 0 && (
                  <div className="mt-3 text-[10px] text-slate-500">
                    Languages: {creator.languages.join(", ")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      </MarketplaceShell>
    </div>
  );
}
