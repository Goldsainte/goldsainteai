interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Live inventory counts per tab — rendered only when loaded (no fake numbers). */
  counts?: Partial<Record<"trips" | "tours" | "itinerary-guides" | "trip-requests", number>>;
}

/* Segmented control (mockup spec): one white pill container, forest-filled
   active segment, live counts. Replaces the icon+description tab pills. */
export function MarketplaceTabs({ activeTab, onTabChange, counts }: MarketplaceTabsProps) {
  const tabs = [
    { id: "trips", label: "Handpicked Trips", shortLabel: "Trips" },
    { id: "tours", label: "Tours", shortLabel: "Tours" },
    { id: "itinerary-guides", label: "Itinerary Guides", shortLabel: "Guides" },
    { id: "trip-requests", label: "Trip Requests", shortLabel: "Requests" },
  ] as const;

  return (
    /* Mobile: all four tabs visible in a 2×2 grid with short labels —
       no horizontal scrolling to discover categories. Desktop: one pill row. */
    <div
      className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-[#E5DFC6] bg-white p-1 sm:flex sm:w-auto sm:max-w-full sm:items-center sm:rounded-full"
      style={{ fontFamily: "Inter, sans-serif" }}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = activeTab === t.id;
        const n = counts?.[t.id];
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(t.id)}
            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-[13px] transition-colors sm:rounded-full sm:px-4 ${
              active ? "bg-[#0c4d47] font-semibold text-white" : "text-[#6B7280] hover:text-[#0a2225]"
            }`}
          >
            <span className="sm:hidden">{t.shortLabel}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {typeof n === "number" && (
              <span className={active ? "ml-1.5 text-white/70" : "ml-1.5 text-[#9CA3AF]"}>· {n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
