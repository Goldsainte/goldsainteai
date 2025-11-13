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
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
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

  const handleChildrenChange = (newCount: number) => {
    setChildren(newCount);
    if (newCount > childrenAges.length) {
      setChildrenAges([...childrenAges, ...Array(newCount - childrenAges.length).fill(0)]);
    } else {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newAges = [...childrenAges];
    newAges[index] = Math.max(0, Math.min(17, age));
    setChildrenAges(newAges);
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="gs-buttonlike"
              aria-label="Select guests"
            >
              {(adults + children > 0) ? (
                <span>{adults + children} guest{adults + children !== 1 ? "s" : ""}</span>
              ) : (
                <span className="gs-placeholder">Add guests</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Adults</div>
                  <div className="text-xs text-muted-foreground">Ages 18+</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                    className="h-8 w-8 rounded-full border border-border hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease adults"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{adults}</span>
                  <button
                    onClick={() => setAdults(adults + 1)}
                    className="h-8 w-8 rounded-full border border-border hover:border-foreground"
                    aria-label="Increase adults"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Children</div>
                  <div className="text-xs text-muted-foreground">Ages 0-17</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleChildrenChange(Math.max(0, children - 1))}
                    disabled={children <= 0}
                    className="h-8 w-8 rounded-full border border-border hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease children"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{children}</span>
                  <button
                    onClick={() => handleChildrenChange(children + 1)}
                    className="h-8 w-8 rounded-full border border-border hover:border-foreground"
                    aria-label="Increase children"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children Ages */}
              {children > 0 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="text-sm font-medium">Children's ages</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: children }).map((_, i) => (
                      <div key={i}>
                        <label htmlFor={`child-age-${i}`} className="text-xs text-muted-foreground block mb-1">
                          Child {i + 1}
                        </label>
                        <input
                          id={`child-age-${i}`}
                          type="number"
                          min="0"
                          max="17"
                          value={childrenAges[i] || 0}
                          onChange={(e) => handleChildAgeChange(i, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label={`Age of child ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* SEARCH CTA */}
      <button className="gs-cta" onClick={onSearch}>Search</button>
    </div>
  );
}
