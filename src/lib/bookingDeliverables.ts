// Derives the "what's being delivered" checklist on a booking page from the
// real hire_capabilities the two sides agreed to (stored in
// trip_requests.source_metadata.hire_capabilities). A photographer never shows
// "Restaurants"; a concierge never shows "Photo gallery". Falls back to a
// single graceful line when capability data is absent (older/edge bookings).
// Shared by the traveler page and the partner page so both stay in sync.
import { capLabel } from "@/lib/onTripCapabilities";

/** Optional translator: (key, defaultValue) => string. Localized pages pass
 *  i18next's t; the partner page omits it until its own batch and every
 *  string falls back to the English default. */
export type TFn = (key: string, defaultValue: string) => string;
const idT: TFn = (_k, d) => d;

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
  perspective: "traveler" | "partner",
  t: TFn = idT
): string {
  const caps = capabilities ?? [];
  const has = (c: string) => caps.includes(c);
  if (perspective === "partner") return "What you're delivering";
  // Traveler perspective — verb matches the work. {name} is a stable token
  // translators must keep; it's filled manually below.
  const fill = (s: string) => s.split("{name}").join(firstName);
  if (has("content") || has("photography")) return fill(t("bk.deliv.capturing", "What {name} is capturing"));
  if (has("host") || has("guide")) return fill(t("bk.deliv.putting", "What {name} is putting together"));
  return fill(t("bk.deliv.arranging", "What {name} is arranging"));
}

/** The eyebrow above the deliverables section. */
export function deliverablesEyebrow(perspective: "traveler" | "partner", t: TFn = idT): string {
  return perspective === "partner" ? "The engagement" : t("bk.deliv.eyebrow", "Your trip, assembled");
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

/** Localized form of the fallback line; the const above remains for callers
 *  not yet threading a translator. */
export function deliverablesFallback(t: TFn = idT): string {
  return t("bk.deliv.fallback", DELIVERABLES_FALLBACK);
}

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
const travelerJourneys = (t: TFn): Record<Persona, JourneyCopy> => ({
  creative: {
    trackerEyebrow: t("bk.j.creative.eyebrow", "Your session, step by step"),
    progressLabel: t("bk.j.creative.progress", "of your session arranged"),
    steps: [
      { title: t("bk.j.creative.s1t", "Your session is booked"), sub: t("bk.j.creative.s1s", "You're all set — {name} takes it from here.") },
      { title: t("bk.j.creative.s2t", "Your dates are locked in"), sub: t("bk.j.creative.s2s", "{name} has confirmed and your spot is held.") },
      { title: t("bk.j.creative.s3t", "Everything's planned"), sub: t("bk.j.creative.s3s", "Nothing left for you to do but show up.") },
      { title: t("bk.j.creative.s4t", "{name} is shooting"), sub: t("bk.j.creative.s4s", "Your photos are being taken as each session happens.") },
      { title: t("bk.j.creative.s5t", "Your photos are being edited"), sub: t("bk.j.creative.s5s", "{name} is picking the best shots and finishing them up.") },
      { title: t("bk.j.creative.s6t", "Your gallery is ready"), sub: t("bk.j.creative.s6s", "Have a look, and once you're happy, you're all done.") },
    ],
  },
  family: {
    trackerEyebrow: t("bk.j.family.eyebrow", "Your support, step by step"),
    progressLabel: t("bk.j.family.progress", "of your support arranged"),
    steps: [
      { title: t("bk.j.family.s1t", "Your support is booked"), sub: t("bk.j.family.s1s", "You're all set — {name} takes it from here.") },
      { title: t("bk.j.family.s2t", "Your dates are locked in"), sub: t("bk.j.family.s2s", "{name} has confirmed and your dates are held.") },
      { title: t("bk.j.family.s3t", "Everything's ready"), sub: t("bk.j.family.s3s", "Nothing left for you to do.") },
      { title: t("bk.j.family.s4t", "{name} is on hand"), sub: t("bk.j.family.s4s", "An extra set of hands, right when you need them.") },
      { title: t("bk.j.family.s5t", "Your trip is underway"), sub: t("bk.j.family.s5s", "{name} is just a message away the whole time.") },
      { title: t("bk.j.family.s6t", "Your trip's a wrap"), sub: t("bk.j.family.s6s", "Once you're back and all's well, you're all done.") },
    ],
  },
  trip: {
    trackerEyebrow: t("bk.j.trip.eyebrow", "Your trip, step by step"),
    progressLabel: t("bk.j.trip.progress", "of your trip planned"),
    steps: [
      { title: t("bk.j.trip.s1t", "Your trip is booked"), sub: t("bk.j.trip.s1s", "You're all set — {name} takes it from here.") },
      { title: t("bk.j.trip.s2t", "Your spot is held"), sub: t("bk.j.trip.s2s", "{name} has confirmed and your dates are locked in.") },
      { title: t("bk.j.trip.s3t", "Everything's arranged"), sub: t("bk.j.trip.s3s", "Nothing left for you to do but pack.") },
      { title: t("bk.j.trip.s4t", "{name} is planning your days"), sub: t("bk.j.trip.s4s", "Your bookings and plans show up here as they're set.") },
      { title: t("bk.j.trip.s5t", "Your trip is underway"), sub: t("bk.j.trip.s5s", "{name} is just a message away the whole time.") },
      { title: t("bk.j.trip.s6t", "Your trip's a wrap"), sub: t("bk.j.trip.s6s", "Once you're back and all's well, you're all done.") },
    ],
  },
  generic: {
    trackerEyebrow: t("bk.j.generic.eyebrow", "Your trip, step by step"),
    progressLabel: t("bk.j.generic.progress", "of your trip planned"),
    steps: [
      { title: t("bk.j.generic.s1t", "Your trip is booked"), sub: t("bk.j.generic.s1s", "You're all set — {name} takes it from here.") },
      { title: t("bk.j.generic.s2t", "Your spot is held"), sub: t("bk.j.generic.s2s", "{name} has confirmed and your dates are locked in.") },
      { title: t("bk.j.generic.s3t", "Everything's arranged"), sub: t("bk.j.generic.s3s", "Nothing left for you to do but pack.") },
      { title: t("bk.j.generic.s4t", "{name} is putting it together"), sub: t("bk.j.generic.s4s", "The details show up here as they're set.") },
      { title: t("bk.j.generic.s5t", "Your trip is underway"), sub: t("bk.j.generic.s5s", "{name} is just a message away the whole time.") },
      { title: t("bk.j.generic.s6t", "Your trip's a wrap"), sub: t("bk.j.generic.s6s", "Once you're back and all's well, you're all done.") },
    ],
  },
});

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
  who: string,
  t: TFn = idT
): JourneyCopy {
  const persona = personaFromCapabilities(capabilities);
  const table = perspective === "partner" ? PARTNER_JOURNEYS : travelerJourneys(t);
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
