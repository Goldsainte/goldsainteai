# Expand How Goldsainte Works — 4 Cards per Audience

Single file edit: `src/sections/HomeLuxurySections.tsx`. Layout, header, image panel, accordion behavior, and gold styling are preserved exactly. Only the `tabsData` content and the accordion grid wrapper change.

## Changes

### 1. `tabsData` (lines ~222-265)
Each tab keeps `id / label / icon / captionLabel`, but `features[]` becomes the headline + description (rendered as intro) PLUS 4 differentiator cards. To avoid restructuring the render loop, model it as:

- Add an optional `intro?: { title: string; description: string }` to `TabData`.
- `features[]` becomes the 4 differentiator cards.

#### For Travelers (icon: Compass, caption: "Discover & Book")
- intro: "Book curated trips instantly." / "Explore ready-made itineraries and travel packages created by trusted creators and certified travel experts. Personalize your experience or book in minutes."
- features:
  - Heart — Curated Experiences — "Discover trips designed by creators and certified travel experts—not generic travel templates."
  - Calendar — Instant Booking — "Book complete itineraries and travel packages in minutes with streamlined planning and checkout."
  - Sparkles — Personalized Travel — "Customize experiences around your interests, travel style, budget, and preferred pace."
  - Star — AI-Powered Discovery — "Goldsainte learns your preferences to recommend destinations and experiences tailored to you."

#### For Creators (icon: Camera, caption: "Create & Monetize")
- intro: "Turn your trips into income." / "Upload travel photos, videos, or past trip content and let Goldsainte AI transform them into structured itineraries others can discover, purchase, and personalize."
- features:
  - Wand2 — AI Itinerary Creation — "Upload travel content and let AI generate structured travel itineraries automatically."
  - Wallet — Monetize Your Experiences — "Sell curated travel guides and itineraries directly through the Goldsainte marketplace."
  - Users — Build Your Travel Brand — "Grow an audience around your travel style, recommendations, and curated experiences."
  - TrendingUp — Passive Income Potential — "Earn from past trips and travel content long after your journey ends."

#### For Travel Agents (icon: Briefcase, caption: "Sell & Customize")
- intro: "Sell packages or customize trips." / "List premium travel experiences, customize itineraries for travelers, and respond to personalized trip requests."
- features:
  - Briefcase — Curated Travel Packages — "List premium travel experiences travelers can browse and book instantly."
  - Map — Custom Trip Planning — "Personalize itineraries around traveler preferences, budgets, and goals."
  - Handshake — Bid Marketplace Access — "Respond to custom traveler requests and compete to build dream itineraries."
  - Brain — AI-Enhanced Workflow — "Use AI-assisted tools to streamline itinerary building and trip customization."

### 2. Accordion content (lines ~335-362)
- Add `Calendar, TrendingUp, Map, Handshake` to the lucide-react import on line 206. (Heart, Sparkles, Star, Wand2, Wallet, Users, Briefcase, Brain already imported.)
- Inside `AccordionContent`, render the optional `intro` block above the features grid using the same typography (font-secondary headline + muted description).
- Change features grid from `grid-cols-1` back to `grid gap-5 grid-cols-1 sm:grid-cols-2` so 4 cards display as a 2×2 grid on desktop, single column on mobile. Keep the existing soft-gold circular icon container and hover treatment unchanged.

### 3. Untouched
- Section header, subtitle, image panel, caption overlay, footer note, page placement (already directly below hero in `Index.tsx` / `HomePage.tsx`), and all colors/spacing/animations.
