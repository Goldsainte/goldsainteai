

## Current State

### 1. Follow Button
The `FollowButton` component exists and works, but it's **only used on TravelProfile** (the social feed profile page). It is **missing from both public profile pages**:
- `src/pages/creators/CreatorPublicProfilePage.tsx` — no follow button
- `src/pages/agents/AgentPublicProfilePage.tsx` — no follow button

The `ProfileSidebar` component (used by both) has no follow capability.

### 2. Reviews
The database has `reviews`, `agent_reviews`, and `supplier_reviews` tables, but there is **no user-facing UI** to submit or view reviews on creator/agent public profiles. The agent profile sidebar shows a rating display but no way to write a review.

### 3. Disputes
Dispute submission exists on the **BookingDetailPage** (`/my-bookings/:id`) — users can file disputes from their booking detail. There's also a `DisputeResolutionModal` for marketplace jobs and a `PaymentDisputeModal` for payment issues. However, there's **no prominent, easily discoverable entry point** for disputes from the main navigation or help center.

---

## Plan

### A. Add Follow Button to Creator & Agent Public Profiles (2 files)

**`src/components/profile/ProfileSidebar.tsx`**
- Add optional props: `targetUserId?: string`, `showFollowButton?: boolean`
- Import and render `FollowButton` below the "Request a trip" CTA when `targetUserId` is provided

**`src/pages/creators/CreatorPublicProfilePage.tsx`**
- Pass `targetUserId={creator.id}` to `ProfileSidebar`

**`src/pages/agents/AgentPublicProfilePage.tsx`**
- Pass `targetUserId={agent.id}` to `ProfileSidebar`

### B. Add Review System to Public Profiles (new components + updates)

**New: `src/components/profile/WriteReviewModal.tsx`**
- Modal with star rating (1-5), text review, and submit button
- Inserts into the `reviews` table (which has `booking_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`)
- Requires authentication; shows toast if not signed in

**New: `src/components/profile/ReviewsList.tsx`**
- Fetches and displays reviews for a given user from the `reviews` table
- Shows reviewer avatar, name, star rating, date, and comment
- Sorted by most recent

**`src/pages/creators/CreatorPublicProfilePage.tsx`**
- Add `ReviewsList` section below the trips grid
- Add "Write a Review" button (visible to authenticated users)

**`src/pages/agents/AgentPublicProfilePage.tsx`**
- Same additions as creator profile

### C. Make Dispute Submission More Discoverable (2 files)

**`src/components/profile/ProfileSidebar.tsx`**
- The "Dispute resolution support" trust badge is already shown — make it a link to `/dispute-resolution`

**`src/pages/BookingDetailPage.tsx`**
- Already has dispute form — no changes needed

**`src/pages/DisputeResolution.tsx`**
- Add a clear CTA directing users to their bookings page (`/my-bookings`) where they can file a dispute from the booking detail, making the path more obvious

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/profile/ProfileSidebar.tsx` | Add follow button prop + render; link dispute badge |
| `src/pages/creators/CreatorPublicProfilePage.tsx` | Pass follow prop; add reviews section |
| `src/pages/agents/AgentPublicProfilePage.tsx` | Pass follow prop; add reviews section |
| `src/components/profile/WriteReviewModal.tsx` | **New** — star rating + comment form |
| `src/components/profile/ReviewsList.tsx` | **New** — display reviews list |
| `src/pages/DisputeResolution.tsx` | Add CTA to bookings for filing disputes |

