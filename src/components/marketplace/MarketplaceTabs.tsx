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
    { id: "trips", label: "Handpicked Trips" },
    { id: "tours", label: "Tours" },
    { id: "itinerary-guides", label: "Itinerary Guides" },
    { id: "trip-requests", label: "Trip Requests" },
  ] as const;

  return (
    <div
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#E5DFC6] bg-white p-1"
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
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] transition-colors ${
              active ? "bg-[#0c4d47] font-semibold text-white" : "text-[#6B7280] hover:text-[#0a2225]"
            }`}
          >
            {t.label}
            {typeof n === "number" && (
              <span className={active ? "ml-1.5 text-white/70" : "ml-1.5 text-[#9CA3AF]"}>· {n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
