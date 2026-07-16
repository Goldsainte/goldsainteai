import { useMemo, useState } from "react";
import { WORLD_COUNTRIES, WORLD_VIEWBOX } from "./worldCountries";

// ============================================================================
// TravelMap v2 — the creator's identity map, now animated (Jul 16).
// Zero runtime deps (world geometry generated at build time).
// • On load: visited countries LIGHT UP gold one by one — a staggered sweep
//   across the creator's world.
// • Hover: any country lifts and names itself ("· been there" when visited).
// ============================================================================

export function TravelMap({ visited }: { visited: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const visitedSet = useMemo(
    () => new Set(visited.map((v) => v.trim().toLowerCase())),
    [visited]
  );
  // Stable light-up order: the order the creator's list provides.
  const orderByName = useMemo(() => {
    const m = new Map<string, number>();
    visited.forEach((v, i) => m.set(v.trim().toLowerCase(), i));
    return m;
  }, [visited]);

  return (
    <div className="relative">
      <style>{`
        @keyframes gs-country-lightup {
          0%   { fill: #EDE5D1; }
          55%  { fill: #E2C57E; }
          100% { fill: #C7A962; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gs-visited { animation: none !important; fill: #C7A962 !important; }
        }
        .gs-country { transition: filter 150ms ease, opacity 150ms ease; }
        .gs-country:hover { filter: brightness(0.92); }
        .gs-visited:hover { filter: brightness(1.08); }
      `}</style>
      <svg viewBox={WORLD_VIEWBOX} className="w-full" role="img" aria-label="Travel map">
        {WORLD_COUNTRIES.map((c) => {
          const key = c.name.toLowerCase();
          const isVisited = visitedSet.has(key);
          const order = orderByName.get(key) ?? 0;
          return (
            <path
              key={c.name}
              d={c.d}
              onMouseEnter={() => setActive(c.name)}
              onMouseLeave={() => setActive(null)}
              className={isVisited ? "gs-country gs-visited" : "gs-country"}
              fill={isVisited ? "#EDE5D1" : "#EDE5D1"}
              style={
                isVisited
                  ? {
                      animation: "gs-country-lightup 700ms ease forwards",
                      animationDelay: `${300 + order * 140}ms`,
                    }
                  : undefined
              }
              stroke="#FDF9F0"
              strokeWidth={0.6}
            >
              <title>{c.name}</title>
            </path>
          );
        })}
      </svg>
      {active && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#0a2225] px-4 py-1.5 text-[13px] text-[#f7f3ea]">
          {active}
          {visitedSet.has(active.toLowerCase()) ? " · been there" : ""}
        </span>
      )}
    </div>
  );
}

export default TravelMap;
