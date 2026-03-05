

## Legacy Code Cleanup

### Files to delete entirely
- `src/components/ExpediaModalPortal.tsx` — deprecated modal
- `src/components/CompactHeaderSearch.tsx` — deprecated search
- `src/pages/TikTokLab/StoryboardDetailPage.tsx` — redirect stub
- `src/pages/StoryboardEditorPage.tsx` — redirect stub
- `src/utils/createBooking.ts` — re-exports a function that throws
- `src/pages/partners/EscrowMilestonesPage.tsx` — disabled placeholder
- `src/pages/admin/AdminMarketplaceOversightPage.tsx` — disabled placeholder
- `tests/12-feed-moment-interaction.spec.ts` — tests disabled features
- `tests/13-search-journey-creator.spec.ts` — tests disabled features

### Files to edit
1. **`src/routes/AppRoutes.tsx`**
   - Remove imports for deleted pages (ExpediaModalPortal, CompactHeaderSearch, TikTokLab stubs, StoryboardEditorPage, EscrowMilestonesPage, AdminMarketplaceOversightPage)
   - Remove all commented-out route blocks (social feed, Instagram, search/trending)
   - Replace any routes pointing to deleted pages with `<Navigate>` redirects where needed or remove entirely

2. **`src/data/siteRoutes.ts`** — Remove `/tiktok-lab` entry, update any "TikTok Lab" labels to current terminology

3. **`src/data/helpCenterFAQs.ts`** — Update the commission FAQ to reference `/agent/earnings` instead of `/tiktok-lab/earnings`

4. **`src/pages/bookings/BookingDetailPage.tsx`** — Change `/tiktok-lab` link to `/storyboards`

5. **`src/pages/storyboards/StoryboardDetailPage.tsx`** — Change `/tiktok-lab` navigation to `/storyboards`

6. **`src/services/bookingService.ts`** — Remove the dead `createBookingFromProposal` function (it just throws)

7. **`e2e/critical-flows.spec.ts`** — Update TikTok Lab test paths from `/tiktok-lab/storyboards` to `/storyboards`

### Not touching (intentionally kept)
- TikTok handle fields in profiles — legitimate user data, not legacy
- `supabase/functions/tiktok-signin-callback/` — may be needed for creator auth
- "Concierge" in email templates — used as brand language for support, not the deprecated feature
- `src/pages/TikTokLab/StoryboardsPage.tsx` — still actively used at `/storyboards` route (just poorly named file; renaming is optional)

### Result
Removes ~10 dead files, eliminates all commented-out route blocks, and updates stale `/tiktok-lab` references to current paths.

