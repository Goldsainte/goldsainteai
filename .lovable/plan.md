## Refine `CreatorAIMagic` — Smarter AI, Premium Itinerary, Rewarding Monetization

Keep the existing 4-scene framework, palette (cream `#FDFBF7`, dark green `#0c4d47`, gold `#C7A962`, ink `#0a2225`), serif type, IntersectionObserver loop, and reduced-motion fallback. Refine each scene so it feels more cinematic, intelligent, and marketplace-ready — not technical. All edits are inside `src/components/home/CreatorAIMagic.tsx`. No other files change.

### Scene 1 — Camera Roll (subtle polish only)

- Slightly slower stagger (110ms) and add a faint location footer chip "📍 Captured in Santorini · Jun 12–14" above the CTA, so the upload already implies a real trip.
- Replace the gold ring + numeric badge with a soft gold check on 5 of 6 tiles (more "selected", less "step number").
- Keep the dark green AI CTA at the bottom — same copy.

### Scene 2 — AI Understanding (the biggest upgrade)

Goal: the moment must feel like Goldsainte is reading the trip's story, not scanning files.

- Keep the floating photo collage with rotation, but add a centered, low-opacity gold "AI" pulse (two concentric rings + soft `Sparkles`) behind the cards so the recognition feels emanating from one intelligence.
- Each card gets a richer caption that animates in 2 lines:
  - line 1 (serif italic, ink): place name — `Oia, Santorini`, `Ammoudi Taverna`, `Caldera Viewpoint`, `Canaves Suite`, `Sunset Catamaran`
  - line 2 (uppercase micro, muted): `5:42 PM · Sunset` / `Day 1 · Dinner` / `Day 2 · Cruise`
- Add a thin gold hairline that draws between 3 cards in chronology order (timeline forming) using a stroke-dasharray reveal — implies the AI is grouping them into a trip narrative, not just labeling.
- Replace the full-width scan band with a soft gold radial sweep that pulses once per loop (less "scanner", more "understanding").
- Caption changes to: "Goldsainte recognizes your journey".

### Scene 3 — Premium Itinerary Output

Goal: the card should look like a Condé Nast / Airbnb Experiences product, not a checklist.

- Widen the card to `max-w-[320px]` and split into a richer layout:
  - **Hero strip** (h-20) with a Santorini gradient + overlayed serif title "Santorini, in 3 Days" and a tiny gold "Curated by AI · Reviewed by Elena" line.
  - **Day rows** (still 3) refined: large serif italic day numeral, serif title, italicized subtitle, and a thumbnail. Add a small route line connecting day thumbnails along the right edge (vertical gold dotted stroke with pin nodes).
  - **Highlight chips row** below the days: `Private Cruise` · `Cliffside Dining` · `Winery Tasting` (small bordered pills).
  - **Footer meta** unchanged but add a 4th item: `Crafted in 12 sec`.
- Each day row stagger increases to 320ms with a slight slide-up + scale for a more cinematic build. The hero strip fades in first, route line draws after the rows.
- Caption changes to: "A premium itinerary, written by AI".

### Scene 4 — Monetization & Marketplace

Goal: feel rewarding, aspirational, and clearly marketplace-ready.

- Reposition listing card slightly higher to make room for richer chrome below.
- Card upgrades:
  - "Available" pill becomes `Now Live · Available for Booking` (gold dot + dark green pill).
  - Add a saves stat overlay on the hero strip bottom-left: `♥ 243 saves` animating with a count-up via CSS (`animate-[gs-rise]` + numeric text).
  - Price line shows "from **$249**" with strikethrough secondary "$299" to imply a real product.
  - Replace `Publish` with `Publish Itinerary` and add a checkmark that swaps in after ~700ms to a green confirmation pill `✓ Published` (state change feels rewarding).
- Below the card, replace the single earnings pill with a 2-row stack:
  - `+ $249 earned` (gold on dark green pill, Wallet icon)
  - `Bookings open · Marketplace listing live` (cream pill, gold MapPin)
- Caption changes to: "Your trip is now a sellable experience".

### Motion & timing

- Bump `SCENE_MS` from 3200 → 3600 to let Scenes 2 and 3 breathe.
- Add 2 keyframes alongside existing ones:
  - `gs-draw` (stroke-dashoffset N → 0) for the chronology line and route line.
  - `gs-glow` (gold radial opacity 0 → 0.5 → 0) for the Scene 2 ambient AI pulse.
- All other animations reuse existing `gs-pop`, `gs-rise`, `gs-card-in`, `gs-shimmer`.
- Reduced-motion: still snaps to Scene 3 (now the upgraded itinerary) — the strongest static frame.

### Out of scope

- No changes to `HomeLuxurySections.tsx`, tab order, accordion content, or the Travelers/Agents tab images.
- No new icons beyond `lucide-react` (`Heart`, `Check`, `MapPin`, `Sparkles`, `Wand2`, `Wallet`, `Star`, `Clock`, `Calendar`, `Utensils`, `Video` already imported or available).
- No SVG assets, no images, no third-party animation libs. Pure Tailwind + inline `<style>` keyframes.
- No copy changes elsewhere on the page.
