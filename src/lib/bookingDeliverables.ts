// Derives the "what's being delivered" checklist on a booking page from the
// real hire_capabilities the two sides agreed to (stored in
// trip_requests.source_metadata.hire_capabilities). A photographer never shows
// "Restaurants"; a concierge never shows "Photo gallery". Falls back to a
// single graceful line when capability data is absent (older/edge bookings).
// Shared by the traveler page and the partner page so both stay in sync.
import { capLabel } from "@/lib/onTripCapabilities";

export interface DeliverableRow {
  /** Human label, e.g. "Photography sessions" */
  label: string;
  /** Progress state — first two agreed capabilities read as active. */
  state: "active" | "upcoming";
}

/** The section heading adapts to the nature of the engagement. */
export function deliverablesHeading(
  capabilities: string[] | null | undefined,
  firstName: string,
  perspective: "traveler" | "partner"
): string {
  const caps = capabilities ?? [];
  const has = (id: string) => caps.includes(id);
  if (perspective === "partner") return "What you're delivering";
  // Traveler perspective — verb matches the work.
  if (has("content") || has("photography")) return `What ${firstName} is capturing`;
  if (has("host") || has("guide")) return `What ${firstName} is putting together`;
  return `What ${firstName} is arranging`;
}

/** The eyebrow above the deliverables section. */
export function deliverablesEyebrow(perspective: "traveler" | "partner"): string {
  return perspective === "partner" ? "The engagement" : "Your trip, assembled";
}

/**
 * Build the deliverable rows. Returns null when there is no capability data,
 * signalling the caller to render the single generic fallback line instead.
 */
export function buildDeliverables(
  capabilities: string[] | null | undefined
): DeliverableRow[] | null {
  const caps = (capabilities ?? []).filter(Boolean);
  if (caps.length === 0) return null;
  return caps.map((id, i) => ({
    label: capLabel(id),
    state: i < 2 ? "active" : "upcoming",
  }));
}

/** The single line shown when no capability data exists. */
export const DELIVERABLES_FALLBACK =
  "Your specialist is preparing everything for your trip";
