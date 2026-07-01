import { useRef, useState, useEffect } from "react";
import { Plane, FileText, BookOpen, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketplaceTabsProps {
  activeTab: string;
  onTabChange: (tab: "trips" | "trip-requests" | "itinerary-guides" | "bundles") => void;
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
    {
      id: "bundles",
      label: "Bundles",
      shortLabel: "Bundles",
      icon: Layers,
      description: "Curated multi-product bundles — a trip plus matching guides at a reduced price",
    },
  ] as const;

  // Scroll-position-aware fade hints, matching CategoryChips' pattern —
  // this row can be wider than the screen on mobile, and the plain
  // overflow-x-auto with no visual cue made a scrollable row look like a
  // broken/cut-off layout.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative w-full">
        {/* Left fade hint */}
        <div
          className={`pointer-events-none absolute left-0 top-0 h-full w-8 z-10 transition-opacity duration-200 bg-gradient-to-r from-[#FDF9F0] to-transparent md:hidden ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Right fade hint */}
        <div
          className={`pointer-events-none absolute right-0 top-0 h-full w-10 z-10 transition-opacity duration-200 bg-gradient-to-l from-[#FDF9F0] to-transparent md:hidden ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />
        <div ref={scrollRef} className="flex justify-start md:justify-start w-full overflow-x-auto scrollbar-hide">
          <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-[#E5DFC6] bg-white p-0.5 sm:p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        onTabChange(
                          tab.id as "trips" | "trip-requests" | "itinerary-guides" | "bundles"
                        )
                      }
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
      </div>
    </TooltipProvider>
  );
}
