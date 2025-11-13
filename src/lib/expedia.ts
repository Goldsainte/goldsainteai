export type GuestCounts = { adults: number; childrenAges: number[] };

export function buildExpediaStaysUrl(opts: {
  base?: string;
  destination: string;
  checkIn: Date;
  checkOut: Date;
  guests: GuestCounts;
}): string {
  const base = opts.base ?? (import.meta.env.VITE_EXPEDIA_AFFILIATE_BASE || "https://www.expedia.com");

  const d1 = opts.checkIn.toISOString().slice(0, 10);
  const d2 = opts.checkOut.toISOString().slice(0, 10);

  const childrenParam = opts.guests.childrenAges.length
    ? `&children=${encodeURIComponent(opts.guests.childrenAges.join(","))}`
    : "&children=0";

  const tag = import.meta.env.VITE_EXPEDIA_AFFILIATE_TAG
    ? `&${import.meta.env.VITE_EXPEDIA_AFFILIATE_TAG}`
    : "";

  const url = `${base}/Hotel-Search?destination=${encodeURIComponent(opts.destination)}&d1=${d1}&d2=${d2}&adults=${opts.guests.adults}${childrenParam}${tag}`;

  return url;
}
