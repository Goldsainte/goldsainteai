# Creator AI Magic — Animated Product Visualization

Replace the static creator image (right panel of the "How Goldsainte Works" section) with a premium, looping 4-step animation when the **For Creators** tab is active. Travelers and Agents tabs keep their existing static images.

## Where it lives

- **New component:** `src/components/home/CreatorAIMagic.tsx` — self-contained looping animation, ~360–420px wide, fits the existing rounded card frame.
- **Edit:** `src/sections/HomeLuxurySections.tsx` — in the right-side image panel, render `<CreatorAIMagic />` when `activeTab === "creators"`, otherwise render the existing `<img>` for that tab. Keep the cream "shadow frame" wrapper, rounded `[32px]` corners, and shadow exactly as today so the visual frame is identical across tabs.

## The 4 looping scenes (~10s loop, ~2.5s each, soft cross-fades)

All scenes share the same rounded inner canvas (`#FDFBF7` cream gradient → ivory), serif headers (`font-secondary`), `#0a2225` text, `#0c4d47` dark green primary, `#C7A962` gold accents, soft `#E5DFC6` borders, subtle drop shadows.

### Scene 1 — Upload from phone (0–2.5s)
- Stylized iPhone-shaped frame (rounded notch, status bar) centered.
- Inside: a 2×3 grid of travel thumbnails (gradient placeholders representing Bali beach, restaurant, landmark, hotel, sunset, reel — colored blocks + tiny lucide icons: `Image`, `Video`, `MapPin`).
- Three thumbnails animate in with a checkmark + a small chip ("Santorini", "Sunset", "Dinner"). A faint "Uploading…" pill at top with an animated gold progress bar.

### Scene 2 — AI processing (2.5–5s)
- Phone shrinks/slides to top-left corner. Selected thumbnails detach and float toward a centered glowing "AI" orb (dark green disc with soft gold pulse rings, `Sparkles` icon).
- Floating metadata chips drift around: `📍 Oia`, `🍷 Winery`, `🛥 Catamaran`, `🌅 Sunset`, with thin gold connector lines fading in/out.
- Subtle pulse loop on the orb (`animate-pulse` + custom keyframe for ring expansion).

### Scene 3 — Itinerary assembles (5–7.5s)
- Orb dissolves into a vertical itinerary card stack that builds top-to-bottom with staggered fade+slide:
  - `Day 1 · Santorini Sunset Dinner`
  - `Day 2 · Catamaran Cruise`
  - `Day 3 · Cliffside Winery Experience`
- Each row: small gold day number, serif title, muted subtitle, tiny `MapPin` + image chip on the right.
- Thin gold hairline divider between rows; a faint route-line svg connects the day pins on the right edge.

### Scene 4 — Publish & monetize (7.5–10s)
- Itinerary card scales down slightly and a "marketplace listing" card slides up over it:
  - Cover thumbnail, title "Santorini in 3 Days", creator avatar + handle row, price `$249` animating up via count-up, small `★ 4.9` chip.
  - Dark green `Publish` pill button with a soft shimmer sweep.
  - Below: a tiny earnings ticker (`+$249 earned`) fades in with a `Wallet` icon and gold underline.
- Cross-fades back to Scene 1 to loop seamlessly.

## Motion approach

- Pure CSS + Tailwind with a single `useEffect` driving a `step` state (`0..3`) on a `setInterval` every 2500ms. Each scene is an absolutely-positioned layer with `opacity` + `translate` transitions (`transition-all duration-700 ease-out`).
- Within each scene, child elements use staggered `animation-delay` via inline style on existing tailwind `animate-in fade-in slide-in-from-*` utilities (already used elsewhere in the file).
- Add 2 small custom keyframes to `tailwind.config.ts` extend block: `pulse-ring` (scale 1→1.6, opacity 0.6→0) and `shimmer` (translateX -100%→100%). Reuse existing `accordion`/`fade-in` patterns otherwise.
- Pause animation when the section is offscreen via `IntersectionObserver` to avoid wasted work.
- Respects `prefers-reduced-motion`: collapses to a static composite of Scene 3 (itinerary) with no looping.

## Responsiveness

- Desktop (lg+): renders inside the existing `max-w-md` right column at full ~420px height to match the current image panel.
- Mobile/tablet: scales down to a fixed aspect ratio (`aspect-[4/5]`) and reduces inner card padding; phone frame and itinerary rows reflow to remain legible.
- No horizontal overflow; uses `overflow-hidden` on the outer rounded container.

## Visual tokens (reused, no new colors)

- Background gradient: `from-[#FDFBF7] to-[#F5EFE1]`
- Borders: `border-[#E5DFC6]`
- Primary text: `#0a2225` · Muted: `#6B7280`
- Accent gold: `#C7A962` · Deep green: `#0c4d47`
- Shadows: existing `shadow-[0_24px_60px_rgba(10,34,37,0.12)]`

## Out of scope

- No changes to the accordion content, tab order, or other tabs' imagery.
- No new routes, data, or backend work.
- No third-party animation libraries (no framer-motion / lottie). Pure Tailwind + CSS keyframes for performance and bundle size.
- No edits to `TwoWaysComparison` or `Index.tsx` ordering.
