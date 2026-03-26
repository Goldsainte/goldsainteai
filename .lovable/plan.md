

## Creator Profile — Clean Up Duplicates, Fix Hierarchy & Single CTA Path

### Problem
The page has duplicate CTAs (hero, sidebar, conversion section, storyboard grid), redundant content between left column and sidebar, inconsistent spacing, and no visual rhythm between sections. This creates cognitive overload and dilutes conversion.

### Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx` — Layout & section cleanup**
- **Remove the inline "Conversion Section"** (lines 308-329 — "Start Your Journey With {Name}"). This duplicates the sidebar CTA and hero CTA. Two CTA touchpoints are enough (header + sticky sidebar).
- **Remove "How It Works" inline section** (lines 277-301). This info is already in the sidebar microcopy ("Share your vision → Receive plan → Book securely"). Keeps the page leaner.
- **Add alternating section backgrounds** for visual rhythm:
  - Storyboards: `bg-[#FDF9F0]` (cream, default)
  - Social Presence: `bg-white` with top/bottom border
  - Gallery: `bg-[#FDF9F0]`
  - Meet Your Creator: `bg-white` with border
  - Trust: `bg-[#FDF9F0]`
  - Reviews: `bg-white`
- **Wrap each section in full-width divs** that break out of the two-column grid, then contain content in `max-w-6xl` — this enables alternating backgrounds across the full viewport width.
- **Increase section spacing** from `space-y-14` to `py-16 md:py-20` per section for proper breathing room.
- **Move Social Presence** to after Storyboards (keep current order).
- **Final section order**: Storyboards → Social → Gallery ("From My Travels") → Meet Creator → Trust → Trips → Reviews.
- **Remove duplicate rating/follower display** — rating already shown in header center column and sidebar; don't repeat in left content.

**2. `src/components/profile/ProfileSidebar.tsx` — Simplify to essentials only**
- **Remove the Storyboards list** from sidebar (lines 148-200). Storyboards are now prominently displayed in the main content area — showing them again in sidebar is redundant.
- **Remove "Secondary actions" card** (website link, save to storyboard) — these are low-priority actions that add clutter. Keep only Follow button inside the CTA card.
- **Sidebar contains ONLY**:
  1. CTA card: "Plan Your Journey" heading + 3-step microcopy + "Get Custom Itinerary" button + "Takes 2 minutes · No commitment" + response time + activity indicator
  2. Trust & Safety text block
- **Move FollowButton** into the CTA card (below the button, as a secondary action).

**3. `src/components/profile/ProfileHero.tsx` — Remove Follow button duplication**
- Remove `FollowButton` from the hero right column (line 156-158). Follow is in the sidebar now. Hero right column keeps: CTA button + followers count + response time only.
- Add microcopy under hero CTA: "Takes 2 minutes · No commitment"

**4. `src/components/creator/CreatorStoryboardGrid.tsx` — No changes needed**
- Already has "Get Custom Itinerary" CTA in empty state and "Plan a trip like this" per card. This is correct — it's contextual, not duplicate.

### Section Background Pattern
```text
┌─────────────────────────────────┐ cream bg
│  Two-col: Storyboards + Sidebar │
├─────────────────────────────────┤ white bg
│  Social Presence (full-width)   │
├─────────────────────────────────┤ cream bg
│  From My Travels (gallery)      │
├─────────────────────────────────┤ white bg
│  Meet Your Creator              │
├─────────────────────────────────┤ cream bg
│  Trust & Credentials            │
├─────────────────────────────────┤ white bg
│  Reviews                        │
└─────────────────────────────────┘
```

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — remove duplicate sections, add alternating backgrounds, increase spacing
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — strip to CTA + trust only
- **Edit**: `src/components/profile/ProfileHero.tsx` — remove Follow button, add CTA microcopy

