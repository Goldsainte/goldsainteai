import { useEffect, useMemo, useRef, useState } from "react";
import { WORLD_COUNTRIES, WORLD_VIEWBOX } from "./worldCountries";

// ============================================================================
// TravelMap v3 — pins + ignition (Jul 16 eve). Zero runtime deps.
// • Each visited country's pin DROPS from above with a bounce, landing at
//   the exact moment its country lights gold (same stagger clock).
// • After the show: pins stay planted, countries stay lit.
// • Pin positions are measured from the real geometry at runtime (bbox
//   centers), so they're correct for any set of countries.
// • prefers-reduced-motion: everything renders in its final state, no motion.
// ============================================================================

const PIN_COLOR = "#A93226"; // deep luxury brick red — one hex to retune

interface Pin { name: string; x: number; y: number; delay: number }

export function TravelMap({ visited }: { visited: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());

  const visitedSet = useMemo(
    () => new Set(visited.map((v) => v.trim().toLowerCase())),
    [visited]
  );
  const orderByName = useMemo(() => {
    const m = new Map<string, number>();
    visited.forEach((v, i) => m.set(v.trim().toLowerCase(), i));
    return m;
  }, [visited]);

  // Measure pin positions from the rendered geometry
  useEffect(() => {
    const next: Pin[] = [];
    for (const [key, el] of pathRefs.current.entries()) {
      if (!visitedSet.has(key) || !el) continue;
      try {
        const b = el.getBBox();
        next.push({
          name: key,
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
          delay: 300 + (orderByName.get(key) ?? 0) * 140,
        });
      } catch { /* detached node — skip */ }
    }
    next.sort((a, b) => a.delay - b.delay);
    setPins(next);
  }, [visitedSet, orderByName]);

  return (
    <div className="relative">
      <style>{`
        @keyframes gs-country-lightup {
          0%   { fill: #EDE5D1; }
          55%  { fill: #E2C57E; }
          100% { fill: #C7A962; }
        }
        @keyframes gs-pin-drop {
          0%   { opacity: 0; transform: translateY(-46px); }
          55%  { opacity: 1; transform: translateY(2.5px); }
          75%  { transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .gs-pin-inner { opacity: 0; animation: gs-pin-drop 620ms cubic-bezier(0.34, 1.2, 0.64, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .gs-visited { animation: none !important; fill: #C7A962 !important; }
          .gs-pin-inner { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
        .gs-country { transition: filter 150ms ease; }
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
              ref={(el) => {
                if (el) pathRefs.current.set(key, el);
                else pathRefs.current.delete(key);
              }}
              d={c.d}
              onMouseEnter={() => setActive(c.name)}
              onMouseLeave={() => setActive(null)}
              className={isVisited ? "gs-country gs-visited" : "gs-country"}
              fill="#EDE5D1"
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

        {/* Pins: outer g = position (SVG attr), inner g = drop animation (CSS) */}
        {pins.map((p) => (
          <g key={p.name} transform={`translate(${p.x}, ${p.y})`} pointerEvents="none">
            <g className="gs-pin-inner" style={{ animationDelay: `${p.delay + 260}ms` }}>
              <ellipse cx="0" cy="1.6" rx="4.2" ry="1.6" fill="rgba(10,34,37,0.28)" />
              <path
                d="M0,0 C-4.6,-7.4 -7.2,-10.6 -7.2,-14.6 A7.2,7.2 0 1,1 7.2,-14.6 C7.2,-10.6 4.6,-7.4 0,0 Z"
                fill={PIN_COLOR}
                stroke="#FDF9F0"
                strokeWidth="1"
              />
              <circle cx="0" cy="-14.4" r="2.6" fill="#FDF9F0" />
            </g>
          </g>
        ))}
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
