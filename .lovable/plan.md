

# Redesign "My Storyboards" Page — Clear Purpose & Differentiation

## Problem
The `/storyboards` page (TikTokLabStoryboardsPage) is confusing for users:
1. It doesn't clearly explain what a storyboard IS (a personal Pinterest-style mood board for visualizing dream trips)
2. It doesn't explain how it differs from the storyboard step inside "Post a Trip" (which is attached to an active trip request going to the marketplace)
3. The page fetches user storyboards correctly but the UX doesn't communicate value
4. The back button says "Back to Creator Studio" even for travelers
5. Storyboard cards don't show cover images — just a dark gradient placeholder

## Changes

### 1. `src/pages/TikTokLab/StoryboardsPage.tsx` — Full Redesign

**Header section:**
- Remove "Back to Creator Studio" hardcoded label — use smart back navigation based on account type (like MyStoryboardsPage does)
- Replace the generic "My Storyboards" header with a more editorial layout:
  - Small gold label: "YOUR VISUAL SCRATCHPAD"
  - Headline: "My Storyboards"
  - Subtitle (traveler): "Collect photos, destinations, and aesthetic ideas that inspire you. Think of this as your personal Pinterest board for travel — a space to dream before you commit."

**Add an explainer card** (always visible, collapsible after first visit):
- A bordered card with two columns explaining the difference:
  - Left: "Storyboard" — "Your personal mood board. Save images, browse inspiration, and visualize your dream experience. No commitment, no deadlines. Just vibes."
  - Right: "Post a Trip" — "Ready to go? When you post a trip, your storyboard becomes a brief that creators and agents compete to bring to life on the marketplace."
- A small arrow or CTA: "When you're ready → Post a Trip" linking to `/post-trip`

**Empty state:**
- Clearer messaging: "Start your travel vision board"
- Description: "Save photos of destinations, hotels, experiences, and aesthetics that excite you. When you're ready to travel, turn any storyboard into a trip request."
- Two CTAs: "Create a Storyboard" (primary) and "Browse Inspiration" (secondary, scrolls to gallery)

**Storyboard cards:**
- Show `cover_image_url` if available (currently not fetched — need to add to query)
- Add item count badge
- Show "Convert to Trip" action on hover for unconverted boards

**Browse Inspiration section:**
- Keep as-is but update subtitle copy to: "Save any image to your storyboard. When you're ready, convert your favorite board into a trip request."

### 2. Data Query Update
- Add `cover_image_url` and `is_public` to the storyboard SELECT query so cards can show cover images
- Add item count subquery or fetch separately

## Visual Layout (approximate)

```text
┌──────────────────────────────────────────────────┐
│  ← Back to Dashboard                            │
│                                                  │
│  YOUR VISUAL SCRATCHPAD                         │
│  My Storyboards              [+ New Storyboard]  │
│  Collect and visualize travel inspiration...     │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  💡 Storyboard vs Post a Trip               │ │
│  │                                             │ │
│  │  STORYBOARD          │  POST A TRIP         │ │
│  │  Your personal mood  │  When you're ready,  │ │
│  │  board. Save images, │  your storyboard     │ │
│  │  browse ideas. No    │  becomes a brief     │ │
│  │  commitment.         │  on the marketplace. │ │
│  │                      │                      │ │
│  │          Ready to go? → Create & Post a Trip│ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │ card │  │ card │  │ card │                    │
│  └──────┘  └──────┘  └──────┘                   │
│                                                  │
│  ─────────── Browse Inspiration ──────────────   │
│  [masonry grid of inspirational images]          │
└──────────────────────────────────────────────────┘
```

## Files to Edit

### `src/pages/TikTokLab/StoryboardsPage.tsx`
- Update the storyboard query to include `cover_image_url, is_public`
- Smart back button label based on `accountType`
- New editorial header with gold label + clear subtitle
- Add explainer card differentiating Storyboard vs Post a Trip
- Redesign storyboard cards to show cover images and item counts
- Update empty state with clearer messaging and dual CTAs
- Update "Browse Inspiration" subtitle copy

No database changes needed — all fields already exist.

