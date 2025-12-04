import { Plane, Users, Briefcase, Building2, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: "trips" | "creators" | "agents" | "brands" | "trip-requests") => void;
  accountType?: string | null;
}

export function MarketplaceTabs({ activeTab, onTabChange, accountType }: MarketplaceTabsProps) {
  const isTraveler = !accountType || accountType === "traveler";

  const tabs = [
    { 
      id: "trips", 
      label: "Ready to Book", 
      shortLabel: "Book", 
      icon: Plane,
      description: "Pre-packaged trips you can book instantly from verified creators & agents"
    },
    { 
      id: "creators", 
      label: "Creators", 
      shortLabel: "Creators", 
      icon: Users,
      description: "Browse travel influencers and content creators for inspiration or collaboration"
    },
    { 
      id: "agents", 
      label: "Agents", 
      shortLabel: "Agents", 
      icon: Briefcase,
      description: "Find verified travel agents who can plan and book your perfect trip"
    },
    { 
      id: "brands", 
      label: "Brands", 
      shortLabel: "Brands", 
      icon: Building2,
      description: "Discover luxury hotels, resorts, and travel brands"
    },
    ...(!isTraveler ? [{ 
      id: "trip-requests", 
      label: "Trip Requests", 
      shortLabel: "Requests", 
      icon: FileText,
      description: "Trip briefs from travelers looking for creators or agents to help plan their journey"
    }] : []),
  ] as const;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex justify-center w-full overflow-x-auto scrollbar-hide">
        <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-[#E5DFC6] bg-white p-0.5 sm:p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTabChange(tab.id as "trips" | "creators" | "agents" | "brands" | "trip-requests")}
                    className={`
                      flex flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 sm:flex-row sm:gap-1.5 sm:px-4 sm:py-2.5 
                      text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation min-h-[44px] min-w-[44px]
                      ${
                        isActive
                          ? "bg-[#BFAD72] text-white shadow-sm"
                          : "text-[#4a4a4a] hover:text-[#0a2225] hover:bg-[#FBF9F0]"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-[220px] text-center bg-white border border-[#E5DFC6] text-[#0a2225]"
                >
                  <p className="text-xs">{tab.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
