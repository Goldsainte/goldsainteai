

## Three Issues to Fix

### 1. CreatorSettingsTab links to nonexistent `/settings` route
**File:** `src/pages/creator/components/CreatorSettingsTab.tsx`
- Change `to="/settings"` to `to="/travel-settings"` (the actual settings route)

### 2. Remove all "Creator Studio" references
**Files to update:**
- `src/pages/CreatorDashboard.tsx` (line 160): Change "Creator Studio" label to "Creator Dashboard"
- `src/pages/onboarding/CreatorOnboardingPage.tsx` (lines 477, 480): Change "Creator Studio" to "Creator Dashboard" / "Creator Dashboard by Goldsainte AI"
- `src/pages/TikTokLab/StoryboardsPage.tsx` (line 100): Change "Back to Creator Studio" to "Back to Dashboard"
- `src/i18n/locales/en.json` (lines 14, 360): Update "Goldsainte Creator Studio" references

### 3. Traveler seeing Creator Dashboard — 404 on screenshot
The user's screenshot shows a Traveler account navigating to `/creator-dashboard` and getting a 404. The Header already gates the Creator Dashboard link behind `{isCreator && ...}`, so the conditional rendering is correct. The 404 is likely because the user navigated directly to `/creator-dashboard` as a Traveler. 

**Fix:** Add role guard in `src/pages/CreatorDashboard.tsx` — if user is not a creator (check `account_type` from profile), redirect to `/traveler` instead of showing the page. This prevents direct URL access by non-creators.

