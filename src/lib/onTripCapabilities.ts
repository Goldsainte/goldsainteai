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


// ---------------------------------------------------------------------------
// PROPOSAL FIELDS — the questions a hire proposal asks, PER CAPABILITY.
// This is what makes a content-creation reply ask content questions and a
// photography reply ask photography questions. Founder-editable: add/remove
// fields here and the hire composer updates everywhere.
// ---------------------------------------------------------------------------
export interface ProposalField {
  id: string;
  label: string;
  type: "number" | "text" | "textarea" | "select" | "radio" | "multiselect" | "date";
  options?: string[];
  placeholder?: string;
  suffix?: string; // e.g. "days", "sessions"
  /** Section eyebrow rendered when it changes from the previous field. */
  section?: string;
  /** Attach the AI rewrite assistant (text/textarea fields). */
  withAI?: boolean;
}

export const CAPABILITY_PROPOSAL_FIELDS: Record<string, ProposalField[]> = {
  content: [
    // 3. Content style — sets expectations
    { id: "content_style", label: "Content style", type: "multiselect", section: "Content style",
      options: ["Lifestyle", "Luxury", "Adventure", "Food", "Couple", "Family", "Editorial", "Documentary", "Social-first", "Cinematic"] },
    // 4. Shooting schedule — no surprise all-day cameras
    { id: "shooting", label: "Typical filming commitment", type: "radio", section: "Shooting schedule",
      options: ["2\u20133 hours/day", "Half day", "Full day", "Flexible"] },
    // 5. Deliverables breakdown
    { id: "photos", label: "Edited photos", type: "number", placeholder: "200", section: "Deliverables" },
    { id: "reels", label: "Instagram Reels", type: "number", placeholder: "5", section: "Deliverables" },
    { id: "stories", label: "Stories", type: "number", placeholder: "10", section: "Deliverables" },
    { id: "recap", label: "Cinematic recap videos", type: "number", placeholder: "1", section: "Deliverables" },
    { id: "extras", label: "Also included", type: "multiselect", section: "Deliverables",
      options: ["Drone footage", "Raw files on request", "Same-day social edits", "Behind-the-scenes"] },
    { id: "delivery_days", label: "Delivery after the trip", type: "number", placeholder: "10", suffix: "days", section: "Deliverables" },
    { id: "usage", label: "Usage rights", type: "select", section: "Deliverables",
      options: ["Personal use only", "Personal + my social channels", "Full commercial rights"] },
    // 6. Editing style
    { id: "editing", label: "Editing style", type: "select", section: "Editing style",
      options: ["Natural", "Luxury editorial", "Bright & airy", "Moody", "Documentary", "Creator's signature style"] },
    // 7. Equipment
    { id: "equipment", label: "I'll be bringing", type: "multiselect", section: "Equipment",
      options: ["Professional camera", "Drone", "GoPro / action cam", "Gimbal", "Lighting", "Audio kit"] },
  ],
  photography: [
    { id: "sessions", label: "Dedicated shoot sessions", type: "number", placeholder: "4" },
    { id: "edited_images", label: "Edited images delivered", type: "number", placeholder: "150" },
    { id: "locations", label: "Shoot locations", type: "text", placeholder: "Colosseum at dawn, Trastevere\u2026" },
    { id: "delivery_days", label: "Delivery after the trip", type: "number", placeholder: "14", suffix: "days" },
  ],
  guide: [
    { id: "coverage", label: "Guiding coverage", type: "select", options: ["Full days", "Half days", "Flexible / on-call"] },
  ],
  host: [
    { id: "coverage", label: "Hosting coverage", type: "select", options: ["Full days", "Half days", "Flexible / on-call"] },
    { id: "handles", label: "What I'll handle", type: "text", placeholder: "Reservations, replanning, the ground game" },
  ],
  translator: [
    { id: "coverage", label: "Translation coverage", type: "select", options: ["Throughout the day", "Key moments only"] },
  ],
  driver: [
    { id: "vehicle", label: "Vehicle", type: "text", placeholder: "Mercedes V-Class, seats 6" },
    { id: "coverage", label: "Driving coverage", type: "select", options: ["Full days", "Airport + day trips"] },
  ],
  family: [
    { id: "ages", label: "Children's ages", type: "text", placeholder: "4 and 7" },
    { id: "hours", label: "Hours per day", type: "number", placeholder: "6", suffix: "hrs/day" },
  ],
  companion: [],
  coach: [
    { id: "skill", label: "Skill", type: "text", placeholder: "Surfing" },
    { id: "sessions", label: "Coaching sessions", type: "number", placeholder: "6" },
  ],
  food: [
    { id: "experiences", label: "Food & wine experiences led", type: "number", placeholder: "5" },
    { id: "focus", label: "Focus", type: "text", placeholder: "Roman trattorias, natural wine" },
  ],
  shopping: [
    { id: "focus", label: "Shopping focus", type: "text", placeholder: "Vintage, ateliers, markets" },
  ],
  occasion: [
    { id: "occasion", label: "The occasion", type: "text", placeholder: "Proposal at sunset" },
    { id: "scope", label: "What I'll produce", type: "text", placeholder: "Location, florist, photographer, timing" },
  ],
};
