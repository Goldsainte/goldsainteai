import { useMemo } from "react";
import { WORLD_COUNTRIES } from "./worldCountries";

// ============================================================================
// CountryTile — Apple-Store-style filter tile (Jul 26).
//
// Instead of a text pill, each country is drawn as its own silhouette, taken
// from the SAME map data the TravelMap uses. The trick that makes it legible
// at 72px: we don't render the world map and highlight one country (at that
// size the country would be a few pixels) — we read the country's path, take
// its bounding box, and make THAT the viewBox. Every country then fills its
// tile at its own scale, so Iceland and India are both recognisable.
// ============================================================================

/** Directory names come from free-typed home_base; map names come from
 *  Natural Earth. Bridge the ones that differ. */
const NAME_TO_MAP: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "United Kingdom": "United Kingdom",
  "Dominican Republic": "Dominican Rep.",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  "South Korea": "South Korea",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Central African Republic": "Central African Rep.",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  "Republic of the Congo": "Congo",
  "Equatorial Guinea": "Eq. Guinea",
  "South Sudan": "S. Sudan",
  "Solomon Islands": "Solomon Is.",
  "Turks and Caicos": "Turks and Caicos Islands",
  "Cayman": "Cayman Islands",
  "St Lucia": "Saint Lucia",
  "St. Lucia": "Saint Lucia",
  "Saint Maarten": "Sint Maarten",
  "St Maarten": "Sint Maarten",
};

const byName = new Map(WORLD_COUNTRIES.map((c) => [c.name.toLowerCase(), c]));
const byAlias = new Map<string, (typeof WORLD_COUNTRIES)[number]>();
for (const c of WORLD_COUNTRIES) {
  for (const a of c.aliases ?? []) byAlias.set(a.toLowerCase(), c);
}

export function resolveCountryShape(name: string) {
  const direct = byName.get(name.toLowerCase());
  if (direct) return direct;
  const mapped = NAME_TO_MAP[name];
  if (mapped) {
    const viaMap = byName.get(mapped.toLowerCase());
    if (viaMap) return viaMap;
  }
  return byAlias.get(name.toLowerCase()) ?? null;
}

/** Bounding box of an SVG path's coordinate pairs. */
function pathBounds(d: string) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = parseFloat(nums[i]);
    const y = parseFloat(nums[i + 1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX) || !isFinite(minY)) return null;
  return { minX, minY, w: Math.max(maxX - minX, 0.5), h: Math.max(maxY - minY, 0.5) };
}

interface CountryTileProps {
  country: string;
  active: boolean;
  onToggle: (country: string) => void;
}

export function CountryTile({ country, active, onToggle }: CountryTileProps) {
  const shape = useMemo(() => resolveCountryShape(country), [country]);

  const viewBox = useMemo(() => {
    if (!shape) return null;
    const b = pathBounds(shape.d);
    if (!b) return null;
    // Pad so the silhouette breathes inside the tile, and keep the aspect
    // square so wide countries (Russia) and tall ones (Chile) both centre.
    const size = Math.max(b.w, b.h) * 1.35;
    const cx = b.minX + b.w / 2;
    const cy = b.minY + b.h / 2;
    return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
  }, [shape]);

  return (
    <button
      type="button"
      onClick={() => onToggle(country)}
      aria-pressed={active}
      className="group flex w-[86px] shrink-0 flex-col items-center gap-2 focus:outline-none"
    >
      {/* Colours match TravelMap exactly (Jul 26): an unlit country there is
          #EDE5D1 on cream, a lit one is Goldsainte gold #C7A962 with a #FDF9F0
          hairline. Same language here, so a selected country in this filter
          reads as the same "lit" state people see on the map. */}
      <span
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-2xl border transition-colors ${
          active
            ? "border-[#C7A962] bg-[#FDF9F0]"
            : "border-[#E5DFC6] bg-white group-hover:border-[#C7A962]"
        }`}
      >
        {shape && viewBox ? (
          <svg
            viewBox={viewBox}
            className="h-[46px] w-[46px]"
            role="img"
            aria-label={country}
          >
            {/* Lit = Goldsainte gold, exactly as on the map. Unlit = the
                map's own resting stone (#EDE5D1), deepening on hover so the
                tile responds before it's chosen. */}
            <path
              d={shape.d}
              fill={active ? "#C7A962" : "#EDE5D1"}
              stroke={active ? "#C7A962" : "#D9CFB4"}
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
              className={active ? "" : "transition-colors group-hover:fill-[#E2C57E]"}
            />
          </svg>
        ) : (
          // No shape in the 110m/50m data (rare) — fall back to initials so the
          // filter still works rather than rendering an empty tile.
          <span className="font-secondary text-[18px] text-[#0c4d47]/70">
            {country.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span
        className={`w-full truncate text-center text-[12px] leading-tight transition-colors ${
          active ? "text-[#0a2225]" : "text-[#0a2225]/65 group-hover:text-[#0a2225]"
        }`}
        title={country}
      >
        {country}
      </span>
    </button>
  );
}
