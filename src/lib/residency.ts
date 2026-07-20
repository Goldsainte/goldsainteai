// residency.ts — Seller of Travel (SOT) residency gate (2026-07-19)
//
// Five states require Seller of Travel registration with extraterritorial
// reach (they apply when selling travel to their residents, wherever the
// seller is located): California, Florida, Hawaii, Iowa, and Washington.
// Until Goldsainte's host-agency / registration structure is in place,
// trip purchases by residents of these states are not accepted.
//
// Scope: TRIP bookings only. Creator services and travel guides are not
// travel sales and are not gated here.
//
// Enforcement is SERVER-SIDE in the trip-checkout-create edge function —
// this module supplies the shared UI vocabulary so every purchase surface
// asks the same question the same way.

export const SOT_BLOCKED_STATES = ["CA", "FL", "HI", "IA", "WA"] as const;

export const SOT_BLOCKED_STATE_NAMES =
  "California, Florida, Hawaii, Iowa, or Washington";

export const SOT_BLOCKED_MESSAGE =
  "Trip bookings aren't yet available to residents of California, Florida, Hawaii, Iowa, or Washington. We're working to expand availability — creator services and travel guides remain available everywhere.";

export function isSotBlockedState(code?: string | null): boolean {
  if (!code) return false;
  return (SOT_BLOCKED_STATES as readonly string[]).includes(
    code.trim().toUpperCase()
  );
}

export const US_RESIDENCE_OPTIONS: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "INTL", name: "Outside the United States" },
];

// ---------------------------------------------------------------------------
// WORLD COUNTRIES (2026-07-19): agents are a global marketplace — their
// country of operation is captured at application and shown on their public
// profile and on every trip listing (seller-of-record identification).
// This is the seller's home country, distinct from `destinations` (where
// they sell) and from residency (traveler-side SOT gating above).
// ---------------------------------------------------------------------------
export const WORLD_COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" }, { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" }, { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" }, { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" }, { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" }, { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" }, { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" }, { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" }, { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" }, { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" }, { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" }, { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" }, { code: "CR", name: "Costa Rica" },
  { code: "JP", name: "Japan" }, { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" }, { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" }, { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" }, { code: "VN", name: "Vietnam" },
  { code: "IN", name: "India" }, { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" }, { code: "IL", name: "Israel" },
  { code: "TR", name: "Türkiye" }, { code: "ZA", name: "South Africa" },
  { code: "KE", name: "Kenya" }, { code: "MA", name: "Morocco" },
  { code: "EG", name: "Egypt" }, { code: "TZ", name: "Tanzania" },
  { code: "KR", name: "South Korea" }, { code: "TW", name: "Taiwan" },
  { code: "OTHER", name: "Other" },
];

export function countryName(code?: string | null): string | null {
  if (!code) return null;
  const hit = WORLD_COUNTRIES.find((c) => c.code === code.trim().toUpperCase());
  return hit ? hit.name : code;
}
