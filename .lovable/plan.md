
## Goal

Lift the homepage from "beautiful marketplace" to "emotionally unforgettable luxury travel ecosystem" by reworking the three animated panels inside the **How Goldsainte Works** section. No new sections, no routing changes — only the in-section animations and their supporting copy. Visual identity stays exactly as-is (cream `#f7f3ea`, dark green `#0c4d47`, gold `#C7A962/#E8C977`, serif display, rounded UI, soft shadows, cinematic motion).

## Scope (files touched)

1. `src/components/home/TravelerDiscoveryMagic.tsx` — rebuild scenes
2. `src/components/home/AgentProposalMagic.tsx` — rebuild scenes
3. `src/components/home/CreatorAIMagic.tsx` — enhance Scene 2 (the AI reconstruction moment)
4. `src/sections/HomeLuxurySections.tsx` — only minor copy/eyebrow tweaks for the three audience tabs if the new scene narrative needs it

Out of scope: hero, marketplace grid, role CTAs, trust section, any backend, any routing. No changes to global tokens or fonts.

---

## 1. Traveler — "Discovery Magic"

Reframe from itinerary/preference panel into **aspirational discovery → personalization → cinematic payoff**.

New 4-scene loop (≈3.6s each, same timing as today):

**Scene 1 — Living marketplace feed**
- Cream canvas with a soft 2-column masonry of trip cards drifting in.
- Each card carries an editorial overline ribbon that animates between: `Trending This Summer`, `Saved 1.2k times`, `Curated by Local Experts`, `Popular in Tokyo`, `Hidden Gem`, `Recommended for You`.
- Tiny floating chips ("32 just saved", "+18 viewing now") fade in/out as subtle social activity.
- Top-left pill: `For You · Curated Daily`.

**Scene 2 — Personalization that visibly transforms**
- A single highlighted trip card centers; preference chips (`Wellness`, `Food & Wine`, `Slow Travel`, `Luxury`, `Adventure`) cycle through being "selected" with a gold underline.
- As each chip activates, the card's **hotel, restaurant, and experience swap in place** with a soft cross-fade and a tiny "Updated" gold tick — showing "Boutique Inn → Canaves Oia · Cliffside Suite", "Casual taverna → Selene Tasting Menu", etc.
- A faint AI sparkle pulse on each swap; copy floats: *"Tuned to your taste in 0.4s."*

**Scene 3 — Cinematic itinerary payoff**
- The card expands into a magazine-style spread: full-bleed hero image area (gradient placeholder, no new assets), a 3-day timeline with elegant day pills, and a soft route line connecting map dots.
- Curated experience cards stack with subtle layered shadows.
- Wishlist heart fills with gold; toast: *"Saved to your wishlist."*

**Scene 4 — "Booked. Curated. Yours."**
- Confirmation card slides up with check, dates, host avatar, and `On-platform protected` shield.
- Gold confetti is **not** used — instead, a single soft gold ring expands once behind the check (premium, restrained).
- Caption: *"Travel planning, effortless and unforgettable."*

Motion rules: fade + 6–10px translate, 400–600ms easings; no parallax, no spinning, no bouncing. Reduced-motion: jump to Scene 3.

---

## 2. Agent — "Concierge Craftsmanship"

Reposition from workflow/inbox into **bespoke luxury studio**.

New 4-scene loop:

**Scene 1 — The Concierge Inbox (aspirational requests)**
- Eyebrow: `Concierge Inbox · 4 new requests`.
- Three stacked request cards with serif italic briefs:
  - *"Luxury honeymoon along the Amalfi Coast — 10 nights, late June."*
  - *"Private safari anniversary journey — Kenya & Tanzania."*
  - *"Wellness retreat in Bali — slow pace, plant-based."*
- Each card has a discrete gold `★ Verified Traveler` chip and budget range; one card highlights with a soft gold border to signal selection.

**Scene 2 — Designing the proposal (craftsmanship)**
- Layout becomes a "designer's table": a left rail of curated assets (hotel chip, restaurant chip, yacht chip, helicopter transfer chip) animates being **dragged** onto a 3-day storyboard on the right.
- Each drop snaps with a soft scale + gold underline and a micro-label (`Stay`, `Dining`, `Yacht`, `Transfer`).
- AI assist whisper appears once: *"Pair Day 02 with Da Adolfo by water taxi"* — accepted with a single tap animation.
- Feels like designing a luxury magazine spread, not editing a form.

**Scene 3 — Elegant proposal presentation**
- Storyboard reflows into a tall "proposal sheet": cover image area, "Prepared for the Bianchi Family" italic line, day cards with serif headers and subtitles ("Positano · Cliffside Arrival — Le Sirenuse · Champagne welcome"), and a discreet investment summary card at the bottom right.
- Subtle page-turn shadow gives a printed-magazine feel.

**Scene 4 — Acceptance moment**
- Traveler avatar reviews → green check pulses → banner slides in: **"Proposal Accepted · Itinerary Confirmed"**.
- Below, a thin progress strip transitions `Proposal → Booked → On-platform escrow secured`.
- Caption: *"White-glove expertise, delivered."*

Motion rules: same as Traveler; no enterprise-y progress bars or kanban columns.

---

## 3. Creator — The signature AI "holy shit" moment

Keep Scenes 1, 3, 4 essentially as-is but **dramatically upgrade Scene 2 (AI reconstruction)** so it becomes the homepage's most memorable beat.

**Enhanced Scene 2 — "Goldsainte understands your journey."**

Choreography (single ~3.6s sequence, layered):

1. The 6 selected memory thumbnails settle into a loose grid.
2. **Floating metadata labels** materialize one-by-one above each tile with a soft gold pulse:
   - `Oia, Santorini` · `5:42 PM · Sunset Viewpoint`
   - `Ammoudi Taverna` · `Day 1 · Beachfront Dinner`
   - `Caldera Viewpoint` · `Day 2 · Morning`
   - `Canaves Oia · Cliffside Suite` · `Day 2 · Stay`
   - `Sunset Catamaran Cruise` · `Day 2 · Afternoon`
   - `Megalochori Winery` · `Day 3 · Tasting`
3. Soft AI pulse rings briefly emanate from each label as it lands.
4. A faint **route line** draws between tiles in geographic order (Oia → Ammoudi → Caldera → Canaves → Catamaran → Megalochori) with a tiny moving gold dot tracing the path.
5. Tiles **reorder by chronology** with a smooth FLIP-style motion (translate + fade), grouping into Day 01 / Day 02 / Day 03 chips that fade in above the rows.
6. A small classifier strip pulses through tags (`Stay`, `Dining`, `Sunset`, `Cruise`, `Tasting`) attaching to the relevant tiles.
7. End-state caption (replacing the current static line): *"6 moments → 3 days, 5 experiences, 1 itinerary — reconstructed automatically."*

Constraints: pure CSS/SVG/Framer-style transitions already in the file's idiom — no new dependencies, no canvas, no 3D. Everything stays inside the existing 300/460px stage. Reduced-motion: render the final reconstructed state immediately (no movement, just labels visible and tiles already grouped by day).

Scenes 3 and 4 keep their current Condé-Nast itinerary card and monetization payoff, with a one-line copy nudge in Scene 4: *"Your story, now bookable."*

---

## Section copy alignment (`HomeLuxurySections.tsx`)

Tiny tweaks only, to match the new emotional framing of each tab:

- Travelers eyebrow → keep, body line → *"Discover trips you'll fall in love with — personalized in real time, booked on-platform."*
- Creators eyebrow → keep, body line → *"Upload your camera roll. Watch Goldsainte rebuild your journey into a bookable itinerary."*
- Agents eyebrow → keep, body line → *"Design bespoke proposals like a luxury magazine — curated, elegant, white-glove."*

No structural changes to the section, tabs, or surrounding layout.

---

## Technical notes

- All animations use the existing `gs-fade-in` / Tailwind `animate-*` patterns already defined in these files; add small local `@keyframes` blocks inside each component when needed (route-draw, ring-pulse, label-pop) — same approach the files already use.
- Maintain the current `SCENE_MS = 3600` cadence and IntersectionObserver gating so off-screen sections don't burn CPU.
- Honor `prefers-reduced-motion` in every component (Traveler → Scene 3, Agent → Scene 3, Creator → reconstructed Scene 2 end-state).
- No new images, no new packages, no new routes, no DB changes.

---

## Acceptance check

After implementation, the three tabs in **How Goldsainte Works** should each tell a distinct emotional story:

- Traveler → *"I just discovered a trip I love."*
- Agent → *"This feels like luxury concierge craftsmanship."*
- Creator → *"Wait… the AI figured all of that out automatically?"*

Verification: load `/#how-it-works`, cycle through the three tabs, confirm each loop runs cleanly at desktop 1000px and mobile widths, and that reduced-motion produces a static, on-brand frame.
