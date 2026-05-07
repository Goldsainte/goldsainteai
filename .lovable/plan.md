
## Goal

Reposition the section currently titled **"Built for trips where the details matter"** (the `TrustSafetyPaymentsSection` block in `src/sections/HomeLuxurySections.tsx`, rendered just before the mobile trust footer on `Index.tsx`) so it stops reading as a trust/safety/payments feature panel and instead becomes the homepage's **luxury intelligence layer**.

Visual identity unchanged: cream `#FDF9F0`, dark green `#0c4d47`, gold `#C7A962`, serif headers, rounded UI, soft shadows, generous whitespace, subtle motion.

> Note: Trust, safety, escrow, identity, and dispute messaging already lives in dedicated pages (`/trust-safety`, `TrustSafety.tsx`, `TrustSafetyPage.tsx`) and the mobile `TrustFooterMobile`. Removing it from this homepage slot does not erase it from the product.

## Scope (files touched)

1. `src/sections/HomeLuxurySections.tsx` — rewrite the `TrustSafetyPaymentsSection` body (rename the export to `LuxuryIntelligenceSection`, keep a backward-compatible re-export so `Index.tsx` keeps working without churn — or update `Index.tsx` to use the new name).
2. `src/pages/Index.tsx` — swap the import/usage to `LuxuryIntelligenceSection`.
3. `src/i18n/locales/en.json` — replace the `home.trustSafety.*` keys' English copy with the new luxury intelligence content (keep the same key shape so other locales / fallback don't break; non-English locales can stay until translated).
4. `src/pages/HomePage.tsx` — only if it also renders this section under the old name; update import accordingly.

Out of scope: the dedicated `/trust-safety` pages, mobile trust footer, and any other home section.

## New section content

**Eyebrow pill (dark green, gold text — match the rest of the homepage):**
`Luxury Intelligence`

**Gold divider:** `w-14 h-px bg-[#C7A962]` centered (or left-aligned to match the section's existing left-aligned header — keep current alignment).

**Headline:**
*Where Extraordinary Travel Feels Effortless*

**Subhead:**
Goldsainte combines intelligent planning, seamless collaboration, and curated personalization to make complex travel feel beautifully simple.

**Four pillars (replacing the four trust items):**

| Icon | Title | Body |
|---|---|---|
| `Sparkles` | Intelligent Personalization | AI adapts every journey around your preferences, pace, travel style, and the experiences you love most. |
| `Users` (or `Handshake`) | Seamless Collaboration | Travelers, creators, and travel experts coordinate effortlessly inside one beautifully organized space. |
| `Compass` (or `Wand2`) | Curated Travel Intelligence | From hidden gems to luxury upgrades, Goldsainte surfaces recommendations tailored specifically to your journey. |
| `Map` (or `Calendar`) | Effortless Coordination | Flights, stays, experiences, and timelines stay seamlessly connected from inspiration through arrival. |

Each pillar drops the existing 4-item `subFeatures` grid — that grid is exactly the SaaS density the user wants to remove. Pillars become a clean editorial accordion: tap a pillar → it expands to a single elegant paragraph (one short emotional line, not a feature grid). Or, alternative, render as a quiet 4-card editorial set (no accordion). See "Layout choice" below.

## Layout choice

The current implementation is a 2-column layout: left = accordion of 4 items with 4-feature sub-grids; right = an editorial image card with "Protected Journeys" overlay.

**Replace with a calmer editorial composition (still 2-column on desktop, stacked on mobile):**

- **Left column (55%):** Eyebrow pill → divider → headline → subhead → a vertical list of the 4 pillars rendered as static editorial rows (icon in soft gold circle, serif title, single-line body). No accordion, no sub-feature grid. 28–32px vertical spacing between pillars; thin `#E5DFC6` hairline dividers between them. Subtle fade-in-on-scroll for each row (already-defined `animate-in fade-in slide-in-from-bottom-3` is fine).
- **Right column (45%):** Replace the "Protected Journeys" image and overlay with a more aspirational, less security-themed luxury travel image (e.g. a serene infinity pool, Amalfi terrace, or Kyoto morning — pick one already in `src/assets`, no new uploads). Replace the on-image overlay with a refined caption pill: gold sparkle + serif italic line *"Quietly orchestrated by Goldsainte intelligence."* Keep the soft offset frame and 32px radius for continuity with the rest of the homepage.

This removes ~40% of the in-section content density — directly addressing the "feature-grid energy" critique — while staying on-brand and using existing components/tokens.

## Copy updates in `en.json`

Replace the values for these keys (keys themselves stay the same to avoid touching other locales / templates):

- `home.trustSafety.badge` → `Luxury Intelligence`
- `home.trustSafety.title` → `Where Extraordinary Travel Feels Effortless`
- `home.trustSafety.description` → `Goldsainte combines intelligent planning, seamless collaboration, and curated personalization to make complex travel feel beautifully simple.`
- `home.trustSafety.item1.title` → `Intelligent Personalization`
- `home.trustSafety.item1.body` → `AI adapts every journey around your preferences, pace, travel style, and the experiences you love most.`
- `home.trustSafety.item2.title` → `Seamless Collaboration`
- `home.trustSafety.item2.body` → `Travelers, creators, and travel experts coordinate effortlessly inside one beautifully organized space.`
- `home.trustSafety.item3.title` → `Curated Travel Intelligence`
- `home.trustSafety.item3.body` → `From hidden gems to luxury upgrades, Goldsainte surfaces recommendations tailored specifically to your journey.`
- `home.trustSafety.item4.title` → `Effortless Coordination`
- `home.trustSafety.item4.body` → `Flights, stays, experiences, and timelines stay seamlessly connected from inspiration through arrival.`

If you'd prefer cleaner key names (e.g. `home.luxuryIntelligence.*`), I can do that in the implementation pass too — flag if you want a rename, otherwise I'll keep keys stable to avoid translation churn.

## Visual / motion rules

- Generous whitespace: `py-20 md:py-28` (up from current `py-16 md:py-24`).
- One H2 only; serif `font-secondary`, sized `text-[28px] md:text-[44px]`.
- Pillar titles in `font-secondary` `text-lg md:text-xl`, body in `text-sm md:text-[15px] text-[#5A5A5A]`.
- Soft gold icon circles (`bg-[#C7A962]/10`, `text-[#C7A962]`), 40px diameter — no hard-edged feature tiles.
- Subtle stagger: each pillar fades in 80ms after the previous on scroll.
- No badges, no "Protected" overlays, no 8-icon sub-grids.

## Out of scope

- No new routes, no DB changes, no edge functions.
- No changes to `/trust-safety` pages.
- No new imagery assets (reuse what's in `src/assets`).
- Non-English locale files left as-is for translation in a follow-up.

## Acceptance check

After implementation:
- The section title reads *"Where Extraordinary Travel Feels Effortless."*
- No accordion, no sub-feature grid, no security icons in the section.
- Four short editorial pillars about personalization, collaboration, intelligence, coordination.
- Right column shows an aspirational luxury travel image with a single elegant italic caption — no shield/lock messaging.
- Section reads in under 5 seconds and feels like editorial storytelling, not a feature panel.
- Mobile (≤640px) stacks pillars vertically with the same calm spacing.
