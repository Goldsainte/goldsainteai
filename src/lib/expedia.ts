export type SearchParams = {
  destination: string;        // e.g., "Charlotte, NC"
  checkIn?: string;           // ISO: "2025-11-16"
  checkOut?: string;          // ISO: "2025-11-19"
  adults?: number;            // default 2
  children?: number;          // default 0
};

const AFFILIATE_BASE =
  import.meta.env.VITE_EXPEDIA_AFFILIATE_BASE ||
  "https://expedia.com/affiliates/expedia-home.bexNBHE";

/**
 * Strategy A (default): wrap deep link with affiliate portal using ?u=<encoded target>.
 * Strategy B: direct deep link (if your affiliate desk requires a different pattern).
 */
const STRATEGY = (import.meta.env.VITE_EXPEDIA_LINK_STRATEGY || "wrap") as
  | "wrap"
  | "direct";

/** Build Expedia hotel search URL with prepopulated params. */
export function buildHotelSearchUrl(p: SearchParams) {
  if (!p.destination?.trim()) throw new Error("Destination is required");

  const target = new URL("https://www.expedia.com/Hotel-Search");
  target.searchParams.set("destination", p.destination.trim());

  // Only include dates/guests if the user actually provided them.
  if (p.checkIn) target.searchParams.set("startDate", p.checkIn);
  if (p.checkOut) target.searchParams.set("endDate", p.checkOut);

  const adults = p.adults ?? 2;
  const children = p.children ?? 0;
  target.searchParams.set("adults", String(adults));
  if (children > 0) target.searchParams.set("children", String(children));

  // Include campaign attribution
  target.searchParams.set("utm_source", "goldsainte");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "header_search");

  if (STRATEGY === "direct") return target.toString();

  // Most affiliate home pages support a URL passthrough param (?u=).
  const aff = new URL(AFFILIATE_BASE);
  aff.searchParams.set("u", target.toString()); // IMPORTANT: encode the target
  aff.searchParams.set("utm_source", "goldsainte");
  aff.searchParams.set("utm_medium", "referral");
  aff.searchParams.set("utm_campaign", "header_search");
  return aff.toString();
}

/** Perform a hard redirect (no iframe, no popup) */
export function redirectToExpedia(p: SearchParams) {
  const url = buildHotelSearchUrl(p);
  // Use assign() so the browser sends Referer to affiliate and preserves cookies
  window.location.assign(url);
}
