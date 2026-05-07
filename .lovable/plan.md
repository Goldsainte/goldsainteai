## Add signature animations for Travelers and Travel Agents tabs

Bring the same cinematic, marketplace-driven product feel from `CreatorAIMagic` to the other two tabs in the "How Goldsainte Works" section so the entire experience reads as one ecosystem story. Each tab gets its own self-contained 4-scene loop in the same canvas dimensions (`h-[300px] md:h-[460px]`) and visual language (cream/dark green/gold, serif italic headers, rounded cards, soft shadows, IntersectionObserver loop, reduced-motion fallback).

### New components

1. `src/components/home/TravelerDiscoveryMagic.tsx`
2. `src/components/home/AgentProposalMagic.tsx`

Both follow the same architecture as `CreatorAIMagic`: `SCENE_MS` interval, `Scene` cross-fade wrapper, `Caption` pill, ambient gold/green glows, top step dots, inline `<style>` keyframes (`gs-pop`, `gs-rise`, `gs-card-in`, `gs-fade-in/out`, `gs-shimmer`, `gs-glow`, `gs-draw`).

### Traveler — Discovery & Booking (4 scenes)

1. **Explore the marketplace** — A 3-card stagger of curated trips on a soft cream stage:
   - "Santorini Escape · from $249 · @elenaroams · ★ 4.9 · ♥ 243"
   - "Kyoto Cultural Journey · from $389 · @hiroyuki · ★ 4.8 · ♥ 412"
   - "Bali Wellness Retreat · from $329 · Concierge · ★ 4.9 · ♥ 187"
   - Each card has a destination gradient hero, serif title, host row with avatar, price + saves, and a tiny "Available" pill. Cards drift in with `gs-card-in` and a slight rotation. Caption: "Discover curated trips".
2. **Personalize your trip** — One Santorini card scales up center; a small overlay panel slides in from the right with elegant toggle rows that animate ON in sequence:
   - Pace · `Slow · Balanced · Active` (Balanced becomes selected)
   - Dining · `Local · Fine Dining` (Fine Dining selected)
   - Stays · `Boutique · Luxury` (Luxury selected)
   - Budget slider gold dot slides from $249 → $349
   - Subtle gold check appears next to each row as it confirms. Caption: "Tailor it to your taste".
3. **AI recommendations** — Three floating gold-bordered "suggestion" chips rise around the personalized card with a gentle pulse, connected by faint dotted lines:
   - "Add: Private Sommelier Tasting · +$45"
   - "Nearby: Akrotiri Excavation Tour"
   - "Hidden gem: Vlychada Black Beach"
   - Center card shows "+ 3 AI suggestions added" pill with `Sparkles`. Caption: "Goldsainte tailors it further".
4. **Booking confirmed** — Card morphs into a polished confirmation card:
   - Gradient hero with "✓ Trip Confirmed" pill
   - Title "Santorini Escape · Jun 12–14"
   - Three mini day chips (Day 1/2/3 thumbnails)
   - Bottom row: "Booked with Elena · Saved to your trips" + "Itinerary sent to inbox" gold underline
   - Stacked pill below: "On-platform booking · Fully protected"
   - Caption: "Booked. Saved. Ready to travel".

### Travel Agent — Concierge Proposal (4 scenes)

1. **Incoming request** — A "New Request" card slides in from top-left with a soft notification dot:
   - Avatar + "Sophia & Marc · Couple"
   - Serif italic title "Luxury honeymoon in Greece"
   - Meta chips: "10 days · Sept · 2 travelers · Budget $12k"
   - Tag chips: `Privacy · Cliffside Suites · Sailing`
   - Below the card, two more faded request cards stack to imply a pipeline ("Family safari · Tanzania", "10-day Japan cultural"). Action pill: "Accept & Build". Caption: "A new client request lands".
2. **Build the proposal** — A workspace surface appears with a left "Trip Blocks" rail and a right itinerary canvas:
   - Left rail items animate in: `Stays`, `Flights`, `Experiences`, `Dining`, `Transfers` (with lucide icons)
   - Right canvas builds 3 day blocks bottom-up with thumbnails:
     - Day 1 — Mykonos Arrival · Cali Mykonos
     - Day 2 — Private Yacht to Delos
     - Day 3 — Santorini · Cliffside Dinner
   - A small gold connector line draws between day pins on the right edge (`gs-draw`).
   - Caption: "Compose a concierge itinerary".
3. **AI-assisted refinements** — Floating gold chip suggestions appear near specific blocks with thin dotted connectors back to the relevant day:
   - "Suggested: Helicopter transfer Mykonos → Santorini"
   - "Pair Day 3 with: Domaine Sigalas private tasting"
   - "Optimize: Move yacht to Day 2 sunset"
   - A small "Goldsainte AI · Concierge" pill pulses at the top of the canvas. Caption: "AI refines the details with you".
4. **Send to client** — The workspace collapses into a polished proposal preview card:
   - Hero strip "Honeymoon · Cyclades, 10 Days" with serif italic + gold "Prepared for Sophia & Marc"
   - Three highlight chips: `Private Yacht`, `Helicopter`, `Cliffside Suites`
   - Pricing block: "Total $11,840 · 50/50 schedule"
   - Primary CTA `Send Proposal` does the same `Publish → ✓ Sent` swap as the Creator scene
   - Stacked pills below: "Locked & on-platform" and "Fee covered: 7% split (3.5/3.5)"
   - Caption: "Delivered. Trackable. On-platform".

The fee-split pill respects the canonical core memory rule.

### Wire-up in `src/sections/HomeLuxurySections.tsx`

Replace the `tabImages` static-image conditional with a per-tab component map. The right panel becomes:

```text
travelers → <TravelerDiscoveryMagic />
creators  → <CreatorAIMagic />
agents    → <AgentProposalMagic />
```

Render all three as absolutely-positioned siblings inside the existing rounded `[32px]` frame (same shadow + cream backdrop frame), cross-fading on `activeTab` change. Drop the dark gradient + caption overlay (`activeTab !== "creators"` block) entirely since each animation now carries its own caption pill — keeps the three tabs visually consistent. Remove the now-unused `santoriniStepsImg` and `agentPlanningImg` imports if nothing else uses them; leave `creatorCanyonImg` only if referenced elsewhere (verify with a grep before removing).

### Visual & motion guardrails

- Reuse the exact palette and typography tokens already in `CreatorAIMagic` — no new colors.
- Cap motion: max one ambient pulse + staggered card entries per scene. No spinning, no parallax, no full-canvas scans.
- Each scene must read as a single product surface (a card, a workspace, a confirmation), not a diagram. No arrows, no boxes-and-lines pipelines, no enterprise dashboard chrome.
- All three components reduce to scene 3 under `prefers-reduced-motion` (the strongest single frame for that audience).
- Mobile: components keep the existing `h-[300px]` mobile height and reflow inner cards/widths via `max-w-[…]` and `text-[…]px` like the Creator component.

### Out of scope

- No changes to the accordion content, tab order, copy in the left rail, or "How Goldsainte Works" intro.
- No changes to other home sections, routes, or backend.
- No new icons outside `lucide-react`, no new images, no animation libraries.
- No copy that violates the standardized microcopy memory ("Services" not "Packages", "Request a Trip" not "Book Now", "Storyboards" not "Listings").
