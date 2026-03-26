

## Redesign Social Cards as Premium Influence Badges + Reposition Section

### Overview
Transform the flat, centered social cards into left-aligned, platform-branded influence badges with depth, hover animations, and a prominent total reach stat. Reposition the social section higher on the page (right after "How to Book") for maximum conversion impact.

### Changes

**1. `src/components/creator/CreatorSocialCards.tsx` — Full redesign**

**Layout**: Switch from centered grid to left-aligned horizontal card layout.
- Icon circle (left) with platform-specific accent color
- Platform name + handle (top-right of icon)
- Follower count in larger bold text + social proof cue below
- Chevron/arrow (far right), appears/animates on hover

**Platform-specific accents** (subtle, GS-safe):
- Instagram: `bg-gradient-to-br from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10`
- TikTok: `bg-[#010101]/5` with slight contrast
- LinkedIn: `bg-[#0077b5]/8`
- Pinterest: `bg-[#e60023]/8`
- YouTube: `bg-[#ff0000]/8`
- Twitter: `bg-[#1da1f2]/8`

**Depth & hover**:
- Default: `shadow-sm` + `border-[#E5DFC6]`
- Hover: `shadow-lg`, `scale-[1.02]`, border glow `border-[#C7A962]`, arrow slides in
- Cursor pointer on entire card (already an `<a>` tag)

**Follower count**: Bump to `text-base font-bold` with formatted numbers. Add subtle social proof label below ("Highly active" for 10K+, "Growing audience" for 1K+).

**Total Reach header**: Redesign as a prominent stat bar above the cards with Users icon, larger text, gold accent background strip.

**Grid**: Switch to `grid-cols-1 sm:grid-cols-2` for more breathing room, increase padding to `p-5`, gap to `gap-4`.

**2. `src/pages/creators/CreatorPublicProfilePage.tsx` — Reposition social section**

Move `<CreatorSocialCards>` from after About/Specialties (line 334) to directly after the "How to Book" section (after line 268), before the two-column layout begins. This places social proof right after the hero and booking guide — the highest-trust position.

### Files
- **Edit**: `src/components/creator/CreatorSocialCards.tsx` — full visual redesign
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — move social cards above two-column layout

