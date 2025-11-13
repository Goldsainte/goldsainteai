import * as React from "react";
import { CalendarDays, Users, Search } from "lucide-react";
import { buildExpediaAffiliateUrl } from "@/lib/expedia";
import { cn } from "@/lib/utils";

type Suggestion = { id: string; label: string };

const DEFAULT_ADULTS = 2;

export default function ExpediaSearchBar() {
  const [destination, setDestination] = React.useState("");
  const [showDestMenu, setShowDestMenu] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  const [checkIn, setCheckIn] = React.useState<string | null>(null);
  const [checkOut, setCheckOut] = React.useState<string | null>(null);

  const [adults, setAdults] = React.useState<number>(DEFAULT_ADULTS);
  const [children, setChildren] = React.useState<number>(0);
  const [childrenAges, setChildrenAges] = React.useState<number[]>([]);

  const [openDates, setOpenDates] = React.useState(false);
  const [openGuests, setOpenGuests] = React.useState(false);

  // --- DESTINATION AUTOCOMPLETE (stub - wire to Mapbox/Algolia) ---
  const fetchSuggestions = React.useMemo(() => {
    let t: number | undefined;
    return (q: string) => {
      window.clearTimeout(t);
      t = window.setTimeout(async () => {
        if (!q.trim()) { setSuggestions([]); return; }
        // TODO: replace with real provider (Mapbox/Algolia/Supabase RPC)
        const res: Suggestion[] = [
          { id: "1", label: `${q}, United States` },
          { id: "2", label: `${q}, Canada` },
          { id: "3", label: `${q}, Europe` },
        ];
        setSuggestions(res);
      }, 150);
    };
  }, []);

  React.useEffect(() => { fetchSuggestions(destination); }, [destination, fetchSuggestions]);

  const onPickSuggestion = (s: Suggestion) => {
    setDestination(s.label);
    setShowDestMenu(false);
  };

  const onSubmit = () => {
    if (!destination.trim()) {
      setShowDestMenu(true);
      return;
    }
    const url = buildExpediaAffiliateUrl({
      destination,
      checkIn,
      checkOut,
      guests: { adults, children, childrenAges },
    });
    window.location.assign(url);
  };

  // formatters
  const dateLabel = !checkIn || !checkOut ? "Add dates" : `${checkIn} – ${checkOut}`;
  const guestLabel = `${adults + children} ${adults + children === 1 ? "guest" : "guests"}`;

  // --- STYLE: Airbnb desktop width/height; brand colors ---
  return (
    <div
      className="mx-auto mt-3 hidden md:flex items-center"
      style={{ maxWidth: 920 }}
    >
      <div
        className="flex w-full h-14 rounded-full shadow-md border border-[rgba(0,0,0,0.08)] overflow-hidden bg-[#F5F7F6]"
      >
        {/* WHERE */}
        <div
          className="relative flex-1 min-w-[34%] px-5 py-2 flex flex-col justify-center cursor-text hover:bg-white/70 transition-colors"
          onClick={() => {
            setShowDestMenu(true);
            setOpenDates(false);
            setOpenGuests(false);
          }}
        >
          <div className="text-[10px] tracking-[0.08em] font-semibold text-[#334F47]">WHERE</div>
          <input
            aria-label="Search destinations"
            placeholder="Search destinations"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => setShowDestMenu(true)}
            className="bg-transparent outline-none text-[15px] text-[#0E3A34] placeholder:text-[#8AA39B]"
          />
          {/* suggestions dropdown */}
          {showDestMenu && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 z-50 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-black/5"
              onMouseLeave={() => setShowDestMenu(false)}
            >
              <ul className="py-2">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="px-4 py-2 hover:bg-[#F5F7F6] cursor-pointer text-[15px] text-[#0E3A34]"
                    onClick={() => onPickSuggestion(s)}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-px bg-black/10 self-stretch my-2" />

        {/* WHEN */}
        <button
          type="button"
          className={cn(
            "flex-1 min-w-[33%] px-5 py-2 text-left hover:bg-white/70 transition-colors",
            "focus:outline-none"
          )}
          onClick={() => { setOpenDates(true); setShowDestMenu(false); setOpenGuests(false); }}
        >
          <div className="text-[10px] tracking-[0.08em] font-semibold text-[#334F47]">WHEN</div>
          <div className="flex items-center gap-2 text-[15px] text-[#0E3A34]">
            <CalendarDays className="w-4 h-4 opacity-70" />
            <span>{dateLabel}</span>
          </div>
        </button>

        <div className="w-px bg-black/10 self-stretch my-2" />

        {/* WHO */}
        <button
          type="button"
          className="flex-1 min-w-[25%] px-5 py-2 text-left hover:bg-white/70 transition-colors focus:outline-none"
          onClick={() => { setOpenGuests(true); setShowDestMenu(false); setOpenDates(false); }}
        >
          <div className="text-[10px] tracking-[0.08em] font-semibold text-[#334F47]">WHO</div>
          <div className="flex items-center gap-2 text-[15px] text-[#0E3A34]">
            <Users className="w-4 h-4 opacity-70" />
            <span>{guestLabel}</span>
          </div>
        </button>

        {/* SEARCH CTA */}
        <button
          aria-label="Search"
          className="h-14 px-5 rounded-full bg-[#1E5A53] text-white flex items-center gap-2 font-semibold hover:brightness-110 focus:outline-none"
          onClick={onSubmit}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Date & Guests popovers */}
      {openDates && (
        <DatePopover
          onClose={() => setOpenDates(false)}
          value={{ checkIn, checkOut }}
          onChange={({ checkIn: ci, checkOut: co }) => { setCheckIn(ci); setCheckOut(co); }}
        />
      )}

      {openGuests && (
        <GuestsPopover
          onClose={() => setOpenGuests(false)}
          adults={adults}
          children={children}
          childrenAges={childrenAges}
          onChange={(n) => {
            setAdults(n.adults);
            setChildren(n.children);
            setChildrenAges(n.childrenAges || []);
          }}
        />
      )}
    </div>
  );
}

/* --------- lightweight popovers (desktop) ---------- */

function DatePopover(props: {
  value: { checkIn: string | null; checkOut: string | null };
  onChange: (v: { checkIn: string | null; checkOut: string | null }) => void;
  onClose: () => void;
}) {
  const [ci, setCi] = React.useState(props.value.checkIn || "");
  const [co, setCo] = React.useState(props.value.checkOut || "");

  return (
    <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-black/5 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-neutral-600 mb-1">Check in</label>
          <input type="date" value={ci} onChange={(e) => setCi(e.target.value)} className="border rounded-md px-2 py-2" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-neutral-600 mb-1">Check out</label>
          <input type="date" value={co} onChange={(e) => setCo(e.target.value)} className="border rounded-md px-2 py-2" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button className="text-sm px-3 py-2" onClick={() => { setCi(""); setCo(""); props.onChange({ checkIn: null, checkOut: null }); props.onClose(); }}>
          Clear
        </button>
        <button
          className="text-sm px-3 py-2 rounded-md bg-[#1E5A53] text-white"
          onClick={() => { props.onChange({ checkIn: ci || null, checkOut: co || null }); props.onClose(); }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function GuestsPopover(props: {
  adults: number; children: number; childrenAges: number[]; onChange: (v: { adults: number; children: number; childrenAges?: number[] }) => void; onClose: () => void;
}) {
  const [ad, setAd] = React.useState(props.adults);
  const [ch, setCh] = React.useState(props.children);
  const [ages, setAges] = React.useState<number[]>(props.childrenAges || []);

  React.useEffect(() => {
    if (ch > ages.length) setAges((a) => a.concat(Array(ch - a.length).fill(5)));
    else if (ch < ages.length) setAges((a) => a.slice(0, ch));
  }, [ch, ages.length]);

  return (
    <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 w-[340px]">
      <Row label="Adults" value={ad} setValue={setAd} min={1} />
      <Row label="Children" value={ch} setValue={setCh} min={0} />

      {ch > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-neutral-600">Children ages</div>
          <div className="grid grid-cols-3 gap-2">
            {ages.map((age, idx) => (
              <input
                key={idx}
                type="number"
                min={0}
                max={17}
                value={age}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(17, Number(e.target.value || 0)));
                  setAges((a) => a.map((x, i) => (i === idx ? v : x)));
                }}
                className="border rounded-md px-2 py-1 text-sm"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button className="text-sm px-3 py-2" onClick={() => { setAd(DEFAULT_ADULTS); setCh(0); setAges([]); props.onChange({ adults: DEFAULT_ADULTS, children: 0, childrenAges: [] }); props.onClose(); }}>
          Clear
        </button>
        <button
          className="text-sm px-3 py-2 rounded-md bg-[#1E5A53] text-white"
          onClick={() => { props.onChange({ adults: ad, children: ch, childrenAges: ages }); props.onClose(); }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, setValue, min }: { label: string; value: number; setValue: (n: number) => void; min: number; }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-[15px] text-[#0E3A34]">{label}</div>
      <div className="flex items-center gap-3">
        <button className="w-7 h-7 rounded-full border hover:bg-neutral-50" onClick={() => setValue(Math.max(min, value - 1))}>-</button>
        <div className="w-6 text-center">{value}</div>
        <button className="w-7 h-7 rounded-full border hover:bg-neutral-50" onClick={() => setValue(value + 1)}>+</button>
      </div>
    </div>
  );
}
