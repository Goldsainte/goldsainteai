import { useState, useEffect, useMemo, useRef } from "react";
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
  
  // Ref for WHERE input
  const whereInputRef = useRef<HTMLInputElement>(null);

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
      handleSubmit();
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setOpenWhere(true);
      return;
    }

    const url = buildExpediaAffiliateUrl({
      destination: trimmedDestination,
      checkIn,
      checkOut,
      guests: { adults, children },
    });

    console.log("Redirecting to Expedia affiliate URL:", url);
    window.location.href = url; // FULL redirect for affiliate tracking
  };

  function onClear() {
    setDestination("");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setAdults(2);
    setChildren(0);
  }

  return (
    <>
      <style>{`
        .expedia-search-input {
          color: #1F3D36;
          font-family: "Playfair Display", serif;
          font-size: 16px;
          line-height: 1.2;
        }
        .expedia-search-input::placeholder {
          color: #6F6F6F;
          font-family: "Playfair Display", serif;
          font-size: 16px;
          line-height: 1.2;
        }
      `}</style>
      <form
      onSubmit={handleSubmit}
      className="mx-auto hidden md:flex items-center"
      style={{ width: 765 }}
      aria-label="Goldsainte search"
    >
      <div className="w-full h-[56px] rounded-[28px] border border-[hsl(var(--luxury-gold))] bg-[hsl(var(--luxury-gold))] text-muted-foreground shadow-md px-2 flex items-center">
          {/* WHERE pill */}
          <div
            ref={whereRefs.setReference}
            className="h-[54px] px-4 rounded-[21px] bg-white/40 hover:bg-white/60 transition flex items-center gap-3 cursor-text"
            style={{ width: 238 }}
            onClick={() => {
              whereInputRef.current?.focus();
              setOpenWhere(true);
              setOpenDates(false);
              setOpenGuests(false);
            }}
          >
            <div className="text-[12px] tracking-wide uppercase font-display" style={{ color: '#4A4A4A' }}>
              WHERE
            </div>
            <input
              ref={whereInputRef}
              type="text"
              className="w-full bg-transparent outline-none font-display expedia-search-input"
              style={{
                padding: 0,
                margin: 0,
                height: 'auto'
              }}
              placeholder="Search destinations"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => {
                setOpenWhere(true);
                setOpenDates(false);
                setOpenGuests(false);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Destination"
            />
          </div>

          {/* Divider */}
          <div className="h-[27px] w-px bg-black/12 mx-1" />

          {/* CHECK-IN pill */}
          <button
            ref={datesRefs.setReference}
            type="button"
            onClick={() => {
              setOpenDates((v) => !v);
              setOpenGuests(false);
              setOpenWhere(false);
            }}
            onKeyDown={handleKeyDown}
            className="h-[54px] rounded-[21px] px-4 bg-white/40 hover:bg-white/60 transition text-left flex flex-col justify-center"
            style={{ width: 128 }}
          >
            <div className="text-[12px] tracking-wide uppercase font-display" style={{ color: '#4A4A4A' }}>
              CHECK IN
            </div>
            <span className="font-display" style={{ fontSize: '16px', lineHeight: 1.2, color: '#47555E' }}>
              {checkIn || "Add date"}
            </span>
          </button>

          {/* Divider */}
          <div className="h-[27px] w-px bg-black/12 mx-1" />

          {/* CHECK-OUT pill */}
          <button
            type="button"
            onClick={() => {
              setOpenDates((v) => !v);
              setOpenGuests(false);
              setOpenWhere(false);
            }}
            onKeyDown={handleKeyDown}
            className="h-[54px] rounded-[21px] px-4 bg-white/40 hover:bg-white/60 transition text-left flex flex-col justify-center"
            style={{ width: 128 }}
          >
            <div className="text-[12px] tracking-wide uppercase font-display" style={{ color: '#4A4A4A' }}>
              CHECK OUT
            </div>
            <span className="font-display" style={{ fontSize: '16px', lineHeight: 1.2, color: '#47555E' }}>
              {checkOut || "Add date"}
            </span>
          </button>

          {/* Divider */}
          <div className="h-[27px] w-px bg-black/12 mx-1" />

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
            className="h-[54px] rounded-[21px] px-4 bg-white/40 hover:bg-white/60 transition text-left flex flex-col justify-center"
            style={{ width: 153 }}
          >
            <div className="text-[12px] tracking-wide uppercase font-display" style={{ color: '#4A4A4A' }}>
              WHO
            </div>
            <span className="font-display" style={{ fontSize: '16px', lineHeight: 1.2, color: '#47555E' }}>
              {adults + children} {adults + children === 1 ? "guest" : "guests"}
            </span>
          </button>

          {/* Search button - 48px circle */}
          <button
            type="submit"
            className="h-[41px] w-[41px] shrink-0 rounded-full bg-[hsl(var(--gs-ink))] text-white flex items-center justify-center hover:bg-[hsl(var(--gs-ink))]/90 transition ml-2"
            aria-label="Search on Expedia"
          >
            <SearchIcon className="h-5 w-5" />
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
            className="h-[34px] w-[34px] shrink-0 rounded-full bg-white/40 hover:bg-white/60 text-muted-foreground flex items-center justify-center ml-2"
              aria-label="Clear all"
              title="Clear all"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
      </div>

      {/* WHERE popover (portal so it never gets clipped) */}
      {openWhere &&
        createPortal(
          <div
            ref={whereRefs.setFloating}
            style={whereStyles as React.CSSProperties}
            className="z-[1000] w-[360px] rounded-2xl bg-white shadow-xl p-2 border border-border"
          >
            {suggestions.length === 0 && (
              <div className="text-sm text-muted-foreground p-3">
                Start typing a city or destination…
              </div>
            )}
            <ul>
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-foreground"
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
            className="z-[1000] w-[360px] rounded-2xl bg-white shadow-xl p-4 border border-border"
          >
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Check in
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2"
                  value={checkIn ?? ""}
                  onChange={(e) => setCheckIn(e.target.value || undefined)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Check out
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2"
                  value={checkOut ?? ""}
                  onChange={(e) => setCheckOut(e.target.value || undefined)}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setCheckIn(undefined);
                  setCheckOut(undefined);
                }}
              >
                Clear
              </button>
              <button
                className="px-3 py-2 text-sm bg-[hsl(var(--gs-ink))] text-white rounded-md hover:bg-[hsl(var(--gs-ink))]/90"
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
            className="z-[1000] w-[320px] rounded-2xl bg-white shadow-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-foreground">Adults</div>
                <div className="text-xs text-muted-foreground">Ages 13+</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="border border-border rounded-full w-8 h-8 text-foreground hover:bg-muted"
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                >
                  -
                </button>
                <div className="text-foreground">{adults}</div>
                <button
                  className="border border-border rounded-full w-8 h-8 text-foreground hover:bg-muted"
                  onClick={() => setAdults(adults + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-foreground">Children</div>
                <div className="text-xs text-muted-foreground">Ages 0–12</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="border border-border rounded-full w-8 h-8 text-foreground hover:bg-muted"
                  onClick={() => setChildren(Math.max(0, children - 1))}
                >
                  -
                </button>
                <div className="text-foreground">{children}</div>
                <button
                  className="border border-border rounded-full w-8 h-8 text-foreground hover:bg-muted"
                  onClick={() => setChildren(children + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAdults(2);
                  setChildren(0);
                }}
              >
                Clear
              </button>
              <button
                className="px-3 py-2 text-sm bg-[hsl(var(--gs-ink))] text-white rounded-md hover:bg-[hsl(var(--gs-ink))]/90"
                onClick={() => setOpenGuests(false)}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
      </form>
    </>
  );
}
