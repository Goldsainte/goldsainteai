import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { buildExpediaStaysUrl, GuestCounts } from "@/lib/expedia";
import { cn } from "@/lib/utils";

export default function ExpediaSearchBar() {
  const [destination, setDestination] = useState("");
  const [range, setRange] = useState<DateRange>({ from: addDays(new Date(), 3), to: addDays(new Date(), 6) });
  const [guests, setGuests] = useState<GuestCounts>({ adults: 2, childrenAges: [] });
  const nights = useMemo(() => {
    if (!range.from || !range.to) return 0;
    return Math.max(1, Math.round((+range.to - +range.from) / 86400000));
  }, [range]);

  const canSearch = destination.trim().length > 0 && !!range.from && !!range.to && guests.adults > 0;

  const handleSearch = () => {
    if (!canSearch) return;
    const url = buildExpediaStaysUrl({
      destination: destination.trim(),
      checkIn: range.from!,
      checkOut: range.to!,
      guests
    });
    window.location.href = url;
  };

  return (
    <div
      className="mx-auto flex h-14 w-full max-w-[820px] items-center rounded-full bg-white/95 px-2 py-2 shadow-md
                 ring-1 ring-black/10 text-foreground"
      role="search"
      aria-label="Stays search"
    >
      {/* WHERE */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex-1 rounded-full px-5 py-2 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            aria-label="Choose destination"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Where</div>
            <div className="truncate text-sm text-foreground font-medium">{destination || "Search destinations"}</div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[420px] p-3">
          <Input
            autoFocus
            placeholder="City, landmark, airport"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </PopoverContent>
      </Popover>

      <div className="h-6 w-px bg-border" />

      {/* WHEN */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex-1 rounded-full px-5 py-2 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            aria-label="Choose dates"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">When</div>
            <div className="text-sm text-foreground font-medium">
              {range.from && range.to
                ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")} · ${nights} night${nights > 1 ? "s" : ""}`
                : "Add dates"}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[740px]">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={setRange}
            disabled={(date) => date < new Date()}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <div className="h-6 w-px bg-border" />

      {/* WHO */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex-1 rounded-full px-5 py-2 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            aria-label="Choose guests"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Who</div>
            <div className="text-sm text-foreground font-medium">
              {guests.adults + guests.childrenAges.length} guest{(guests.adults + guests.childrenAges.length) > 1 ? "s" : ""}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[420px]">
          <div className="space-y-4">
            <Row
              label="Adults"
              value={guests.adults}
              onChange={(v) => setGuests((g) => ({ ...g, adults: Math.max(1, v) }))}
              min={1}
            />
            <ChildrenPicker
              childrenAges={guests.childrenAges}
              setChildrenAges={(ages) => setGuests((g) => ({ ...g, childrenAges: ages }))}
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* SEARCH BUTTON */}
      <Button
        className="ml-2 rounded-full px-6 h-9 bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-sm"
        onClick={handleSearch}
        disabled={!canSearch}
      >
        Search
      </Button>
    </div>
  );
}

function Row({ label, value, onChange, min = 0, max = 16 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Decrease ${label}`}>–</Button>
        <div className="w-8 text-center">{value}</div>
        <Button variant="outline" size="icon" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Increase ${label}`}>+</Button>
      </div>
    </div>
  );
}

function ChildrenPicker({ childrenAges, setChildrenAges }: { childrenAges: number[]; setChildrenAges: (ages: number[]) => void }) {
  const add = () => setChildrenAges([...childrenAges, 8]);
  const remove = (i: number) => setChildrenAges(childrenAges.filter((_, idx) => idx !== i));
  const setAge = (i: number, age: number) => setChildrenAges(childrenAges.map((a, idx) => idx === i ? age : a));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Children</div>
        <Button variant="outline" size="sm" onClick={add}>Add child</Button>
      </div>
      {!!childrenAges.length && (
        <div className="space-y-2">
          {childrenAges.map((age, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Child {i + 1} age</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={17}
                  className="w-20"
                  value={age}
                  onChange={(e) => setAge(i, Math.max(0, Math.min(17, Number(e.target.value || 0))))}
                />
                <Button variant="ghost" size="sm" onClick={() => remove(i)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
