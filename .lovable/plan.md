

## Creator Profile — Instagram/TikTok Style Rebuild

### Overview
Strip the page down to a compact identity header with inline stats, then make content the entire page. Two tabs (Storyboards / Moments) replace all the separate sections. Remove About, Social Presence, Trust, and How It Works as standalone sections — fold key info into the header or inline badges.

### New Page Structure
```text
┌──────────────────────────────────────┐
│ Back bar                             │
├──────────────────────────────────────┤
│ COMPACT HEADER                       │
│ [Avatar]  Name ✓        [CTA] [Follow]│
│           Bio (2 lines max)          │
│ 12.4K followers · 18 storyboards · 92 posts │
│ ─── how it works strip (1 line) ─── │
├──────────────────────────────────────┤
│ [🔲 Storyboards] [📷 Moments]  ← tabs│
├──────────────────────────────────────┤
│                                      │
│  CONTENT GRID (3-col / 2-col mobile) │
│  (storyboards OR media based on tab) │
│                                      │
├──────────────────────────────────────┤
│ Reviews (minimal)                    │
└──────────────────────────────────────┘
```

No sidebar. No alternating backgrounds. No separate sections for Social, Trust, About, How It Works.

### Changes by File

**1. `src/components/profile/ProfileHero.tsx` — Compact IG-style header (full rewrite)**
- Remove cover image entirely (or make it a thin banner, ~120px)
- Layout: single row — avatar (80px) left, name+bio+stats right, CTA+Follow far right
- Name row: `{name}` + verified badge inline
- Bio: 2-line max, `line-clamp-2`, uses `serviceLine` or `tagline`
- Stats row below name: `{followers} followers · {storyboardCount} storyboards · {postCount} posts` — all inline, separated by middots, bold numbers
- Right side: "Get Custom Itinerary" button + Follow button side by side
- Below header: subtle 1-line "how it works" strip: `"Share your travel style → Get a custom itinerary → Book your trip"` in small muted text
- Inline trust badges under CTA: `✓ Verified · 🔒 Secure · ⏱ Responds in 24h` — tiny text, no separate section
- Remove: cover image overlay, 3-column grid, center column (pills, location, rating), mobile-only section
- New props: `storyboardCount`, `postCount`, `onFollow` (or keep FollowButton component)

**2. `src/pages/creators/CreatorPublicProfilePage.tsx` — Flatten to tabs + grid**
- Remove ALL standalone sections: Social Presence, Meet Your Creator, Trust & Credentials, How It Works, Conversion
- Remove sidebar entirely (no `ProfileSidebar`, no 2-column grid)
- Remove `CreatorSocialCards`, `CreatorTrustSection` imports and usage
- Add state: `activeTab: "storyboards" | "moments"` (default "storyboards")
- Count media items (from `creator_media` query) and storyboards for stats
- Pass `storyboardCount` and `postCount` to `ProfileHero`
- After header, render tab bar: two tabs with underline indicator, IG-style
- When "Storyboards" tab active: render `CreatorStoryboardGrid` (but without its own section title — just the grid)
- When "Moments" tab active: render `CreatorMediaGallery` (without section title)
- Keep Reviews at bottom, minimal
- Single `max-w-5xl` container, no sidebar column
- Background: flat `bg-white` or `bg-[#FDF9F0]`, no alternating

**3. `src/components/creator/CreatorStoryboardGrid.tsx` — Remove section title**
- Add optional prop `hideTitle?: boolean` (default false for backward compat)
- When `hideTitle` is true, skip the `<h2>` section title — just render the grid
- Keep empty state as-is

**4. `src/components/creator/CreatorMediaGallery.tsx` — Remove section title**
- Add optional prop `hideTitle?: boolean`
- When `hideTitle` is true, skip the `<h2>` "From My Travels" header
- Change grid to 3-column fixed grid (`grid grid-cols-3 gap-1`) like IG, instead of masonry
- Square aspect ratio for all items (`aspect-square object-cover`)

**5. `src/components/profile/ProfileSidebar.tsx` — No changes needed**
- Still used by AgentPublicProfilePage, keep as-is
- Just remove its usage from CreatorPublicProfilePage

### Technical Details

- Tab state managed with `useState<"storyboards" | "moments">("storyboards")`
- Tab bar styled with bottom border indicator, similar to IG tabs
- Media count fetched alongside existing queries — count from `creator_media` table
- FollowButton rendered inline in header right column
- "How it works" strip is a single `<p>` with arrows, not a component
- Trust signals compressed to inline text badges: `"✓ Verified · Secure booking · Direct messaging"`

### Files
- **Edit**: `src/components/profile/ProfileHero.tsx` — compact IG-style header
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — remove sections, add tabs, flatten layout
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — add `hideTitle` prop
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — add `hideTitle` prop, IG grid option

