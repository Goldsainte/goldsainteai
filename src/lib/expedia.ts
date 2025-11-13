export type GuestCounts = { 
  adults: number; 
  children: number; 
  childrenAges?: number[] 
};

export type DeepLinkInput = {
  destination: string;          // e.g., "Paris, France"
  checkIn?: string | null;      // "YYYY-MM-DD"
  checkOut?: string | null;     // "YYYY-MM-DD"
  guests: GuestCounts;          // { adults, children, childrenAges? }
};

const AFFILIATE_BASE = "https://expedia.com/affiliates/expedia-home.bexNBHE";

/** Build Expedia affiliate URL with direct deep-link parameters */
export function buildExpediaAffiliateUrl(i: DeepLinkInput) {
  const params = new URLSearchParams();

  // Destination – fall back to plain search term if we don't have IDs.
  params.set("destination", i.destination);

  // Dates (only include if the user selected them)
  if (i.checkIn) params.set("checkIn", i.checkIn);
  if (i.checkOut) params.set("checkOut", i.checkOut);

  // Guests
  params.set("adults", String(Math.max(1, i.guests.adults || 1)));
  const children = Math.max(0, i.guests.children || 0);
  params.set("children", String(children));
  if (children > 0 && i.guests.childrenAges?.length) {
    // Comma-delimited ages (Expedia accepts this format on most deep links)
    params.set("childrenAges", i.guests.childrenAges.slice(0, children).join(","));
  }

  // Optional: hotel search intent flags commonly accepted by Expedia PWAs.
  params.set("pwa", "true");
  params.set("searchType", "HOTEL");

  return `${AFFILIATE_BASE}?${params.toString()}`;
}

// Legacy alias for backwards compatibility
export function buildHotelSearchUrl(p: { destination: string; checkIn?: string; checkOut?: string; adults?: number; children?: number; }) {
  return buildExpediaAffiliateUrl({
    destination: p.destination,
    checkIn: p.checkIn || null,
    checkOut: p.checkOut || null,
    guests: { adults: p.adults || 2, children: p.children || 0 }
  });
}

/** Perform a hard redirect (no iframe, no popup) */
export function redirectToExpedia(input: DeepLinkInput | { destination: string; checkIn?: string; checkOut?: string; adults?: number; children?: number; }) {
  let url: string;
  
  // Handle both new DeepLinkInput format and legacy SearchParams format
  if ('guests' in input) {
    url = buildExpediaAffiliateUrl(input);
  } else {
    url = buildHotelSearchUrl(input);
  }
  
  // Use assign() so the browser sends Referer to affiliate and preserves cookies
  window.location.assign(url);
}
