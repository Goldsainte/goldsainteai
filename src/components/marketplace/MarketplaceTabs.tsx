import { Map, Ticket, BookOpen, PenLine } from "lucide-react";

interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** DEPRECATED Jul 10 — accepted for compatibility but never rendered.
   *  Inventory counts are deliberately not shown on the marketplace. */
  counts?: Partial<Record<"trips" | "tours" | "itinerary-guides" | "trip-requests", number>>;
}

/* Desktop: segmented pill control (mockup spec). Mobile: Airbnb-style
   category row — icon above a small label, active tab underlined,
   horizontally scrollable. */
export function MarketplaceTabs({ activeTab, onTabChange, counts }: MarketplaceTabsProps) {
  const tabs = [
    { id: "trips", label: "Handpicked Trips", shortLabel: "Trips", Icon: Map },
    { id: "tours", label: "Tours", shortLabel: "Tours", Icon: Ticket },
    { id: "itinerary-guides", label: "Itinerary Guides", shortLabel: "Guides", Icon: BookOpen },
    { id: "trip-requests", label: "Trip Requests", shortLabel: "Requests", Icon: PenLine },
  ] as const;

  return (
    <>
      {/* ---- Mobile: Airbnb category row ---- */}
      <div
        className="grid w-full grid-cols-4 border-b border-[#E5DFC6] sm:hidden"
        style={{ fontFamily: "Inter, sans-serif" }}
        role="tablist"
      >
        {tabs.map(({ id, shortLabel, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-end gap-1 pb-2.5 pt-1 transition-colors ${
                active
                  ? "border-b-2 border-[#0c4d47] text-[#0a2225]"
                  : "border-b-2 border-transparent text-[#6B7280]"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[#0c4d47]" : "text-[#8D8D8D]"}`} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`whitespace-nowrap text-[12px] ${active ? "font-semibold" : "font-medium"}`}>
                {shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Desktop: segmented pill (unchanged) ---- */}
      <div
        className="hidden sm:flex w-auto max-w-full items-center rounded-full border border-[#E5DFC6] bg-white p-1"
        style={{ fontFamily: "Inter, sans-serif" }}
        role="tablist"
      >
        {tabs.map(({ id, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-center text-[13px] transition-colors ${
                active ? "bg-[#0c4d47] font-semibold text-white" : "text-[#6B7280] hover:text-[#0a2225]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
