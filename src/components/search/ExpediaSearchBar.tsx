import { useState } from "react";
import { redirectToExpedia } from "@/lib/expedia";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export default function ExpediaSearchBar() {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<string|undefined>();
  const [checkOut, setCheckOut] = useState<string|undefined>();
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setCheckIn(format(range.from, "yyyy-MM-dd"));
    } else {
      setCheckIn(undefined);
    }
    if (range?.to) {
      setCheckOut(format(range.to, "yyyy-MM-dd"));
    } else {
      setCheckOut(undefined);
    }
  };

  const onSearch = () => {
    try {
      redirectToExpedia({
        destination,
        // only pass dates if chosen – otherwise Expedia will show date picker
        checkIn,
        checkOut,
        adults,
        children,
      });
    } catch (e:any) {
      console.error(e?.message ?? e);
    }
  };

  return (
    <div
      className="gs-pill header-search-font"
      role="search"
      aria-label="Hotel search"
    >
      {/* WHERE */}
      <div className="gs-cell">
        <div className="gs-label">WHERE</div>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Search destinations"
          className="gs-input"
          aria-label="Destination"
        />
      </div>

      <div className="gs-divider" />

      {/* WHEN */}
      <div className="gs-cell">
        <div className="gs-label">WHEN</div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="gs-buttonlike"
              aria-label="Choose dates"
            >
              {(checkIn && checkOut) ? (
                <span>
                  {format(new Date(checkIn), "MMM d")} – {format(new Date(checkOut), "MMM d")}
                </span>
              ) : (
                <span className="gs-placeholder">Add dates</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="gs-divider" />

      {/* WHO */}
      <div className="gs-cell">
        <div className="gs-label">WHO</div>
        <button
          className="gs-buttonlike"
          onClick={() => {
            // open your guests popover if you have one
          }}
          aria-label="Select guests"
        >
          {(adults || children) ? (
            <span>{adults + children} guest{adults + children !== 1 ? "s" : ""}</span>
          ) : (
            <span className="gs-placeholder">Add guests</span>
          )}
        </button>
      </div>

      {/* SEARCH CTA */}
      <button className="gs-cta" onClick={onSearch}>Search</button>
    </div>
  );
}
