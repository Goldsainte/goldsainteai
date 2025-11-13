import { useState } from "react";
import { redirectToExpedia } from "@/lib/expedia";

export default function ExpediaSearchBar() {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<string|undefined>();
  const [checkOut, setCheckOut] = useState<string|undefined>();
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [showDestList, setShowDestList] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const onChangeDestination = async (val: string) => {
    setDestination(val);
    setShowDestList(true);
    // Debounced fetch to our proxy
    if (val.trim().length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/destinations?q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setSuggestions(data?.results?.slice(0, 8) ?? []);
    } catch { /* no-op */ }
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
        <div className="relative">
          <input
            value={destination}
            onChange={(e) => onChangeDestination(e.target.value)}
            onFocus={() => setShowDestList(true)}
            onBlur={() => setTimeout(() => setShowDestList(false), 150)}
            placeholder="Search destinations"
            className="gs-input"
            aria-label="Destination"
          />
          {showDestList && suggestions.length > 0 && (
            <div className="gs-popover">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="gs-popover-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setDestination(s); setShowDestList(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="gs-divider" />

      {/* WHEN */}
      <div className="gs-cell">
        <div className="gs-label">WHEN</div>
        <button
          className="gs-buttonlike"
          onClick={() => {
            // open your date picker popover if you have one
            // TEMP: clear any auto defaults; only show placeholders until selected
          }}
          aria-label="Choose dates"
        >
          {(checkIn && checkOut) ? (
            <span>
              {checkIn} – {checkOut}
            </span>
          ) : (
            <span className="gs-placeholder">Add dates</span>
          )}
        </button>
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
