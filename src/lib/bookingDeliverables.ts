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

// ============================================================================
// PERSONA-AWARE JOURNEY
// The timeline and "happening now" voice must match the kind of work. A
// photographer's arc is plan → shoot → edit → deliver a gallery; a trip
// specialist's arc is secure → arrange → design the days → the trip itself.
// Persona is derived from the same hire_capabilities the deliverables use, so
// there is ONE source of truth. Founder-editable: adjust the wording in the
// PERSONA_JOURNEYS map and the whole booking experience updates for both the
// traveler and the partner. IDs referenced here are the stable capability IDs
// from onTripCapabilities.ts.
// ============================================================================

export type Persona = "creative" | "family" | "trip" | "generic";

/** Map a capability set to a persona. First creative/family capability wins;
 *  any other capability is a trip; no capabilities at all is generic (a plain
 *  travel specialist / older booking). */
export function personaFromCapabilities(
  capabilities: string[] | null | undefined
): Persona {
  const caps = (capabilities ?? []).filter(Boolean);
  if (caps.length === 0) return "generic";
  if (caps.some((c) => c === "photography" || c === "content")) return "creative";
  if (caps.some((c) => c === "family")) return "family";
  return "trip";
}

export interface JourneyStep {
  title: string;
  sub: string;
}
export interface JourneyCopy {
  /** The six ordered steps, worded for the persona + perspective. */
  steps: [JourneyStep, JourneyStep, JourneyStep, JourneyStep, JourneyStep, JourneyStep];
  /** Eyebrow over the whole tracker, e.g. "Your journey, step by step". */
  trackerEyebrow: string;
  /** Label under the % number, e.g. "of your journey arranged". */
  progressLabel: string;
}

// Traveler-facing journeys, by persona. {name} is replaced with the
// specialist's first name. Six steps, always in the same lifecycle order:
// reserved → secured → prepared → in-progress(you're here) → begins → complete.
const TRAVELER_JOURNEYS: Record<Persona, JourneyCopy> = {
  creative: {
    trackerEyebrow: "Your session, step by step",
    progressLabel: "of your session arranged",
    steps: [
      { title: "Your session is reserved", sub: "Everything from here is looked after, start to finish." },
      { title: "Your session is secured", sub: "{name} is confirmed and your dates are held." },
      { title: "Your shoot is fully planned", sub: "Nothing more is needed from you." },
      { title: "{name} is capturing your trip", sub: "Your moments are being shot as each session happens." },
      { title: "Your gallery is being edited", sub: "{name} is selecting and finishing your images." },
      { title: "Your gallery is delivered", sub: "Once you've received everything and all is well, you close it out." },
    ],
  },
  family: {
    trackerEyebrow: "Your support, step by step",
    progressLabel: "of your support arranged",
    steps: [
      { title: "Your support is reserved", sub: "Everything from here is looked after, start to finish." },
      { title: "Your dates are secured", sub: "{name} is confirmed and your dates are held." },
      { title: "Everything is prepared", sub: "Nothing more is needed from you." },
      { title: "{name} is supporting your trip", sub: "An extra capable pair of hands, there when you need it." },
      { title: "Your trip begins", sub: "{name} is with you throughout, a message away." },
      { title: "Your trip is complete", sub: "Once you've returned and all is well, you close it out." },
    ],
  },
  trip: {
    trackerEyebrow: "Your journey, step by step",
    progressLabel: "of your journey arranged",
    steps: [
      { title: "Your journey is reserved", sub: "Everything from here is looked after, start to finish." },
      { title: "Your place is secured", sub: "{name} is confirmed and your dates are held." },
      { title: "Your trip is fully arranged", sub: "Nothing more is needed from you." },
      { title: "{name} is designing your days", sub: "Your reservations and itinerary appear here as each detail is confirmed." },
      { title: "Your journey begins", sub: "{name} is with you throughout, a message away." },
      { title: "Your journey is complete", sub: "Once you've returned and all is well, you close the journey." },
    ],
  },
  generic: {
    trackerEyebrow: "Your journey, step by step",
    progressLabel: "of your journey arranged",
    steps: [
      { title: "Your journey is reserved", sub: "Everything from here is looked after, start to finish." },
      { title: "Your place is secured", sub: "{name} is confirmed and your dates are held." },
      { title: "Your trip is fully arranged", sub: "Nothing more is needed from you." },
      { title: "{name} is putting your trip together", sub: "The details appear here as each one is confirmed." },
      { title: "Your journey begins", sub: "{name} is with you throughout, a message away." },
      { title: "Your journey is complete", sub: "Once you've returned and all is well, you close the journey." },
    ],
  },
};

// Partner-facing journeys, by persona. {client} is replaced with the client's
// first name. Same six-step lifecycle from the partner's side of the work.
const PARTNER_JOURNEYS: Record<Persona, JourneyCopy> = {
  creative: {
    trackerEyebrow: "This engagement, step by step",
    progressLabel: "of this engagement complete",
    steps: [
      { title: "Booking confirmed", sub: "{client}'s session is confirmed and yours to deliver." },
      { title: "Deposit secured", sub: "The deposit has been charged to your Stripe account." },
      { title: "Paid in full", sub: "The full engagement has been charged directly to you." },
      { title: "Shoot & capture", sub: "Capture the sessions and share previews in Messages as you go." },
      { title: "Edit & deliver the gallery", sub: "Finish the images and deliver the gallery." },
      { title: "Complete", sub: "Once {client} has their gallery and all is well, the engagement closes." },
    ],
  },
  family: {
    trackerEyebrow: "This engagement, step by step",
    progressLabel: "of this engagement complete",
    steps: [
      { title: "Booking confirmed", sub: "{client}'s booking is confirmed and yours to deliver." },
      { title: "Deposit secured", sub: "The deposit has been charged to your Stripe account." },
      { title: "Paid in full", sub: "The full engagement has been charged directly to you." },
      { title: "Prepare for the trip", sub: "Confirm the details and coordinate in Messages." },
      { title: "Support the trip", sub: "Be the capable pair of hands, throughout." },
      { title: "Complete", sub: "Once {client} has returned and all is well, the engagement closes." },
    ],
  },
  trip: {
    trackerEyebrow: "This engagement, step by step",
    progressLabel: "of this engagement complete",
    steps: [
      { title: "Booking confirmed", sub: "{client}'s booking is confirmed and yours to deliver." },
      { title: "Deposit secured", sub: "The deposit has been charged to your Stripe account." },
      { title: "Paid in full", sub: "The full trip has been charged directly to you." },
      { title: "Prepare & share {client}'s reservations", sub: "Confirm the details and share them in Messages as you go." },
      { title: "The trip", sub: "You're a message away throughout." },
      { title: "Complete", sub: "Once {client} has returned and all is well, the engagement closes." },
    ],
  },
  generic: {
    trackerEyebrow: "This engagement, step by step",
    progressLabel: "of this engagement complete",
    steps: [
      { title: "Booking confirmed", sub: "{client}'s booking is confirmed and yours to deliver." },
      { title: "Deposit secured", sub: "The deposit has been charged to your Stripe account." },
      { title: "Paid in full", sub: "The full trip has been charged directly to you." },
      { title: "Prepare & share the details", sub: "Confirm the details and share them in Messages as you go." },
      { title: "The trip", sub: "You're a message away throughout." },
      { title: "Complete", sub: "Once {client} has returned and all is well, the engagement closes." },
    ],
  },
};

/** Get the persona-appropriate journey copy for a booking, with {name}/{client}
 *  interpolated. `who` is the other party's first name (specialist name on the
 *  traveler page, client name on the partner page). */
export function buildJourneyCopy(
  capabilities: string[] | null | undefined,
  perspective: "traveler" | "partner",
  who: string
): JourneyCopy {
  const persona = personaFromCapabilities(capabilities);
  const table = perspective === "partner" ? PARTNER_JOURNEYS : TRAVELER_JOURNEYS;
  const src = table[persona];
  const token = perspective === "partner" ? "{client}" : "{name}";
  const fill = (s: string) => s.split(token).join(who);
  return {
    trackerEyebrow: src.trackerEyebrow,
    progressLabel: src.progressLabel,
    steps: src.steps.map((st) => ({
      title: fill(st.title),
      sub: fill(st.sub),
    })) as JourneyCopy["steps"],
  };
}
