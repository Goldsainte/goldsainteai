interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: "creators" | "agents" | "brands" | "trip-requests") => void;
  accountType?: string | null;
}

export function MarketplaceTabs({ activeTab, onTabChange, accountType }: MarketplaceTabsProps) {
  const isTraveler = !accountType || accountType === "traveler";

  // Trip Requests tab only visible to creators, agents, and brands
  const tabs = [
    { id: "creators", label: "Creators" },
    { id: "agents", label: "Agents" },
    { id: "brands", label: "Brands" },
    ...(!isTraveler ? [{ id: "trip-requests", label: "Trip Requests" }] : []),
  ] as const;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as "creators" | "agents" | "brands" | "trip-requests")}
          className={`
            rounded-full px-5 py-2.5 text-sm font-semibold transition-all
            ${
              activeTab === tab.id
                ? "bg-[#BFAD72] text-white shadow-sm"
                : "text-[#4a4a4a] hover:text-[#0a2225]"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
