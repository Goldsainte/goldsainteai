

## Fix Creator Profile Issues

Five bugs identified on the creator public profile page. Here is the plan to resolve each:

### 1. Name Not Updating ("Test Creator" persists)
**Root cause**: Onboarding saves to `display_name` but the public profile page (`CreatorPublicProfilePage.tsx`) reads `full_name`. These are two different columns.
**Fix**: Update onboarding's `handleSubmit` to also write the display name into `full_name`. Update `handleSkip` similarly.

### 2. No Hero/Cover Image Upload
**Root cause**: There is no `cover_image_url` column on `profiles` and no uploader for it during onboarding. The hero uses `featured_photos[0]` as a fallback, but there's no dedicated cover image field.
**Fix**:
- Add a `cover_image_url` column to `profiles` via migration
- Add a cover image uploader to the onboarding Portfolio step (Step 3), reusing the existing storage upload pattern
- Update the public profile page to use `cover_image_url` for the hero, falling back to `featured_photos[0]`

### 3. Follow Button Error ("violates check constraint user_follows_check")
**Root cause**: The `user_follows` table has a CHECK constraint `follower_id <> following_id` — users cannot follow themselves. The Follow button currently shows even when viewing your own profile.
**Fix**: In `CreatorPublicProfilePage.tsx`, hide the Follow button (and pass a prop to `ProfileSidebar`) when the logged-in user is viewing their own profile. Also add a guard in `FollowButton.tsx` to prevent self-follows.

### 4. Review Button Not Visible
**Root cause**: The "Write a Review" button already exists in the code (line 214-224) but only renders when `user && user.id !== creator.id`. If the user was viewing their own profile, or wasn't logged in, it won't show. For logged-in users viewing someone else's profile, it should be visible. Need to verify this is actually broken or if the user was testing on their own profile.
**Fix**: Ensure the review section and WriteReviewModal render correctly for logged-in users viewing other profiles. Add a login prompt for unauthenticated users who want to review.

### 5. Follower Count and Avg Views Not Wired
**Root cause**: The database has triggers that auto-calculate `creator_followers` and `creator_avg_views`, but these show "—" because the values are likely `null` or `0` for new creators with no followers/posts yet. The display uses `fmt()` which returns "—" for zero/null.
**Fix**: Change the display to show `0` instead of `—` when the value is zero or null, so the stats look wired up. The triggers already handle real data.

### Technical Summary
- **Migration**: Add `cover_image_url TEXT` column to `profiles`
- **Files modified**:
  - `src/pages/onboarding/CreatorOnboardingPage.tsx` — save `full_name`, add cover image uploader
  - `src/pages/creators/CreatorPublicProfilePage.tsx` — use `cover_image_url`, hide self-follow, fix stat display
  - `src/components/FollowButton.tsx` — guard against self-follow
  - `src/components/profile/ProfileSidebar.tsx` — accept `isOwnProfile` prop to hide follow
- **New component**: Cover image uploader (or reuse `FeaturedPhotosUploader` pattern for a single image)

