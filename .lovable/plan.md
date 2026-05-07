## Vision

Evolve `/marketplace` from a beautifully designed static catalog into a living, creator-powered, AI-personalized luxury commerce ecosystem — without breaking the editorial Goldsainte aesthetic (cream bg, dark green CTA, gold accents, serif headers, 4/3 image cards).

The work is grouped into 6 phases. Each phase ships independently and is visually subtle.

---

## Phase 1 — Creator-First Trip Cards

Make `LiveTripCard` lead with the human, not just the trip.

Add below the image, above the title:
- Small circular creator avatar (24px) + creator name in serif italic
- "Curated by {name} · {home_base}" microcopy in muted gold
- One travel-style chip pulled from `creator.style_tags` (e.g. "Quiet Luxury")

Add a tiny bottom-row metadata strip:
- Save count ("Saved 2.3k times") — subtle, no icon flood
- One soft social-proof line when applicable ("120 travelers booked")

New file: `src/components/marketplace/CreatorAttribution.tsx` — reusable inline attribution block used on cards and trip detail.

Extend the `LiveTripCard` `trip` prop to accept `creator { id, full_name, avatar_url, home_base, style_tags }` and `save_count`, `booking_count`. Update the `Marketplace.tsx` query select to fetch `home_base, style_tags` from `profiles` and aggregate counts.

---

## Phase 2 — Living Marketplace Signals

Introduce subtle "alive" indicators across the grid:
- New component `LiveSignalRow` shown above the trip grid: a soft horizontal scroll of capsules — "Trending This Week", "Recently Booked", "New Creator Collection", "Saved 2.3k times this month" — sourced from real DB aggregates (booking counts, recent saves, recent published trips).
- Per-card overlay tag (top-left, only when truthy): `Trending`, `New`, `Almost Booked`, `Recently Booked` — small cream pill with thin dark-green border, no neon urgency.
- Add a "Quietly Active" footer line under the grid: "12 travelers are exploring this collection right now" using Supabase Realtime presence on the marketplace channel.

These tags must feel editorial (serif label, lots of whitespace) — never red badges or countdowns.

---

## Phase 3 — Invisible AI Personalization Layer

Surface AI without chatbot UI.

- New row `ForYouRow` rendered above the main grid (only for authenticated travelers): horizontally scrolling 4/3 cards with floating tag — "Matches your travel style", "Because you explored Japan", "Inspired by your saved retreats". Powered by an existing matching/embedding service (`src/services/matchingService.ts` + `src/lib/matching/types.ts`) extended with a `recommendForUser(userId)` method.
- Floating "Why this?" affordance on each personalized card → opens a soft popover with the matched signals (tag overlap, region, vibe).
- Adaptive sort: when user is signed-in, default sort becomes "Personalized" with an unobtrusive sort dropdown (Personalized / Newest / Editor's Picks).
- New dynamic collection rows below grid: "Slow Luxury", "Quiet Wellness", "Hidden Cities" — generated from creator `style_tags` clusters; cached server-side, refreshed daily.

All copy is whisper-soft. No "AI" branding visible in UI; behave like editorial intuition.

---

## Phase 4 — Signature "Make It Mine" Interaction

The unforgettable Goldsainte moment, lives on `TripDetailPage`.

Add a `MakeItMinePanel` directly under the hero:
- Five elegant chips: Slower Pace · Wellness Focus · Luxury Upgrade · Food & Wine · Adventure
- Selecting chips triggers a cinematic transformation (300–500ms cross-fade) of:
  - Hotel images and names in the itinerary
  - Daily activity blocks
  - Dining suggestions
  - Map waypoints
  - Estimated price recalculated softly
- Powered by an edge function `personalize-trip` that calls Lovable AI (per project memory, project uses direct OpenAI gpt-4o, so use that) with the base itinerary + selected modifiers and returns a structured JSON variant.
- When a variant is active, a small serif strip appears: "Your version of {trip.title}" with a "Save my version" CTA that persists to a new `trip_variants` table.

The animation is the centerpiece — must feel cinematic, not jumpy. Use `framer-motion` `AnimatePresence` with staggered children, soft blur cross-fades, gold underline sweep on the active chip.

---

## Phase 5 — Editorial Itinerary Upgrade

Enhance the existing `TripItinerary` component on detail pages:
- Vertical gold timeline rail with serif day labels ("Day 01 · Arrival in Oia")
- Layered hero image per day (image left, story-driven copy right on desktop; stacked on mobile)
- Inline mini-map (Mapbox static image) per day showing the day's waypoints
- Pull-quotes from creator: "Sofia says: skip the cable car at sunset — walk it."
- Replace bullet inclusions with a tasteful two-column editorial layout

Keep typography: Cormorant/serif for section heads, current body font for prose. No icons-as-decoration.

---

## Phase 6 — Soft Trust & Ecosystem Proof

Add an understated trust bar to cards and detail pages:
- "Verified Creator" thin badge (gold hairline border, no fill)
- "Certified Travel Expert" where applicable
- Small "★ 4.9 · 38 reviews" line (no big star ratings)
- "Featured in The Edit · May" when curated

On the marketplace page, add a serif footer block: "This week on Goldsainte" — counts of new creators, new collections, recent bookings — rendered as editorial stat lines, not dashboard tiles.

---

## Technical Notes

Files to add:
- `src/components/marketplace/CreatorAttribution.tsx`
- `src/components/marketplace/LiveSignalRow.tsx`
- `src/components/marketplace/ForYouRow.tsx`
- `src/components/marketplace/AdaptiveCollectionRow.tsx`
- `src/components/trips/MakeItMinePanel.tsx`
- `src/components/trips/EditorialDayBlock.tsx`
- `src/components/marketplace/TrustHairline.tsx`
- `src/components/marketplace/ThisWeekFooter.tsx`

Files to modify:
- `src/pages/Marketplace.tsx` — orchestrate new rows, extend query, adaptive sort
- `src/components/marketplace/LiveTripCard.tsx` — creator attribution + signal pill
- `src/components/marketplace/LiveTripGrid.tsx` — accept signal metadata
- `src/pages/trips/TripDetailPage.tsx` — mount `MakeItMinePanel` + editorial itinerary
- `src/components/trips/TripItinerary.tsx` — editorial day layout
- `src/services/matchingService.ts` — add `recommendForUser`

Backend:
- Migration: `trip_variants` table (user_id, trip_id, modifiers jsonb, generated_itinerary jsonb) with RLS (user owns their variants).
- Migration: materialized view or RPC for `marketplace_signals` (trending, recently_booked, save_counts) refreshed hourly.
- Edge function: `personalize-trip` calling OpenAI gpt-4o per project mandate.
- Realtime presence channel `marketplace-presence` for the "quietly active" footer.

Order of execution: Phase 1 → 2 → 4 → 3 → 5 → 6. Phase 4 is the signature moment and ships before broader AI rows so it grounds the AI narrative.

Design guardrails enforced in every phase: cream bg, dark green CTAs only, gold hairlines (not fills), serif headers, 4/3 image cards, no urgency/discount styling, animations stay sub-500ms with soft easing.
