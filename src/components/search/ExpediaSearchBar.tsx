import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import { CalendarIcon, Users2Icon, SearchIcon, MapPinIcon, XIcon } from "lucide-react";
import { buildExpediaAffiliateUrl } from "@/lib/expedia";

// Simple debounce helper
const debounce = (fn: (...a: any[]) => void, ms = 250) => {
  let t: any;
  return (...a: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

type Suggestion = { id: string; label: string };

// Static suggestions (TODO: replace with real autocomplete API)
const STATIC_SUGGESTIONS: Suggestion[] = [
  { id: "CLT", label: "Charlotte, NC" },
  { id: "NYC", label: "New York, NY" },
  { id: "LAX", label: "Los Angeles, CA" },
  { id: "MIA", label: "Miami, FL" },
  { id: "ATL", label: "Atlanta, GA" },
];

export default function ExpediaSearchBar() {
  // Controlled state
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<string | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<string | undefined>(undefined);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Popover state
  const [openDates, setOpenDates] = useState(false);
  const [openGuests, setOpenGuests] = useState(false);
  const [openWhere, setOpenWhere] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const runSuggest = useMemo(
    () =>
      debounce((q: string) => {
        if (!q) return setSuggestions([]);
        // TODO: replace with real autocomplete source (Algolia, Mapbox, etc.)
        const list = STATIC_SUGGESTIONS.filter((s) =>
          s.label.toLowerCase().includes(q.toLowerCase())
        );
        setSuggestions(list.slice(0, 8));
      }, 200),
    []
  );

  useEffect(() => {
    runSuggest(destination);
  }, [destination, runSuggest]);

  // Floating UI for popovers (prevents clipping under header)
  const { refs: datesRefs, floatingStyles: datesStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const { refs: guestsRefs, floatingStyles: guestsStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const { refs: whereRefs, floatingStyles: whereStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  // Escape key closes popovers
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenWhere(false);
        setOpenDates(false);
        setOpenGuests(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  function onSubmit() {
    if (!destination.trim()) {
      setOpenWhere(true);
      return;
    }
    const url = buildExpediaAffiliateUrl({
      destination: destination.trim(),
      checkIn,
      checkOut,
      guests: { adults, children },
    });

    // Redirect (no iframe) so affiliate credit works
    window.location.assign(url);
  }

  function onClear() {
    setDestination("");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setAdults(2);
    setChildren(0);
  }

  return (
    <div
      className="mx-auto mt-3 hidden md:flex items-center"
      style={{ maxWidth: 980 }}
      aria-label="Goldsainte search"
    >
      <div className="w-full rounded-full border border-white/40 bg-[hsl(var(--gs-gold))] text-[hsl(var(--gs-ink))] shadow-sm px-2 py-2">
        <div className="flex items-center gap-1">
          {/* WHERE pill */}
          <button
            ref={whereRefs.setReference}
            type="button"
            onClick={() => {
              setOpenWhere((v) => !v);
              setOpenDates(false);
              setOpenGuests(false);
            }}
            onKeyDown={handleKeyDown}
            className="group flex-1 min-w-[260px] rounded-full px-4 py-2 text-left bg-white/70 hover:bg-white transition"
          >
            <div className="text-[10px] tracking-[.12em] uppercase font-semibold text-[hsl(var(--gs-ink)/70)]">
              Where
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 opacity-70" />
              <input
                className="w-full bg-transparent outline-none placeholder:text-[hsl(var(--gs-ink)/50)] font-display text-[17px]"
                placeholder="Search destinations"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => setOpenWhere(true)}
                aria-label="Destination"
              />
            </div>
          </button>

          {/* WHEN pill */}
          <button
            ref={datesRefs.setReference}
            type="button"
            onClick={() => {
              setOpenDates((v) => !v);
              setOpenGuests(false);
              setOpenWhere(false);
            }}
            onKeyDown={handleKeyDown}
            className="min-w-[230px] rounded-full px-4 py-2 bg-white/70 hover:bg-white transition text-left"
          >
            <div className="text-[10px] tracking-[.12em] uppercase font-semibold text-[hsl(var(--gs-ink)/70)]">
              When
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 opacity-70" />
              <span className="font-display text-[17px]">
                {checkIn && checkOut ? `${checkIn} – ${checkOut}` : "Add dates"}
              </span>
            </div>
          </button>

          {/* WHO pill */}
          <button
            ref={guestsRefs.setReference}
            type="button"
            onClick={() => {
              setOpenGuests((v) => !v);
              setOpenDates(false);
              setOpenWhere(false);
            }}
            onKeyDown={handleKeyDown}
            className="min-w-[170px] rounded-full px-4 py-2 bg-white/70 hover:bg-white transition text-left"
          >
            <div className="text-[10px] tracking-[.12em] uppercase font-semibold text-[hsl(var(--gs-ink)/70)]">
              Who
            </div>
            <div className="flex items-center gap-2">
              <Users2Icon className="h-4 w-4 opacity-70" />
              <span className="font-display text-[17px]">
                {adults + children} {adults + children === 1 ? "guest" : "guests"}
              </span>
            </div>
          </button>

          {/* Search button */}
          <button
            type="button"
            onClick={onSubmit}
            className="ml-2 shrink-0 rounded-full bg-[hsl(var(--gs-ink))] text-white px-6 py-3 font-display text-[18px] leading-none flex items-center gap-2 hover:opacity-90"
            aria-label="Search on Expedia"
          >
            <SearchIcon className="h-5 w-5" />
            Search
          </button>

          {/* Clear button shows when something changed */}
          {(destination ||
            checkIn ||
            checkOut ||
            adults !== 2 ||
            children !== 0) && (
            <button
              type="button"
              onClick={onClear}
              className="ml-2 shrink-0 rounded-full bg-white/70 hover:bg-white text-[hsl(var(--gs-ink))] px-3 py-3"
              aria-label="Clear all"
              title="Clear all"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* WHERE popover (portal so it never gets clipped) */}
      {openWhere &&
        createPortal(
          <div
            ref={whereRefs.setFloating}
            style={whereStyles as React.CSSProperties}
            className="z-[1000] w-[360px] rounded-2xl bg-white shadow-xl p-2 border"
          >
            {suggestions.length === 0 && (
              <div className="text-sm text-neutral-500 p-3">
                Start typing a city or destination…
              </div>
            )}
            <ul>
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded-md"
                    onClick={() => {
                      setDestination(s.label);
                      setOpenWhere(false);
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}

      {/* DATES popover (use native pickers for now; can swap to a calendar later) */}
      {openDates &&
        createPortal(
          <div
            ref={datesRefs.setFloating}
            style={datesStyles as React.CSSProperties}
            className="z-[1000] w-[360px] rounded-2xl bg-white shadow-xl p-4 border"
          >
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-600">
                  Check in
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={checkIn ?? ""}
                  onChange={(e) => setCheckIn(e.target.value || undefined)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-600">
                  Check out
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={checkOut ?? ""}
                  onChange={(e) => setCheckOut(e.target.value || undefined)}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm"
                onClick={() => {
                  setCheckIn(undefined);
                  setCheckOut(undefined);
                }}
              >
                Clear
              </button>
              <button
                className="px-3 py-2 text-sm bg-[hsl(var(--gs-ink))] text-white rounded-md"
                onClick={() => setOpenDates(false)}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* GUESTS popover */}
      {openGuests &&
        createPortal(
          <div
            ref={guestsRefs.setFloating}
            style={guestsStyles as React.CSSProperties}
            className="z-[1000] w-[320px] rounded-2xl bg-white shadow-xl p-4 border"
          >
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Adults</div>
                <div className="text-xs text-neutral-500">Ages 13+</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="border rounded-full w-8 h-8"
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                >
                  -
                </button>
                <div>{adults}</div>
                <button
                  className="border rounded-full w-8 h-8"
                  onClick={() => setAdults(adults + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Children</div>
                <div className="text-xs text-neutral-500">Ages 0–12</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="border rounded-full w-8 h-8"
                  onClick={() => setChildren(Math.max(0, children - 1))}
                >
                  -
                </button>
                <div>{children}</div>
                <button
                  className="border rounded-full w-8 h-8"
                  onClick={() => setChildren(children + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm"
                onClick={() => {
                  setAdults(2);
                  setChildren(0);
                }}
              >
                Clear
              </button>
              <button
                className="px-3 py-2 text-sm bg-[hsl(var(--gs-ink))] text-white rounded-md"
                onClick={() => setOpenGuests(false)}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
