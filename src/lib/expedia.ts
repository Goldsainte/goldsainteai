export type GuestBreakdown = { 
  adults: number; 
  children: number; 
};

export type SearchParams = {
  destination: string;
  checkIn?: string;   // YYYY-MM-DD
  checkOut?: string;  // YYYY-MM-DD
  guests?: GuestBreakdown;
};

const AFFILIATE_BASE = "https://expedia.com/affiliates/expedia-home.bexNBHE";

export function buildExpediaAffiliateUrl(p: SearchParams) {
  const params = new URLSearchParams();

  if (p.destination) params.set("destination", p.destination);
  if (p.checkIn)     params.set("startDate", p.checkIn);
  if (p.checkOut)    params.set("endDate",   p.checkOut);

  if (p.guests) {
    params.set("adults",   String(p.guests.adults   ?? 2));
    params.set("children", String(p.guests.children ?? 0));
  }

  const qs = params.toString();
  return qs ? `${AFFILIATE_BASE}?${qs}` : AFFILIATE_BASE;
}

// Helper function for direct redirect
export function redirectToExpedia(params: SearchParams) {
  const url = buildExpediaAffiliateUrl(params);
  console.log("Redirecting to Expedia affiliate URL:", url);
  window.location.href = url;
}
