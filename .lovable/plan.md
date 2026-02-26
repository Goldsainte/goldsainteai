

# Fix All Outdated Storyboard & Navigation Links

## Problem

Multiple components across the app still reference legacy routes (`/tiktok-lab/storyboards`, `/tiktok-lab`, `/trip/:tripId/storyboard`) that either don't exist or redirect incorrectly. This causes "Trip not found" errors and broken navigation.

## Audit Results

Here are all the broken links found, grouped by the fix needed:

### Category 1: `/tiktok-lab/storyboards` → `/storyboards`
These link to a route that doesn't exist in AppRoutes.

| File | Line | Context |
|------|------|---------|
| `src/components/LuxuryExperiencesSection.tsx` | 78 | `navigate('/tiktok-lab/storyboards')` |
| `src/components/TopAttractionsSection.tsx` | 35 | `navigate('/tiktok-lab/storyboards')` |
| `src/components/CuratedCollections.tsx` | 64 | `navigate('/tiktok-lab/storyboards')` |
| `src/components/WinterSunHero.tsx` | 32 | `navigate('/tiktok-lab/storyboards')` |
| `src/pages/RestaurantDetail.tsx` | 37 | `navigate('/tiktok-lab/storyboards')` |

### Category 2: `/tiktok-lab` → `/partner` or `/storyboards`
`/tiktok-lab` has no route definition. Links to it from creator/agent contexts should go to `/partner` (which redirects to marketplace) or the appropriate dashboard.

| File | Line | Context | New Target |
|------|------|---------|------------|
| `src/pages/BrowseCreators.tsx` | 93 | `to="/tiktok-lab"` | `/storyboards` |
| `src/pages/CreatorDashboard.tsx` | 110, 191, 220, 237 | Multiple `to="/tiktok-lab"` links | `/storyboards` |
| `src/components/AppSidebar.tsx` | 39 | `url: "/tiktok-lab/earnings"` | `/agent/earnings` |
| `src/pages/partner/PartnerConsolePage.tsx` | 94, 269 | `to="/tiktok-lab"` | `/storyboards` |
| `src/pages/storyboards/MyStoryboardsPage.tsx` | 79, 163 | Back button to `/tiktok-lab` | `/creator-dashboard` |
| `src/pages/TikTokLab/StoryboardsPage.tsx` | 93 | `backTo: "/tiktok-lab"` | `/creator-dashboard` |

### Category 3: `/trip/:tripId/storyboard` → `/storyboards/new` or `/storyboards/:id`
This route uses the old `StoryboardEditorPage` which just redirects to `/storyboards`. The AI concierge and Madison chat create trips and then try to navigate to a storyboard for that trip.

| File | Line | Context |
|------|------|---------|
| `src/components/AIBookingConcierge.tsx` | 179, 529, 614, 934 | `navigate(/trip/.../storyboard)` |
| `src/components/MadisonChat.tsx` | 104, 137 | `navigate(/trip/.../storyboard)` |
| `src/pages/CreatorTripPage.tsx` | 156 | `to={/trip/${id}/storyboard}` |

### Category 4: StoryboardExplainerCard `/post-trip` link
This link is **correct** — it goes to `/post-trip` which is the trip posting form. No change needed.

### Category 5: "Convert to Trip" links
These all correctly link to `/post-trip?fromStoryboard=${id}`. No change needed.

## Changes

### Files to update (13 files total):

1. **`src/components/LuxuryExperiencesSection.tsx`** — `/tiktok-lab/storyboards` → `/storyboards`
2. **`src/components/TopAttractionsSection.tsx`** — `/tiktok-lab/storyboards` → `/storyboards`
3. **`src/components/CuratedCollections.tsx`** — `/tiktok-lab/storyboards` → `/storyboards`
4. **`src/components/WinterSunHero.tsx`** — `/tiktok-lab/storyboards` → `/storyboards`
5. **`src/pages/RestaurantDetail.tsx`** — `/tiktok-lab/storyboards` → `/storyboards`
6. **`src/pages/BrowseCreators.tsx`** — `/tiktok-lab` → `/storyboards`
7. **`src/pages/CreatorDashboard.tsx`** — all `/tiktok-lab` → `/storyboards`
8. **`src/components/AppSidebar.tsx`** — `/tiktok-lab/earnings` → `/agent/earnings`
9. **`src/pages/partner/PartnerConsolePage.tsx`** — `/tiktok-lab` → `/storyboards`
10. **`src/pages/storyboards/MyStoryboardsPage.tsx`** — `/tiktok-lab` → `/creator-dashboard`
11. **`src/pages/TikTokLab/StoryboardsPage.tsx`** — `/tiktok-lab` → `/creator-dashboard`
12. **`src/components/AIBookingConcierge.tsx`** — `/trip/${id}/storyboard` → `/storyboards/new` (4 locations)
13. **`src/components/MadisonChat.tsx`** — `/trip/${id}/storyboard` → `/storyboards/new` (2 locations)
14. **`src/pages/CreatorTripPage.tsx`** — `/trip/${id}/storyboard` → `/storyboards/new`

All changes are simple find-and-replace of route strings. No logic changes.

