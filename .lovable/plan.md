

## Creator Profile Page — Layout, Header & Flow Redesign

### Overview
Comprehensive restructure of the creator profile into a premium travel creator landing page with a structured header, reordered sections, new conversion block, and updated CTA copy throughout.

### New Page Flow (top to bottom)
```text
1. Back bar (keep)
2. Hero Header (REDESIGNED — structured 3-column)
3. Storyboards ("Explore Travel Ideas")
4. How It Works (3-step inline, not cards)
5. Social Presence (upgraded cards)
6. Conversion Section ("Start Your Journey With {Name}")
7. From My Travels (gallery)
8. Meet Your Creator (renamed About)
9. Trust & Safety (keep)
10. Reviews
```

### Changes by File

**1. `src/components/profile/ProfileHero.tsx` — 3-Column Header**
- Replace current overlay layout with a structured 3-column grid below the cover image
- **Left**: Avatar, name, verified badge, tagline (1 line)
- **Center**: Location, specialty pills, credibility line ("Designing personalized travel experiences worldwide")
- **Right**: Primary CTA "Get Custom Itinerary" + "Follow" button + formatted followers count + response time
- Remove floating stat badges from cover image
- Remove inline social icons and duplicate follower counts
- On mobile: stack into a single column

**2. `src/pages/creators/CreatorPublicProfilePage.tsx` — Layout Restructure**
- Reorder sections to match new flow: Header → Storyboards → How It Works → Social → Conversion → Gallery → Meet Creator → Trust → Reviews
- Remove the "Editorial Intro" section (merged into header + new "Meet Your Creator")
- Add new inline "How It Works" section (3 steps with gold numbers, not card component)
- Add new "Start Your Journey With {Name}" conversion section with CTA, subtext ("Takes 2 minutes", "No commitment", "Delivered in 24–48 hours")
- Move `CreatorSocialCards` (upgraded) to after How It Works
- Rename About section title to "Meet {firstName}"
- Add "Trips I Love Planning" subsection (from specialties/niches)
- Add "Best For Travelers Who…" subsection (from `best_for` data)
- Replace ALL "Request a Trip" text with "Get Custom Itinerary"
- Add microcopy under every CTA: "Takes 2 minutes · No commitment · Response within 24 hours"

**3. `src/components/creator/CreatorSocialCards.tsx` — Upgrade (not simplify)**
- Restore as a proper section with title "Social Presence"
- Add total reach header line: "Total reach: {X}+ followers"
- Each card: platform icon, name, handle, formatted follower count, entire card clickable
- Clean styling matching luxury aesthetic (white cards, subtle borders, no heavy colored backgrounds)

**4. `src/components/profile/ProfileSidebar.tsx` — CTA Updates**
- Change "Request a Trip" → "Get Custom Itinerary"
- Change "Plan Your Journey" heading → keep or update
- Add microcopy under CTA button: "Takes 2 minutes · No commitment"

**5. `src/components/creator/CreatorStoryboardGrid.tsx` — Minor Updates**
- Update empty state CTA text: "Get Custom Itinerary" (replacing "Get a custom itinerary")

**6. `src/components/creator/CreatorMediaGallery.tsx` — Already renamed to "From My Travels" (no changes needed)

**7. `src/components/creator/CreatorSocialInline.tsx` — Remove usage from page**
- No longer rendered on the page (replaced by upgraded CreatorSocialCards section)

### New Component: Conversion Section
Inline in the page file — a full-width cream card with:
- Serif headline: "Start Your Journey With {Name}"
- Body: "Not sure where to go? {Name} will design a personalized trip based on your style, budget, and preferences."
- CTA button: "Get Your Custom Itinerary"
- Three trust lines below: "Takes 2 minutes" · "No commitment" · "Delivered in 24–48 hours"

### Files
- **Edit**: `src/components/profile/ProfileHero.tsx` — 3-column structured header
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — reorder, add sections, update copy
- **Edit**: `src/components/creator/CreatorSocialCards.tsx` — upgrade to proper section
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — update CTA copy
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — update CTA copy

