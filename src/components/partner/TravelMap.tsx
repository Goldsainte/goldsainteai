import { useMemo, useState } from "react";
import { WORLD_COUNTRIES, WORLD_VIEWBOX } from "./worldCountries";

// ============================================================================
// TravelMap — the creator's identity map (Jul 16). Zero runtime deps: the
// world geometry is generated at build time from world-atlas countries-110m.
// Visited countries fill gold; hover names every country; tap highlights.
// ============================================================================

export function TravelMap({ visited }: { visited: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const visitedSet = useMemo(
    () => new Set(visited.map((v) => v.trim().toLowerCase())),
    [visited]
  );
  return (
    <div className="relative">
      <svg viewBox={WORLD_VIEWBOX} className="w-full" role="img" aria-label="Travel map">
        {WORLD_COUNTRIES.map((c) => {
          const isVisited = visitedSet.has(c.name.toLowerCase());
          return (
            <path
              key={c.name}
              d={c.d}
              onMouseEnter={() => setActive(c.name)}
              onMouseLeave={() => setActive(null)}
              className="transition-colors"
              fill={isVisited ? "#C7A962" : "#EDE5D1"}
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
