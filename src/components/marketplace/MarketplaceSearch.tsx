import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Search, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceSearchProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
}

export function MarketplaceSearch({ onSearch, filters }: MarketplaceSearchProps) {
  const [destination, setDestination] = useState(filters.destination || "");
  const [startDate, setStartDate] = useState(filters.startDate || "");
  const [endDate, setEndDate] = useState(filters.endDate || "");
  const [travelers, setTravelers] = useState(filters.travelers || 1);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      destination,
      startDate,
      endDate,
      travelers,
    });
    setIsOpen(false);
  };

  // Build summary text for collapsed state
  const getSummaryText = () => {
    const parts: string[] = [];
    if (destination) parts.push(destination);
    else parts.push("Anywhere");
    
    if (startDate) {
      const date = new Date(startDate);
      parts.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    } else {
      parts.push("Any dates");
    }
    
    parts.push(`${travelers} traveler${travelers > 1 ? "s" : ""}`);
    
    return parts.join(" · ");
  };

  return (
    <section className="border-b border-[#E5DFC6]/30 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-6">
        {/* Desktop: Full search form */}
        <div className="hidden md:flex flex-col gap-4 rounded-2xl border border-[#E5DFC6] bg-white p-3 shadow-sm md:flex-row md:items-center md:divide-x md:divide-[#E5DFC6]/30">
          {/* Where */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Where
            </label>
            <div className="relative min-w-0">
              <MapPin className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
              <Input
                className="w-full truncate border-0 bg-transparent p-0 pl-6 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Search destinations..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
          </div>

          {/* Check-in */}
          <div className="flex flex-1 flex-col gap-1.5 px-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
              <Input
                type="date"
                className="border-0 bg-transparent p-0 pl-6 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Check-out */}
          <div className="flex flex-1 flex-col gap-1.5 px-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
              <Input
                type="date"
                className="border-0 bg-transparent p-0 pl-6 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Travelers */}
          <div className="flex flex-1 flex-col gap-1.5 px-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Travelers
            </label>
            <div className="relative">
              <Users className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
              <Input
                type="number"
                min="1"
                className="border-0 bg-transparent p-0 pl-6 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Add guests"
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center px-3 pt-1 md:pt-0">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-[#BFAD72] hover:bg-[#9d8f5d]"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile: Collapsible search pill */}
        <div className="md:hidden">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between gap-3 rounded-full border border-[#E5DFC6] bg-white px-4 py-3 shadow-sm transition hover:border-[#BFAD72] active:scale-[0.99]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BFAD72]">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#0a2225] truncate">
                    {getSummaryText()}
                  </span>
                </div>
                <ChevronDown className={`h-5 w-5 text-[#8D8D8D] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 rounded-2xl border border-[#E5DFC6] bg-white p-4 shadow-sm space-y-4">
              {/* Where */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Where
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                  <Input
                    className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                    placeholder="Search destinations..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                    <Input
                      type="date"
                      className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 text-sm text-[#0a2225] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                    <Input
                      type="date"
                      className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 text-sm text-[#0a2225] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>
              </div>

              {/* Travelers */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Travelers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                  <Input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 text-sm text-[#0a2225] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                    placeholder="Add guests"
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Search button */}
              <Button
                className="w-full rounded-full bg-[#BFAD72] py-6 text-sm font-semibold text-white hover:bg-[#9d8f5d]"
                onClick={handleSearch}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
