

## Revert "Get a Custom Itinerary" Modal → Navigate to /post-trip

### Problem
The `RequestTripModal` was added as an inline form, but the user wants the CTA to navigate to the existing `/post-trip` flow with the creator pre-selected (like the brand profile does).

### Changes

**1. `CreatorPublicProfilePage.tsx`**
- Change `handleRequestTrip` from `setRequestModalOpen(true)` to `navigate(/post-trip?creatorId=${creator.id}&creatorName=${encodeURIComponent(displayName)})` 
- Remove `requestModalOpen` state, remove `<RequestTripModal>` render, remove the import

**2. `HowCreatorWorks.tsx`**
- Update step copy and CTA microcopy to say "Post your trip request" instead of "Get a custom itinerary" language, keeping it consistent with the /post-trip flow

**3. `ProfileSidebar.tsx` + `ProfileTripsGrid.tsx`**
- Revert button text from "Get a custom itinerary" back to "Request a Trip" (since it now navigates to the full trip posting flow, not a mini-form)

**4. No file deletion** — `RequestTripModal.tsx` can remain for potential future use elsewhere

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx`
- **Edit**: `src/components/profile/ProfileSidebar.tsx`
- **Edit**: `src/components/profile/ProfileTripsGrid.tsx`
- **Edit**: `src/components/creator/HowCreatorWorks.tsx`

