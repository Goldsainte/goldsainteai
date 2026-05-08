## Homepage credibility & conversion upgrades

Six focused changes across the homepage, all preserving the existing luxury aesthetic (cream `#f7f3ea` background, dark green `#0c4d47` CTAs, gold `#C7A962` accents, serif headers, Cormorant/Playfair display + body sans).

### 1. Meta title & description (`index.html`)
- `<title>` → `Goldsainte — The Smarter Travel Marketplace`
- `<meta name="description">` → `Plan, discover, and book extraordinary trips with certified travel specialists and explorers across 50+ countries. Powered by AI, built around you.`
- Mirror the same values into the OG and Twitter meta tags so social shares stay consistent.

### 2. Stats trust strip (new component)
- Create `src/components/home/StatsStrip.tsx`: cream background, three centered stats separated by hairline gold dividers on desktop / stacked on mobile.
  - `50+` — Countries
  - `500+` — Certified Travel Specialists
  - `Minutes` — From Inspiration to Itinerary (label "Trips Planned in Minutes")
- Numbers in serif display, dark green; labels uppercase tracking, muted.
- Mount in `src/pages/HomePage.tsx` between `<HomeHero />` and `<HowGoldsainteWorksSection />`.

### 3. Camera-roll feature highlight (new component)
- Create `src/components/home/CameraRollHighlight.tsx`: full-width cream section, two-column grid (text left / visual right, stacked on mobile).
  - Headline (serif): "From Inspiration to Itinerary in Minutes."
  - Sub-copy: "Upload photos of places that inspire you, and Goldsainte builds a complete, bookable trip around them — instantly. Share it, sell it, or make it your own."
  - CTA: dark green pill button "Try It Free" → routes to `/auth?mode=signup`.
  - Right side reuses the existing `CreatorAIMagic` phone/camera-roll mockup already shown in the For Creators accordion (`src/components/home/CreatorAIMagic.tsx`), wrapped in a soft cream/gold frame matching the hero visual treatment.
- Mount in `HomePage.tsx` between `<HowGoldsainteWorksSection />` and `<TwoWaysComparison />`.

### 4. Testimonials section (new component)
- Create `src/components/home/HomeTestimonials.tsx`: cream background, section heading "What Travelers Are Saying" (serif, dark green) with the gold hairline divider used elsewhere.
- Three cards (responsive grid): large gold opening quotation mark, dark-green serif quote, traveler name, country.
  - Sample seed copy (placeholder, easy to swap):
    1. "Goldsainte planned a Kyoto trip from a single Pinterest board. It felt designed just for me." — Amelia R., United Kingdom
    2. "My specialist handled everything — I just showed up and lived it." — Daniel K., United States
    3. "I uploaded my camera roll and had a bookable itinerary in minutes." — Sofia M., Spain
- Mount in `HomePage.tsx` between `<StoryboardsHighlight />` and `<RoleSpecificCTAs />`.

### 5. Nav "Get Started" CTA (`src/components/Header.tsx`)
- Add a dark green rounded pill button labeled "Get Started" in the right-side action cluster (both desktop and mobile menu rows where the user/profile icon currently lives).
- Hide the button when the user is already authenticated to avoid noise.
- Click navigates to `/auth?mode=signup`.

### 6. Rename "Why Goldsainte Feels Different" (`src/components/home/TwoWaysComparison.tsx`)
- Change the section H2 from `Why Goldsainte Feels Different` to `Two Ways to Experience Goldsainte`. Eyebrow pill, divider, and existing description copy unchanged.

### Files touched
- `index.html` — meta tags
- `src/pages/HomePage.tsx` — section composition
- `src/components/Header.tsx` — Get Started CTA
- `src/components/home/TwoWaysComparison.tsx` — H2 rename
- New: `src/components/home/StatsStrip.tsx`
- New: `src/components/home/CameraRollHighlight.tsx`
- New: `src/components/home/HomeTestimonials.tsx`

### Final homepage order
1. HomeHero
2. StatsStrip (new)
3. HowGoldsainteWorksSection
4. CameraRollHighlight (new)
5. TwoWaysComparison (renamed)
6. StoryboardsHighlight
7. HomeTestimonials (new)
8. RoleSpecificCTAs
9. TrustSafetyPaymentsSection

No business-logic, schema, or auth changes — purely presentation.
