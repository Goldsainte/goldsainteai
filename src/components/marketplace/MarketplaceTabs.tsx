import { Plane, Users, Briefcase, Building2, FileText } from "lucide-react";

interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: "trips" | "creators" | "agents" | "brands" | "trip-requests") => void;
  accountType?: string | null;
}

export function MarketplaceTabs({ activeTab, onTabChange, accountType }: MarketplaceTabsProps) {
  const isTraveler = !accountType || accountType === "traveler";

  // Trip Requests tab only visible to creators, agents, and brands
  const tabs = [
    { id: "trips", label: "Live Trips", icon: Plane },
    { id: "creators", label: "Creators", icon: Users },
    { id: "agents", label: "Agents", icon: Briefcase },
    { id: "brands", label: "Brands", icon: Building2 },
    ...(!isTraveler ? [{ id: "trip-requests", label: "Trip Requests", icon: FileText }] : []),
  ] as const;

  return (
    <div className="overflow-x-auto scrollbar-hide max-w-full">
      <div className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-white p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as "trips" | "creators" | "agents" | "brands" | "trip-requests")}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation min-h-[40px]
                ${
                  activeTab === tab.id
                    ? "bg-[#BFAD72] text-white shadow-sm"
                    : "text-[#4a4a4a] hover:text-[#0a2225]"
                }
              `}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
