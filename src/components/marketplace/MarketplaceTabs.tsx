import { Plane, FileText, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: "trips" | "trip-requests" | "itinerary-guides") => void;
}

export function MarketplaceTabs({ activeTab, onTabChange }: MarketplaceTabsProps) {
  const tabs = [
    { 
      id: "trips", 
      label: "Handpicked Trips", 
      shortLabel: "Handpicked", 
      icon: Plane,
      description: "Pre-packaged trips from verified creators & agents, ready to book instantly"
    },
    { 
      id: "trip-requests", 
      label: "Trip Requests", 
      shortLabel: "Requests", 
      icon: FileText,
      description: "Real travelers looking for a custom trip — review their request and submit your proposal"
    },
    {
      id: "itinerary-guides",
      label: "Itinerary Guides",
      shortLabel: "Guides",
      icon: BookOpen,
      description: "Downloadable and printable day-by-day guides from verified travel creators and specialists"
    },
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
                    onClick={() => onTabChange(tab.id as "trips" | "trip-requests" | "itinerary-guides")}
                    className={`
                      flex flex-row items-center gap-1.5 rounded-full px-4 py-2 sm:py-2.5 
                      text-xs sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation min-h-[44px] min-w-[44px]
                      ${
                        isActive
                          ? "bg-[#BFAD72] text-white shadow-sm"
                          : "text-[#4a4a4a] hover:text-[#0a2225] hover:bg-[#FBF9F0]"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
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
