

## Fix: Remove Duplicate "Request a Trip" Button + Fix Creator Pre-Selection

### Problems
1. **Duplicate CTA**: "Request a Trip" appears twice — once in the `ProfileTripsGrid` empty state and once in the sticky `ProfileSidebar`. Only the sidebar CTA is needed.
2. **Creator not pre-selected**: The navigate URL uses `?creatorId=...` but the PostTripPage reads `?fromCreator=...`, so the trip never gets routed to the creator.

### Changes

**1. `CreatorPublicProfilePage.tsx` (line 194)**
- Fix the query param from `creatorId` to `fromCreator` so PostTripPage picks it up:
  ```
  navigate(`/post-trip?fromCreator=${creator.id}`)
  ```
- Remove `creatorName` param (PostTripPage already fetches the name from the profile).

**2. `ProfileTripsGrid.tsx`**
- Remove the `onRequestTrip` prop and the "Request a Trip" button from the empty state. Keep the "Trips coming soon" message but drop the duplicate CTA — the sidebar already handles it.

**3. `CreatorPublicProfilePage.tsx` (line 374-378)**
- Stop passing `onRequestTrip` to `ProfileTripsGrid` since it no longer uses it.

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — fix `fromCreator` param, remove `onRequestTrip` from `ProfileTripsGrid`
- **Edit**: `src/components/profile/ProfileTripsGrid.tsx` — remove `onRequestTrip` prop and CTA button from empty state

