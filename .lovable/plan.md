

## Comprehensive Creator Profile Page — Luxury Editorial Redesign

### Problem
The creator profile has drifted from the established Mr. & Mrs. Smith / Farfetch editorial aesthetic. It currently feels like a SaaS dashboard with numbered step cards, platform-branded social blocks, icon-heavy trust badges, and fragmented small sections. The LuxeTribes reference shows how a creator profile should flow: editorial, immersive, content-led, with clear conversion moments woven in naturally.

### Design Principles (from established brand system)
- Serif headlines (Playfair Display / `font-secondary`), sans-serif body
- Text-forward — remove decorative icon circles, emoji badges
- Gold dividers and accent borders instead of heavy cards
- Cream (#FDF9F0) background, white cards with subtle `#E5DFC6` borders
- Minimal, refined — fewer sections, more breathing room

### New Page Flow

```text
┌──────────────────────────────────────────┐
│ HERO (full-bleed, keep as-is — good)     │
├──────────────────────────────────────────┤
│ EDITORIAL INTRO                          │
│  Serif headline + bio + specialties      │
│  (merge About + Specialties + Styles)    │
├──────────────────────────────────────────┤
│ TWO-COLUMN LAYOUT                        │
│ ┌─────────────────┐ ┌─────────────────┐  │
│ │ LEFT COLUMN      │ │ STICKY SIDEBAR  │  │
│ │                  │ │                 │  │
│ │ Featured         │ │ Request a Trip  │  │
│ │ Storyboards      │ │ (primary CTA)   │  │
│ │ (large cards)    │ │                 │  │
│ │                  │ │ Storyboards     │  │
│ │ Content Gallery  │ │ (compact list)  │  │
│ │                  │ │                 │  │
│ │ Credentials      │ │ Follow / Save   │  │
│ │ (text-forward)   │ │                 │  │
│ │                  │ │ Trust lines     │  │
│ │ Trips            │ │ (text only)     │  │
│ │                  │ │                 │  │
│ │ Reviews          │ └─────────────────┘  │
│ └─────────────────┘                      │
└──────────────────────────────────────────┘
```

### Changes by File

**1. `src/pages/creators/CreatorPublicProfilePage.tsx` — Layout restructure**
- Remove standalone `<HowCreatorWorks>` section (the 3-step numbered cards). Replace with a single elegant microcopy line near the CTA in the sidebar ("Share your vision → Receive a plan → Book securely")
- Remove standalone `<CreatorSocialCards>` section from before two-column layout. Social presence becomes a subtle inline element within the editorial intro (follower count as a single line, not colored cards)
- Merge About, Specialties, and Travel Styles into a single "Editorial Intro" section with serif headline, flowing prose, and pills — placed full-width above the two-column layout
- Move `<CreatorTrustSection>` content inline as text-forward credentials (no icon circles)
- Remove "Who This Is For" section (Best For / Not Ideal For) — merge into About prose or drop for now (too granular, breaks editorial flow)

**2. `src/components/creator/HowCreatorWorks.tsx` — Deprecate from profile**
- Keep the component (used elsewhere) but stop rendering it on the creator profile
- Add a refined 3-line microcopy version to the sidebar CTA area instead:
  ```
  Share your travel vision
  Receive a personalized plan within 48h
  Book securely through Goldsainte
  ```

**3. `src/components/profile/ProfileSidebar.tsx` — Editorial refinement**
- Convert "Request a Trip" CTA block to a more prominent card with serif headline "Plan Your Journey" and the 3-step microcopy above the button
- Remove Lucide icons from Trust & Safety list — use gold bullet dots or em-dashes instead, per editorial typography standard
- Keep Storyboards section as-is (already good)
- Remove `FollowButton` from above CTA — move below as secondary action
- Restyle rating display: use serif number, remove star icons, use text "★ 4.8 · 12 reviews" inline

**4. `src/components/creator/CreatorSocialCards.tsx` — Simplify to inline element**
- Replace the grid of platform-branded cards with a single subtle line or compact row: platform icons (small, monochrome) + total reach number
- No colored backgrounds, no "Highly active" labels, no large follower counts per platform
- Render as a simple `<div>` that fits within the editorial intro section

**5. `src/components/creator/CreatorTrustSection.tsx` — Text-forward redesign**
- Remove icon circles from stat cards — use serif numbers with text labels below
- Remove the expandable "Verified Partner" accordion — replace with a simple gold-accented text line
- Certification pills: keep but use more refined styling (no Award icons)

**6. `src/components/creator/CreatorMediaGallery.tsx` — Masonry editorial feel**
- Change section header from uppercase sans-serif to serif: "Gallery" in Playfair Display
- Keep masonry layout but use `rounded-xl` (not `rounded-2xl`) for subtler corners
- Remove the tab UI (Photos / Videos) — show all media in a single masonry grid with video play indicators

### What stays unchanged
- `ProfileHero` — already strong, matches the aesthetic
- Data fetching logic — no changes
- Storyboard cards in sidebar — already editorial
- Back bar — clean, keep as-is

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — restructure layout and section order
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — editorial CTA card, text-only trust, refined rating
- **Edit**: `src/components/creator/CreatorSocialCards.tsx` — simplify to inline compact display
- **Edit**: `src/components/creator/CreatorTrustSection.tsx` — text-forward, no icon circles
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — serif header, unified grid

