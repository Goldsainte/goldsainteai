## Remove the Brand pathway and elevate the join section into a luxury ecosystem entry

### Scope

The only "brand/partner" entry on the live homepage is the 4th card ("Apply as Brand") inside `src/components/home/RoleSpecificCTAs.tsx`. There is no separate brand-logos / "as featured in" strip on the page (`HomePage.tsx` renders: `HomeHero → HowGoldsainteWorksSection → TwoWaysComparison → StoryboardsHighlight → RoleSpecificCTAs → TrustSafetyPaymentsSection`). So "remove the brand section" = drop the Brand card and any direct brand wiring from this section. Other surfaces that mention brands (sidebar, hero feature pill, footer) are out of scope.

### File to change

`src/components/home/RoleSpecificCTAs.tsx` — full visual + content rewrite. No other files touched.

### Section header

- Eyebrow pill: *"The Goldsainte Ecosystem"* (dark green pill, gold text — keep current pill styling).
- Heading: serif italic *"Experience Goldsainte Your Way"* (uses `font-secondary`, `text-[28px] md:text-[44px]`, `leading-[1.1]`, `tracking-tight`, `#0a2225`).
- Subheadline: *"Whether you're discovering your next journey, transforming travel memories into income, or designing personalized luxury experiences, Goldsainte connects every part of modern travel in one curated marketplace."* (`max-w-2xl`, `#5A5A5A`, `text-[15px] md:text-base`, `leading-relaxed`).
- Center the header block (`text-center`, `mx-auto`) instead of the current left-aligned treatment so the section reads as editorial, not as an onboarding form.

### Cards (3 instead of 4)

Drop the `Building2` Brand card and its `brandImage` import entirely. Cards become: Travelers · Creators · Travel Agents.

| Card | Title | Description | CTA | Link | Image |
|---|---|---|---|---|---|
| 1 | *Discover Extraordinary Journeys* | Explore curated experiences personalized around your travel style, destinations, and preferences. | Explore Experiences | `/explore` | `travelerImage` (existing `hero-overwater-villa.jpg`) |
| 2 | *Transform Travel Into Influence* | Turn your travel memories, recommendations, and experiences into sellable curated journeys powered by AI. | Start Creating | `/auth?mode=signup&role=creator` | `creatorImage` (existing `creator-canyon-views.jpg`) |
| 3 | *Design Exceptional Experiences* | Craft personalized luxury itineraries and deliver concierge-level travel planning at scale. | Join as a Travel Expert | `/apply/agent` | `agentImage` (existing `agent-travel-planning.jpg`) |

Drop i18n lookups for these card strings — the user supplied exact English copy and no translations were requested. Drop the secondary "browse creators / browse agents" links: those broke the editorial single-CTA composition.

### Card visual direction (cinematic editorial)

Replace the current 4-up grid + small `4/3` image + green pill button with a 3-up editorial grid:

- Layout: `grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8`. On `lg` keep 3 columns (no 4th).
- Card frame: `group relative overflow-hidden rounded-[28px] aspect-[3/4] bg-[#0a2225]`, soft `shadow-[0_24px_60px_rgba(10,34,37,0.12)]`, transitions on `transform`, `box-shadow`.
- Image: full-bleed background `<img className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" />`.
- Layered gradient: `absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/35 to-transparent` + a faint top gold sheen `from-[#C7A962]/10` for depth.
- Top-left chip: small serif italic eyebrow per card — *"For Travelers"* / *"For Creators"* / *"For Travel Experts"* in `text-[10px] uppercase tracking-[0.22em] text-[#C7A962]` over a thin gold underline that animates `scale-x-0 → scale-x-100` on group-hover.
- Bottom content stack (absolute bottom, `p-6 md:p-7`, `text-white`):
  - Serif italic title `font-secondary italic text-[22px] md:text-[26px] leading-[1.15]`.
  - Description `text-[13px] md:text-[14px] leading-relaxed text-white/80 max-w-[34ch]` — initially clamped to 2 lines (`line-clamp-2`), expands to full on group-hover with `transition-all duration-500`.
  - CTA: pill *Explore Experiences / Start Creating / Join as a Travel Expert* — `inline-flex items-center gap-2 rounded-full bg-[#C7A962] text-[#0a2225] px-4 py-2 text-[12px] font-medium` with a small `ArrowUpRight` icon that translates `translate-x-0 → translate-x-0.5 -translate-y-0.5` on group-hover. Whole card is the link (`<Link>` wraps the article) so the pill is decorative + the entire card is clickable.
- Hover motion: card lifts `-translate-y-1`, shadow deepens to `shadow-[0_36px_80px_rgba(10,34,37,0.22)]`, image scales (above), gold underline draws in. All transitions `duration-500 ease-out`. No parallax, no rotation.
- Mobile: keep the same `aspect-[3/4]` and stacked layout (no carousel). Description stays expanded by default since hover doesn't apply on touch.

### Section frame

- Keep the section background `bg-[#FDF9F0]`. Increase vertical padding to `py-24 md:py-32`. Container `max-w-6xl mx-auto px-4 md:px-6`.
- Above the cards, leave a generous `mt-14 md:mt-16` gap from the centered header.
- After the cards, add a quiet editorial footer line: small italic *"One ecosystem · Three ways to belong"* — `text-center font-secondary italic text-[12px] text-[#0a2225]/55 mt-12`. (Optional but reinforces the "ecosystem" positioning.)

### Accessibility & polish

- Each card is a single `<Link>` with `aria-label` of the title for screen readers.
- Images keep `loading="lazy"` and meaningful `alt` text per audience.
- Respect `prefers-reduced-motion`: wrap the image scale + lift in `motion-safe:` Tailwind variants so the hover is static under reduced motion.

### Out of scope

- No changes to `HomePage.tsx` ordering, other home sections, the sidebar, footer, hero feature pills, or anywhere else "Brands" is referenced.
- No new images, icons outside `lucide-react` (`ArrowUpRight` only), no animation libraries, no i18n additions.
- No backend, route, or schema changes.
