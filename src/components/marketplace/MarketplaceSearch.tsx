import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Users, Minus, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { MobileDatePicker } from "@/components/MobileDatePicker";
import { useDestinationSuggestions } from "@/hooks/useDestinationSuggestions";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceSearchProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
  onClearFilters?: () => void;
}

export function MarketplaceSearch({ onSearch, filters, onClearFilters }: MarketplaceSearchProps) {
  const [destination, setDestination] = useState(filters.destination || "");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (filters.startDate || filters.endDate) {
      return {
        from: filters.startDate ? new Date(filters.startDate + "T00:00:00") : undefined,
        to: filters.endDate ? new Date(filters.endDate + "T00:00:00") : undefined,
      };
    }
    return undefined;
  });
  const [travelers, setTravelers] = useState(filters.travelers || 1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // TrovaTrip-style accordion: desktop search rests as a compact pill and
  // expands into the full field bar on click. Sticky so it travels with
  // the scroll like a real header search.
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileSuggestionsRef = useRef<HTMLDivElement>(null);

  const { data: allDestinations = [] } = useDestinationSuggestions();

  const filteredSuggestions = useMemo(() => {
    if (!destination.trim()) return allDestinations.slice(0, 8);
    const q = destination.toLowerCase();
    return allDestinations
      .filter((d) => d.toLowerCase().includes(q))
      .slice(0, 8);
  }, [destination, allDestinations]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        (!mobileSuggestionsRef.current || !mobileSuggestionsRef.current.contains(e.target as Node)) &&
        (!mobileInputRef.current || !mobileInputRef.current.contains(e.target as Node))
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Collapse the desktop accordion on outside click or Escape.
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    // "click", not "mousedown" — see MarketplaceFilters: mousedown-close
    // swallows the click the user was making outside the bar.
    document.addEventListener("click", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const selectSuggestion = (value: string) => {
    setDestination(value);
    setShowSuggestions(false);
  };

  // Sync local state when external filters change (e.g. URL restore)
  useEffect(() => {
    setDestination(filters.destination || "");
    setTravelers(filters.travelers || 1);
    if (filters.startDate || filters.endDate) {
      setDateRange({
        from: filters.startDate ? new Date(filters.startDate + "T00:00:00") : undefined,
        to: filters.endDate ? new Date(filters.endDate + "T00:00:00") : undefined,
      });
    } else {
      setDateRange(undefined);
    }
  }, [filters.destination, filters.startDate, filters.endDate, filters.travelers]);

  const handleSearch = () => {
    setExpanded(false);
    onSearch({
      destination: destination.trim(),
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      travelers,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // If clearing from, also clear to
    if (!range?.from) {
      setDateRange(undefined);
    }
  };

  const hasActiveFilters = !!(
    filters.destination ||
    filters.startDate ||
    filters.endDate ||
    (filters.travelers && filters.travelers > 1)
  );

  const handleRemoveFilter = (key: "destination" | "dates" | "travelers") => {
    const updated = { ...filters };
    if (key === "destination") {
      updated.destination = "";
      setDestination("");
    } else if (key === "dates") {
      updated.startDate = undefined;
      updated.endDate = undefined;
      setDateRange(undefined);
    } else if (key === "travelers") {
      updated.travelers = 1;
      setTravelers(1);
    }
    onSearch(updated);
  };

  // Summary text for mobile collapsed state
  const getSummaryText = () => {
    const parts: string[] = [];
    if (destination) parts.push(destination);
    else parts.push("Anywhere");

    if (dateRange?.from) {
      const fromStr = format(dateRange.from, "MMM d");
      const toStr = dateRange.to ? format(dateRange.to, "MMM d") : "";
      parts.push(toStr ? `${fromStr}–${toStr}` : fromStr);
    } else {
      parts.push("Any dates");
    }

    parts.push(`${travelers} traveler${travelers > 1 ? "s" : ""}`);
    return parts.join(" · ");
  };

  const dateDisplayText = () => {
    if (dateRange?.from) {
      const fromStr = format(dateRange.from, "MMM d");
      if (dateRange.to) return `${fromStr} – ${format(dateRange.to, "MMM d")}`;
      return fromStr;
    }
    return "";
  };

  // Traveler stepper component
  const TravelerStepper = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTravelers(Math.max(1, travelers - 1))}
        disabled={travelers <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition hover:border-[#BFAD72] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`min-w-[2ch] text-center text-sm font-medium text-[#0a2225] ${compact ? "" : "tabular-nums"}`}>
        {travelers}
      </span>
      <button
        type="button"
        onClick={() => setTravelers(Math.min(20, travelers + 1))}
        disabled={travelers >= 20}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition hover:border-[#BFAD72] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="sticky top-0 z-40 border-b border-[#E5DFC6]/30 bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-6">
        {/* Desktop collapsed pill — expands into the full bar */}
        {!expanded && (
          <div className="hidden md:flex justify-center">
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
                // Focus the destination field once the bar mounts.
                setTimeout(() => inputRef.current?.focus(), 30);
              }}
              className="group flex items-center gap-3 rounded-full border border-[#E5DFC6] bg-white pl-5 pr-2 py-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-sm text-[#0a2225] font-medium">
                {getSummaryText()}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BFAD72] group-hover:bg-[#9d8f5d] transition-colors">
                <Search className="h-4 w-4 text-white" />
              </span>
            </button>
          </div>
        )}

        {/* Desktop search bar (expanded) */}
        <div className={`${expanded ? "md:flex" : ""} hidden md:items-center md:divide-x md:divide-[#E5DFC6]/30 gap-3 rounded-2xl border border-[#E5DFC6] bg-white p-3 shadow-sm`}>
          {/* Where */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Where
            </label>
            <div className="relative min-w-0">
              <MapPin className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
              <Input
                ref={inputRef}
                className="w-full truncate border-0 bg-transparent p-0 pl-6 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowSuggestions(false);
                    handleSearch();
                  }
                }}
              />
              {/* Autocomplete dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#E5DFC6] bg-white py-1 shadow-lg"
                >
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#0a2225] transition hover:bg-[#FBF9F0]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(s)}
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#BFAD72]" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates — using MobileDatePicker in range mode */}
          <div className="flex flex-1 flex-col gap-1.5 px-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Dates
            </label>
            <MobileDatePicker
              mode="range"
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              placeholder="Check-in – Check-out"
              className="border-0 bg-transparent p-0 pl-0 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 h-auto rounded-none shadow-none hover:bg-transparent"
            />
          </div>

          {/* Travelers */}
          <div className="flex flex-1 flex-col gap-1.5 px-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
              Travelers
            </label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#8D8D8D]" />
              <TravelerStepper />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center px-3 pt-1 md:pt-0">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-[#BFAD72] hover:bg-[#9d8f5d] shadow-sm"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile: always-open stacked search */}
        <div className="md:hidden">
          <div className="rounded-2xl border border-[#E5DFC6] bg-white p-4 shadow-sm space-y-4">
              {/* Where */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Where
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                  <Input
                    ref={mobileInputRef}
                    className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div
                      ref={mobileSuggestionsRef}
                      className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-[#E5DFC6] bg-white py-1 shadow-lg"
                    >
                      {filteredSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#0a2225] transition hover:bg-[#FBF9F0]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(s)}
                        >
                          <MapPin className="h-3.5 w-3.5 text-[#BFAD72]" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Dates
                </label>
                <MobileDatePicker
                  mode="range"
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Check-in – Check-out"
                  className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] text-sm text-[#0a2225] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                />
              </div>

              {/* Travelers */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Travelers
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-[#E5DFC6] bg-[#FBF9F0] px-4 py-2.5">
                  <Users className="h-4 w-4 text-[#8D8D8D]" />
                  <span className="flex-1 text-sm text-[#0a2225]">
                    {travelers} traveler{travelers > 1 ? "s" : ""}
                  </span>
                  <TravelerStepper compact />
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
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.destination && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-[#FBF9F0] px-3 py-1 text-xs text-[#0a2225]">
                <MapPin className="h-3 w-3 text-[#8D8D8D]" />
                {filters.destination}
                <button onClick={() => handleRemoveFilter("destination")} className="ml-0.5 hover:text-[#BFAD72]">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-[#FBF9F0] px-3 py-1 text-xs text-[#0a2225]">
                <CalendarIcon className="h-3 w-3 text-[#8D8D8D]" />
                {filters.startDate && format(new Date(filters.startDate + "T00:00:00"), "MMM d")}
                {filters.startDate && filters.endDate && "–"}
                {filters.endDate && format(new Date(filters.endDate + "T00:00:00"), "MMM d")}
                <button onClick={() => handleRemoveFilter("dates")} className="ml-0.5 hover:text-[#BFAD72]">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.travelers && filters.travelers > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-[#FBF9F0] px-3 py-1 text-xs text-[#0a2225]">
                <Users className="h-3 w-3 text-[#8D8D8D]" />
                {filters.travelers} travelers
                <button onClick={() => handleRemoveFilter("travelers")} className="ml-0.5 hover:text-[#BFAD72]">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="text-xs font-medium text-[#BFAD72] hover:text-[#9d8f5d] transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
