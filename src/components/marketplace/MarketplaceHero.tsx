import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketplaceHeroProps {
  onSearch: (filters: SearchFilters) => void;
  activeTab?: string;
}

export interface SearchFilters {
  destination: string;
  startDate?: string;
  endDate?: string;
  travelers: number;
}

const quickFilters = [
  "Top Rated",
  "Luxury",
  "Budget Friendly",
  "All-Inclusive",
  "Adventure",
  "Family",
  "Solo Travel",
  "Wellness",
];

export const MarketplaceHero = ({ onSearch, activeTab }: MarketplaceHeroProps) => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = () => {
    onSearch({
      destination,
      startDate,
      endDate,
      travelers,
    });
  };

  const handleQuickFilter = (filter: string) => {
    // For now, just set the destination to the filter
    setDestination(filter);
    onSearch({
      destination: filter,
      travelers,
    });
  };

  return (
    <section className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Discover curated trips & travel experts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Book trips crafted by creators and certified agents, or post your dream trip and let the experts bid to build it.
            </p>
          </div>

          <Button
            size="lg"
            className="mt-2 md:mt-0"
            onClick={() => navigate("/marketplace/request-trip")}
          >
            Post your dream trip
          </Button>
        </div>

        {/* Search Bar */}
        <div className="w-full rounded-2xl border border-border bg-background px-3 py-2 shadow-sm md:px-4 md:py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:divide-x md:divide-border">
            {/* Where */}
            <div className="flex flex-1 flex-col gap-1 px-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Where
              </label>
              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="border-0 bg-transparent pl-6 p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Search destinations or experiences"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
            </div>

            {/* When - Start Date */}
            <div className="flex flex-1 flex-col gap-1 px-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Check-in
              </label>
              <div className="relative">
                <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="border-0 bg-transparent pl-6 p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* When - End Date */}
            <div className="flex flex-1 flex-col gap-1 px-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Check-out
              </label>
              <div className="relative">
                <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="border-0 bg-transparent pl-6 p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {/* Travelers */}
            <div className="flex flex-1 flex-col gap-1 px-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Travelers
              </label>
              <div className="relative">
                <Users className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  className="border-0 bg-transparent pl-6 p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Add guests"
                  value={travelers}
                  onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-center justify-end px-2 pt-1 md:pt-0">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="cursor-pointer px-3 py-1 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleQuickFilter(label)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};
