import { useEffect, useMemo, useRef, useState } from "react";
import { BrandSummary, BrandCard } from "./BrandCard";
import { supabase } from "@/integrations/supabase/client";

interface BrandGridProps {
  brands: BrandSummary[];
}

export function BrandGrid({ brands }: BrandGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => (b.categories ?? []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [brands]);

  const allRegions = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => (b.regions ?? []).forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [brands]);

  const filtered = useMemo(
    () =>
      brands.filter((b) => {
        const text = `${b.name} ${b.bio ?? ""}`.toLowerCase();
        if (search && !text.includes(search.toLowerCase())) return false;

        if (categoryFilter) {
          const cats = (b.categories ?? []).map((c) => c.toLowerCase());
          if (!cats.includes(categoryFilter.toLowerCase())) return false;
        }

        if (regionFilter) {
          const regions = (b.regions ?? []).map((r) => r.toLowerCase());
          if (!regions.includes(regionFilter.toLowerCase())) return false;
        }

        return true;
      }),
    [brands, search, categoryFilter, regionFilter]
  );

  // Track brand discovery - fire once per session when brands are first shown
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current || filtered.length === 0) return;
    hasTrackedRef.current = true;

    // Log first 20 visible brands as "discovered"
    // Session-level deduplication prevents duplicate tracking on page reloads
    filtered.slice(0, 20).forEach((b) => {
      void supabase.rpc("log_brand_engagement", {
        p_brand_profile_id: b.profile_id,
        p_event_type: "discovered",
        p_context_type: "marketplace",
        p_context_id: null,
        p_metadata: {},
      });
    });
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search brands by name or style…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm text-[#0a2225] placeholder:text-[#b3a98a] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
          />

          {/* Category filter */}
          {allCategories.length > 0 && (
            <select
              value={categoryFilter ?? ""}
              onChange={(e) =>
                setCategoryFilter(e.target.value || null)
              }
              className="h-9 rounded-full border border-[#E5DFC6] bg-white px-3 text-xs text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
            >
              <option value="">All categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Region filter */}
          {allRegions.length > 0 && (
            <select
              value={regionFilter ?? ""}
              onChange={(e) =>
                setRegionFilter(e.target.value || null)
              }
              className="h-9 rounded-full border border-[#E5DFC6] bg-white px-3 text-xs text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
            >
              <option value="">All regions</option>
              {allRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>

        {(categoryFilter || regionFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter(null);
              setRegionFilter(null);
            }}
            className="self-start rounded-full border border-[#E5DFC6] px-3 py-1 text-[11px] uppercase tracking-wide text-[#7A7151]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#4a4a4a]">
          No brands match these filters yet. Try adjusting your search or filters.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand) => (
            <BrandCard key={brand.profile_id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
