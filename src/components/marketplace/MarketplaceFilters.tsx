import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  /** Quick destination chips derived from live inventory — never hardcoded. */
  destinationOptions?: string[];
}

type PanelKey = "destination" | "duration" | "price" | "sort" | null;

/* GetYourGuide-style filter rail (mockup spec): four direct buttons, each
   opening its own small popover — fewer clicks than one buried panel, and
   the buttons themselves show the active selection. Every control filters
   real columns; outside-close attaches on the next tick (production React
   flushes effects before the opening click finishes bubbling — the same-
   click-collapse bug we shipped once and won't ship twice). */
export function MarketplaceFilters({ filters, onFilterChange, destinationOptions = [] }: MarketplaceFiltersProps) {
  const [open, setOpen] = useState<PanelKey>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 10000,
  ]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (target && !target.isConnected) return;
      if (wrapRef.current && target && !wrapRef.current.contains(target)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const t = window.setTimeout(() => {
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const priceActive = (filters.minPrice ?? 0) > 0 || (filters.maxPrice ?? 10000) < 10000;
  const sortLabels: Record<string, string> = {
    newest: "Newest",
    "top-rated": "Most popular",
    "price-low": "Price: Low",
    "price-high": "Price: High",
  };

  const btn = (key: PanelKey, label: string, active: boolean) => (
    <button
      type="button"
      onClick={() => setOpen(open === key ? null : key)}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] transition-colors ${
        active
          ? "border-[#0c4d47] bg-[#0c4d47]/5 font-medium text-[#0c4d47]"
          : "border-[#E5DFC6] bg-white text-[#0a2225] hover:bg-[#FBF9F0]"
      } ${open === key ? "bg-[#FBF9F0]" : ""}`}
    >
      {key === "sort" && <ArrowUpDown className="h-3.5 w-3.5" />}
      {label}
      {key !== "sort" && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open === key ? "rotate-180" : ""}`} />}
    </button>
  );

  const chip = (isActive: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
      isActive ? "bg-[#0c4d47] text-white" : "border border-[#E5DFC6] bg-white text-[#4a4a4a] hover:bg-[#FBF9F0]"
    }`;

  const panelCls =
    "absolute right-0 top-[calc(100%+6px)] z-50 min-w-[280px] rounded-2xl border border-[#E5DFC6] bg-white px-5 py-4 shadow-lg";

  return (
    <div className="relative flex items-center gap-2" ref={wrapRef} style={{ fontFamily: "Inter, sans-serif" }}>
      {destinationOptions.length > 0 &&
        btn("destination", filters.destination ? filters.destination : "Destination", Boolean(filters.destination))}
      {btn("duration", filters.durationBucket ? `${filters.durationBucket} days` : "Duration", Boolean(filters.durationBucket))}
      {btn(
        "price",
        priceActive ? `$${(filters.minPrice ?? 0).toLocaleString()}–$${(filters.maxPrice ?? 10000).toLocaleString()}` : "Price",
        priceActive
      )}
      {btn("sort", sortLabels[filters.sortBy ?? "newest"], false)}

      {open === "destination" && (
        <div className={panelCls}>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">Destinations</p>
          <div className="flex max-w-[320px] flex-wrap gap-2">
            {destinationOptions.map((city) => {
              const isActive = (filters.destination || "").toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onFilterChange({ ...filters, destination: isActive ? "" : city });
                    setOpen(null);
                  }}
                  className={chip(isActive)}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open === "duration" && (
        <div className={panelCls}>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">Duration</p>
          <div className="flex gap-2">
            {(["1-3", "4-6", "7+"] as const).map((b) => {
              const isActive = filters.durationBucket === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onFilterChange({ ...filters, durationBucket: isActive ? undefined : b });
                    setOpen(null);
                  }}
                  className={chip(isActive)}
                >
                  {b} days
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open === "price" && (
        <div className={panelCls}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">Price range</p>
            <span className="text-xs tabular-nums text-[#0a2225]">
              ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
              {priceRange[1] >= 10000 ? "+" : ""}
            </span>
          </div>
          <SliderPrimitive.Root
            min={0}
            max={10000}
            step={100}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            onValueCommit={(v) => onFilterChange({ ...filters, minPrice: v[0], maxPrice: v[1] })}
            className="relative flex w-64 touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#E5DFC6]">
              <SliderPrimitive.Range className="absolute h-full bg-[#BFAD72]" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-[#BFAD72] bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFAD72]" />
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-[#BFAD72] bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFAD72]" />
          </SliderPrimitive.Root>
          {priceActive && (
            <button
              type="button"
              onClick={() => {
                setPriceRange([0, 10000]);
                onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined });
                setOpen(null);
              }}
              className="mt-3 text-xs font-medium text-[#BFAD72] hover:underline"
            >
              Clear price
            </button>
          )}
        </div>
      )}

      {open === "sort" && (
        <div className={panelCls} style={{ minWidth: 200 }}>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">Sort by</p>
          <div className="flex flex-col gap-1">
            {(Object.keys(sortLabels) as (keyof typeof sortLabels)[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onFilterChange({ ...filters, sortBy: v as SearchFilters["sortBy"] });
                  setOpen(null);
                }}
                className={`rounded-lg px-3 py-2 text-left text-[13px] ${
                  (filters.sortBy ?? "newest") === v ? "bg-[#FBF4E2] font-medium text-[#0a2225]" : "text-[#4a4a4a] hover:bg-[#FBF9F0]"
                }`}
              >
                {sortLabels[v]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
