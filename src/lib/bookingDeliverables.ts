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
      { title: "Your session is booked", sub: "You're all set — {name} takes it from here." },
      { title: "Your dates are locked in", sub: "{name} has confirmed and your spot is held." },
      { title: "Everything's planned", sub: "Nothing left for you to do but show up." },
      { title: "{name} is shooting", sub: "Your photos are being taken as each session happens." },
      { title: "Your photos are being edited", sub: "{name} is picking the best shots and finishing them up." },
      { title: "Your gallery is ready", sub: "Have a look, and once you're happy, you're all done." },
    ],
  },
  family: {
    trackerEyebrow: "Your support, step by step",
    progressLabel: "of your support arranged",
    steps: [
      { title: "Your support is booked", sub: "You're all set — {name} takes it from here." },
      { title: "Your dates are locked in", sub: "{name} has confirmed and your dates are held." },
      { title: "Everything's ready", sub: "Nothing left for you to do." },
      { title: "{name} is on hand", sub: "An extra set of hands, right when you need them." },
      { title: "Your trip is underway", sub: "{name} is just a message away the whole time." },
      { title: "Your trip's a wrap", sub: "Once you're back and all's well, you're all done." },
    ],
  },
  trip: {
    trackerEyebrow: "Your trip, step by step",
    progressLabel: "of your trip planned",
    steps: [
      { title: "Your trip is booked", sub: "You're all set — {name} takes it from here." },
      { title: "Your spot is held", sub: "{name} has confirmed and your dates are locked in." },
      { title: "Everything's arranged", sub: "Nothing left for you to do but pack." },
      { title: "{name} is planning your days", sub: "Your bookings and plans show up here as they're set." },
      { title: "Your trip is underway", sub: "{name} is just a message away the whole time." },
      { title: "Your trip's a wrap", sub: "Once you're back and all's well, you're all done." },
    ],
  },
  generic: {
    trackerEyebrow: "Your trip, step by step",
    progressLabel: "of your trip planned",
    steps: [
      { title: "Your trip is booked", sub: "You're all set — {name} takes it from here." },
      { title: "Your spot is held", sub: "{name} has confirmed and your dates are locked in." },
      { title: "Everything's arranged", sub: "Nothing left for you to do but pack." },
      { title: "{name} is putting it together", sub: "The details show up here as they're set." },
      { title: "Your trip is underway", sub: "{name} is just a message away the whole time." },
      { title: "Your trip's a wrap", sub: "Once you're back and all's well, you're all done." },
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
      { title: "Support the trip", sub: "Be the extra set of hands, throughout." },
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
