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
    { id: "trips", label: "Live Trips", shortLabel: "Trips", icon: Plane },
    { id: "creators", label: "Creators", shortLabel: "Creators", icon: Users },
    { id: "agents", label: "Agents", shortLabel: "Agents", icon: Briefcase },
    { id: "brands", label: "Brands", shortLabel: "Brands", icon: Building2 },
    ...(!isTraveler ? [{ id: "trip-requests", label: "Trip Requests", shortLabel: "Requests", icon: FileText }] : []),
  ] as const;

  return (
    <div className="overflow-x-auto scrollbar-hide max-w-full -mx-4 px-4 md:mx-0 md:px-0">
      <div className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-white p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as "trips" | "creators" | "agents" | "brands" | "trip-requests")}
              className={`
                flex flex-col items-center gap-0.5 rounded-full px-3 py-2 sm:flex-row sm:gap-1.5 sm:px-4 sm:py-2.5 
                text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation min-h-[44px] min-w-[44px]
                ${
                  isActive
                    ? "bg-[#BFAD72] text-white shadow-sm"
                    : "text-[#4a4a4a] hover:text-[#0a2225] hover:bg-[#FBF9F0]"
                }
              `}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {/* Show short label on mobile, full on desktop */}
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
