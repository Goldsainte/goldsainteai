

# Delete Creator Studio (TikTok Lab)

## Scope

Remove the Creator Studio feature entirely — the `/tiktok-lab` routes, dashboard page, TikTok story composer, earnings page, partner trips page, and all navigation links pointing to it. Storyboard routes (`/storyboards/*`) are kept since they exist independently.

## Files to Delete (6 files)

1. `src/pages/TikTokLab.tsx` — legacy TikTok Lab composer page
2. `src/pages/TikTokLabPage.tsx` — landing/marketing page for Creator Lab
3. `src/pages/tiktok/TikTokLabDashboardPage.tsx` — Creator Studio dashboard
4. `src/pages/tiktok/TikTokEarningsPage.tsx` — Creator earnings page
5. `src/pages/tiktok/PartnerTripsPage.tsx` — Partner trips page (served at `/tiktok-lab/trips`)
6. `src/services/creatorLabService.ts` — Creator Lab metrics service

## Files to Edit (7 files)

### 1. `src/routes/AppRoutes.tsx`
- Remove lazy imports: `TikTokLabDashboardPage`, `TikTokEarningsPage`, `TikTokLabPage`, `TikTokLab` (the legacy one)
- Remove all `/tiktok-lab` routes (lines 402-413 and 471-478): dashboard, trips, earnings, and legacy storyboard redirects
- Keep `/storyboards` routes as-is

### 2. `src/components/social/LeftNav.tsx`
- Remove the "Creator Studio" nav item block (the `NavItemLink` to `/tiktok-lab` with the `Video` icon), including the conditional `(isCreator || isAgentAccount || isBrand)` wrapper
- Remove the `Video` icon import

### 3. `src/components/Footer.tsx`
- Remove both footer links to `/tiktok-lab` ("Creator Studio") — appears in two footer column variants

### 4. `src/components/FeedSidebar.tsx`
- Remove the `{ to: "/tiktok-lab", icon: Video, label: "Goldsainte Creator Lab" }` sidebar entry

### 5. `src/pages/CreatorsPage.tsx`
- Remove the "Creator Studio" button that navigates to `/tiktok-lab` (lines ~369-378)
- Remove the `showCreatorLabButton` variable and its conditional

### 6. `src/components/home/TikTokLabHighlight.tsx`
- Remove or gut this component since it links to `/tiktok-lab`; alternatively delete the file and remove its usage from wherever it's imported

### 7. `src/pages/trips/TripRequestDetailPage.tsx`
- Change the back link from `/tiktok-lab` to `/marketplace` for non-traveler users

### 8. `src/components/CuratedDestinationCollections.tsx` and `src/components/TopDestinationsSection.tsx`
- Change `navigate('/tiktok-lab/storyboards')` to `navigate('/storyboards')` (the storyboards route still exists)

## What stays
- `/storyboards`, `/storyboards/new`, `/storyboards/:id` routes and their pages remain — storyboards are a standalone feature
- Creator Dashboard at `/creator-dashboard` remains (separate feature)
- TikTok OAuth callback page remains (may be useful for future integrations)

