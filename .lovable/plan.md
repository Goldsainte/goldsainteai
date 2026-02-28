

## Remove TikTok Connection from Creator Dashboard

### Changes to `src/pages/CreatorDashboard.tsx`

1. **Remove the "TikTok Linked" stat card** (lines 178-183) — replace with a more relevant stat or remove entirely, leaving 2 stat cards (Trip Stories + Estimated Earnings)

2. **Remove the entire "TikTok Connection Card" section** (lines 198-237) — the full card with connection status and manage/connect button

3. **Remove TikTok-related fields from the `CreatorStats` type** — remove `tiktokConnected`, `totalTripsLinked`, and TikTok-related story fields (`postedToTikTok`, `tiktokVideoId`)

4. **Remove TikTok references in Recent Stories** — remove the "Published"/"Draft" badge based on `postedToTikTok` and the TikTok video link (lines 301-319)

5. **Clean up unused imports** — remove `Video` from lucide if no longer used, and the TikTok SVG icon

### Result
The dashboard will show 2 stat cards (Trip Stories, Estimated Earnings) and the Recent Stories list without TikTok-specific status indicators.

