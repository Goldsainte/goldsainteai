

## Add Media Management to Creator Dashboard + Profile Page Gaps

### Problem
The `CreatorMediaUploader` only exists in the onboarding flow. Once a creator has completed onboarding (e.g., Radu Diaconesa), there is no way to add/edit photos, videos, or Instagram/TikTok reels from the Creator Dashboard or the public profile page.

### Plan

**1. Add a "Portfolio" tab to the Creator Dashboard**

Add a new tab between "My Trips" and "Earnings" in `CreatorDashboard.tsx`:
- New component: `CreatorPortfolioTab.tsx`
- Renders the existing `CreatorMediaUploader` with the user's current `creator_media` items pre-loaded from the database
- On save, upserts items to `creator_media` (same logic as onboarding)
- Also allows editing cover image and featured photos from this tab

**2. Add "Edit Profile" button on public profile for own profile**

In `CreatorPublicProfilePage.tsx`, when `isOwnProfile` is true:
- Show an "Edit Profile" button in the hero or top bar that links to `/creator-dashboard` (portfolio tab)
- This gives returning creators a clear path to manage their media

**3. Critical missing items on the profile page**

After auditing the profile, these gaps should also be addressed:

- **No average rating display**: The `ProfileHero` and `ProfileSidebar` support `rating` and `reviewCount` props but the public profile page never fetches or passes them. Need to query `profile_reviews` for average rating + count and wire it through.
- **No "Edit Profile" affordance for own profile**: Creators viewing their own page have no way to edit bio, avatar, niches, or media without going back to onboarding.
- **No messaging/contact CTA**: The sidebar has "Request a trip" but no direct message option (the `MessageCircle` icon appears in trust badges but isn't actionable).

### Files

- **New**: `src/pages/creator/components/CreatorPortfolioTab.tsx` — media management tab with `CreatorMediaUploader`, loads existing `creator_media` on mount, saves on submit
- **Edit**: `src/pages/CreatorDashboard.tsx` — add Portfolio tab (icon: `ImageIcon`) to the tab list and mobile select
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — add "Edit Profile" button for own profile, fetch and pass `rating`/`reviewCount` to `ProfileHero` and `ProfileSidebar`

### Technical Detail

```text
CreatorPortfolioTab
├── Loads creator_media from DB on mount
├── Renders CreatorMediaUploader (existing component)
├── Cover image uploader (reuse pattern from onboarding)
├── Save button → upsert to creator_media table
└── Delete removed items from DB

CreatorPublicProfilePage additions
├── Query: SELECT AVG(rating), COUNT(*) FROM profile_reviews WHERE reviewee_id = :id
├── Pass rating + reviewCount to ProfileHero and ProfileSidebar
└── isOwnProfile → render "Edit Profile" link to /creator-dashboard?tab=portfolio
```

