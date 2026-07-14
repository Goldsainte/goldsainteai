import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Users, Minus, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { FilterChip } from "@/components/ui/FilterChip";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { MobileDatePicker } from "@/components/MobileDatePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDestinationSuggestions } from "@/hooks/useDestinationSuggestions";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceSearchProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
  onClearFilters?: () => void;
  /** Render without the section background / outer padding, for embedding
      inside another hero (e.g. the homepage). Bar itself is identical. */
  embedded?: boolean;
}

export function MarketplaceSearch({ onSearch, filters, onClearFilters, embedded = false }: MarketplaceSearchProps) {
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
  // Mobile: Airbnb-style collapsed pill that expands into the full card.
  const [mobileOpen, setMobileOpen] = useState(false);
  // Airbnb-style guest breakdown (embedded popover). Adults + children are
  // the "travelers" the marketplace filters on; infants and pets don't count
  // toward capacity (Airbnb semantics) but are carried in the search.
  const [adults, setAdults] = useState(Math.max(1, filters.travelers || 1));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const setGuests = (nextAdults: number, nextChildren: number) => {
    setAdults(nextAdults);
    setChildren(nextChildren);
    setTravelers(nextAdults + nextChildren);
  };
  const [showSuggestions, setShowSuggestions] = useState(false);
  // TrovaTrip-style accordion: desktop search rests as a compact pill and
  // expands into the full field bar on click. Sticky so it travels with
  // the scroll like a real header search.
  const [expanded, setExpanded] = useState(true);
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
      // The click that OPENED the accordion unmounts the pill; in production
      // builds React attaches this listener before that same native click
      // finishes bubbling, so the detached pill reads as "outside" and the
      // bar collapsed in the same click ("nothing happens"). Ignore detached
      // targets and attach on the next tick so the opening click never counts.
      const target = e.target as Node | null;
      if (target && !target.isConnected) return;
      if (sectionRef.current && target && !sectionRef.current.contains(target)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    // "click", not "mousedown" — see MarketplaceFilters: mousedown-close
    // swallows the click the user was making outside the bar.
    const attach = window.setTimeout(() => {
      document.addEventListener("click", onDown);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(attach);
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
    setMobileOpen(false);
    onSearch({
      destination: destination.trim(),
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      travelers,
      infants: infants > 0 ? infants : undefined,
      pets: pets > 0 ? pets : undefined,
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
  const GuestRow = ({
    title,
    subtitle,
    subtitleUnderlined = false,
    value,
    onDecrement,
    onIncrement,
    decrementDisabled,
    incrementDisabled,
    last = false,
  }: {
    title: string;
    subtitle: string;
    subtitleUnderlined?: boolean;
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
    decrementDisabled: boolean;
    incrementDisabled: boolean;
    last?: boolean;
  }) => (
    <div className={`flex items-center justify-between py-4 first:pt-0 ${last ? "pb-0" : "border-b border-[#E5DFC6]/60"}`}>
      <div>
        <p className="text-[15px] font-medium leading-tight text-[#0a2225]">{title}</p>
        <p className={`mt-0.5 text-[13px] text-[#8D8D8D] ${subtitleUnderlined ? "underline underline-offset-2 decoration-[#8D8D8D]/60" : ""}`}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={decrementDisabled}
          aria-label={`Decrease ${title.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition hover:border-[#BFAD72] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[2ch] text-center text-sm font-medium tabular-nums text-[#0a2225]">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={incrementDisabled}
          aria-label={`Increase ${title.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225] transition hover:border-[#BFAD72] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

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
      className={embedded ? "" : "bg-gradient-to-b from-[#FDF9F0] to-[#FDF9F0]"}
    >
      <div className={embedded ? "mx-auto max-w-4xl" : "mx-auto max-w-4xl px-4 py-4 md:py-6"}>
        {/* Desktop search bar — the hero centerpiece (mockup spec) */}
        <div className="searchbar-slim mx-auto hidden max-w-[780px] md:flex md:items-stretch md:divide-x md:divide-[#E5DFC6]/40 rounded-full border border-[#E5DFC6] bg-white py-3 pl-1 pr-2 shadow-[0_6px_24px_rgba(10,34,37,0.07)]">
          {/* Where */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-6">
            <label className="block text-[13px] font-semibold leading-[16px] text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
              Where
            </label>
            <div className="relative flex h-[18px] min-w-0 items-center">
              <Input
                ref={inputRef}
                className="h-[18px] w-full truncate border-0 bg-transparent text-sm leading-[18px] text-[#0a2225] placeholder:text-[#6B7280] focus-visible:ring-0 focus-visible:ring-offset-0" style={{ fontFamily: "Inter, sans-serif", padding: 0 }}
                placeholder="Search destinations"
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
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-6">
            <label className="block text-[13px] font-semibold leading-[16px] text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
              When
            </label>
            <div className="flex h-[18px] min-w-0 items-center [&>*]:min-w-0 [&_button]:truncate [&_svg]:hidden" style={{ fontFamily: "Inter, sans-serif" }}>
              <MobileDatePicker
                mode="range"
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                placeholder="Add dates"
                className={`border-0 bg-transparent p-0 pl-0 text-sm ${dateRange?.from ? "text-[#0a2225]" : "text-[#6B7280]"} focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 h-auto rounded-none shadow-none hover:bg-transparent`}
              />
            </div>
          </div>

          {/* Who — Airbnb-style text trigger opening the guest-stepper popover,
              in BOTH modes (Airbnb's bar has no inline stepper). */}
          {true ? (
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-6">
              <label className="block text-[13px] font-semibold leading-[16px] text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
                Who
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`flex h-[18px] min-h-0 items-center text-sm leading-[18px] whitespace-nowrap ${travelers > 1 ? "text-[#0a2225]" : "text-[#6B7280]"}`} style={{ fontFamily: "Inter, sans-serif" }}
                    aria-label="Set number of travelers"
                  >
                    <span>{travelers > 1 ? `${travelers} guests` : "Add guests"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={10} className="w-[340px] rounded-2xl border-[#E5DFC6] bg-white p-5 shadow-lg">
                  <GuestRow
                    title="Adults"
                    subtitle="Ages 13 or above"
                    value={adults}
                    onDecrement={() => setGuests(Math.max(1, adults - 1), children)}
                    onIncrement={() => setGuests(adults + 1, children)}
                    decrementDisabled={adults <= 1}
                    incrementDisabled={adults + children >= 20}
                  />
                  <GuestRow
                    title="Children"
                    subtitle="Ages 2 – 12"
                    value={children}
                    onDecrement={() => setGuests(adults, Math.max(0, children - 1))}
                    onIncrement={() => setGuests(adults, children + 1)}
                    decrementDisabled={children <= 0}
                    incrementDisabled={adults + children >= 20}
                  />
                  <GuestRow
                    title="Infants"
                    subtitle="Under 2"
                    value={infants}
                    onDecrement={() => setInfants(Math.max(0, infants - 1))}
                    onIncrement={() => setInfants(Math.min(5, infants + 1))}
                    decrementDisabled={infants <= 0}
                    incrementDisabled={infants >= 5}
                  />
                  <GuestRow
                    title="Pets"
                    subtitle="Bringing a service animal?"
                    subtitleUnderlined
                    value={pets}
                    onDecrement={() => setPets(Math.max(0, pets - 1))}
                    onIncrement={() => setPets(Math.min(5, pets + 1))}
                    decrementDisabled={pets <= 0}
                    incrementDisabled={pets >= 5}
                    last
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-0.5 px-5">
              <label className="block text-[13px] font-semibold leading-[16px] text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
                Who
              </label>
              <div className="flex h-9 items-center gap-2">
                <Users className="h-4 w-4 text-[#8D8D8D]" />
                <TravelerStepper />
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className={embedded ? "flex items-center px-2 pt-1 md:pt-0" : "flex items-center px-3 pt-1 md:pt-0"}>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-[#BFAD72] hover:bg-[#9d8f5d] shadow-sm"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile: always-open stacked search */}
        <div className="md:hidden">
          {!mobileOpen ? (
            /* Airbnb mobile pill: magnifier + bold "Where to?" + gray summary.
               Tapping expands the full search card below. */
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open search"
              className="flex w-full items-center gap-3 rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-left shadow-[0_3px_12px_rgba(10,34,37,0.08)]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Search className="h-4 w-4 flex-none text-[#0a2225]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-[#0a2225]">
                  {destination.trim() || "Where to?"}
                </span>
                <span className="block truncate text-[12px] text-[#6B7280]">
                  {[
                    destination.trim() ? null : "Anywhere",
                    dateRange?.from
                      ? `${format(dateRange.from, "MMM d")}${dateRange.to ? ` – ${format(dateRange.to, "MMM d")}` : ""}`
                      : "Any dates",
                    travelers > 1 ? `${travelers} guests` : "Add guests",
                  ].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          ) : (
          <div className="rounded-2xl border border-[#E5DFC6] bg-white p-4 shadow-sm space-y-4">
              {/* Card header with close */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#0a2225]" style={{ fontFamily: "Inter, sans-serif" }}>
                  Search
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close search"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5DFC6] text-[#0a2225]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Where */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8D8D8D]">
                  Where
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D8D8D]" />
                  <Input
                    ref={mobileInputRef}
                    className="w-full rounded-xl border-[#E5DFC6] bg-[#FBF9F0] pl-10 sm:pl-10 text-sm text-[#0a2225] placeholder:text-[#8D8D8D] focus:border-[#BFAD72] focus:ring-[#BFAD72]"
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      // Mobile keyboards have a return/go key — make it search,
                      // same as the desktop field.
                      if (e.key === "Enter") {
                        setShowSuggestions(false);
                        handleSearch();
                      }
                    }}
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
                  When
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
                  Who
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
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.destination && (
              <FilterChip
                icon={<MapPin />}
                removeLabel="Remove destination filter"
                onRemove={() => handleRemoveFilter("destination")}
              >
                {filters.destination}
              </FilterChip>
            )}
            {(filters.startDate || filters.endDate) && (
              <FilterChip
                icon={<CalendarIcon />}
                removeLabel="Remove date filter"
                onRemove={() => handleRemoveFilter("dates")}
              >
                {filters.startDate && format(new Date(filters.startDate + "T00:00:00"), "MMM d")}
                {filters.startDate && filters.endDate && "–"}
                {filters.endDate && format(new Date(filters.endDate + "T00:00:00"), "MMM d")}
              </FilterChip>
            )}
            {filters.travelers && filters.travelers > 1 && (
              <FilterChip
                icon={<Users />}
                removeLabel="Remove travelers filter"
                onRemove={() => handleRemoveFilter("travelers")}
              >
                {filters.travelers} travelers
              </FilterChip>
            )}
            <button
              onClick={onClearFilters}
              className="ml-1 text-[13px] font-medium text-[#0a2225]/60 underline underline-offset-4 decoration-[#0a2225]/25 transition-colors hover:text-[#0a2225]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
