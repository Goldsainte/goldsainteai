// ============================================================================
// ON-TRIP CAPABILITIES — the canonical vocabulary of "what you can hire a
// person onto your trip to do." ONE list, used at every stage: creators
// declare from it, travelers choose from the creator's declared subset, the
// choice rides the request, and the proposal prefills from it — so by the
// time escrow holds a deposit, both sides have agreed to the same named
// scope. Edit LABELS/HINTS here freely; IDs are stored in
// creator_services.includes and trip_requests.source_metadata and must stay
// stable. (Founder: this file is the taxonomy — change wording here only.)
// ============================================================================

export interface OnTripCapability {
  id: string;
  label: string;
  /** Traveler-facing hint shown in pickers. */
  hint: string;
}

export const ON_TRIP_CAPABILITIES: OnTripCapability[] = [
  { id: "content",    label: "Content creation",        hint: "Photo & video of your trip, edited and delivered" },
  { id: "photography",label: "Photography sessions",    hint: "Dedicated shoots — portraits, couples, family" },
  { id: "guide",      label: "Personal guide",          hint: "Knows the place, leads the days" },
  { id: "host",       label: "Trip hosting & concierge",hint: "Reservations, replanning, the ground game" },
  { id: "translator", label: "Translation & local fixer", hint: "Language and access where it matters" },
  { id: "driver",     label: "Driving & transport",     hint: "Behind the wheel, door to door" },
  { id: "family",     label: "Family & childcare support", hint: "An extra capable pair of hands" },
  { id: "companion",  label: "Travel companionship",    hint: "A trusted, strictly platonic travel partner" },
  { id: "coach",      label: "Skill coaching",          hint: "Surf, ski, dive, photography — learn on-trip" },
  { id: "food",       label: "Food & wine guiding",     hint: "Eat and drink like someone who knows" },
  { id: "shopping",   label: "Shopping & style guiding",hint: "The right shops, markets, and ateliers" },
  { id: "occasion",   label: "Occasion planning",       hint: "Proposals, birthdays, moments produced" },
];

const byId = new Map(ON_TRIP_CAPABILITIES.map((c) => [c.id, c]));

/** Map a stored value to its display label. Unknown values (legacy freeform
 *  includes) render as themselves — full backward compatibility. */
export function capLabel(idOrText: string): string {
  return byId.get(idOrText)?.label ?? idOrText;
}

export function capHint(id: string): string | undefined {
  return byId.get(id)?.hint;
}

export function isCapabilityId(v: string): boolean {
  return byId.has(v);
}
