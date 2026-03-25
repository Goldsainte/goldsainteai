

## Conversion-Focused "How to Book" + CTA Copy + Service Line Updates

### Changes

**1. Update `HowCreatorWorks.tsx` — personalized content + urgency microcopy**
- Accept `creatorName` prop to personalize step 2 ("Radu builds a personalized trip within 24–48 hours")
- Update step descriptions to match the requested copy exactly
- Add urgency microcopy below the cards: "Takes 2 minutes · No commitment" and "Response within 24 hours"
- Update section title to "How to Book With This Creator"

**2. Move "How It Works" directly under the Hero** in `CreatorPublicProfilePage.tsx`
- Move `<HowCreatorWorks />` from its current position (line 358, between gallery and trips) to directly after the hero section (line 237)
- Pass `creatorName={displayName}` prop

**3. Add service type line under name in `ProfileHero.tsx`**
- New optional `serviceLine` prop (e.g. "Custom luxury travel planning · Africa & cultural experiences")
- Rendered below the name, above the tagline, as a subtle descriptor

**4. Update all "Request a trip" CTA copy to "Get a custom itinerary"**
- `ProfileSidebar.tsx` — button text
- `ProfileTripsGrid.tsx` — empty state CTA
- `CreatorPublicProfilePage.tsx` — sidebar microcopy
- `RequestTripModal.tsx` — modal title/trigger if applicable

**5. Wire `serviceLine` in `CreatorPublicProfilePage.tsx`**
- Auto-generate from available data: combine niches + destination tags (e.g. "Custom luxury travel planning · Africa & cultural experiences")
- Pass to `ProfileHero`

### Files
- **Edit**: `src/components/creator/HowCreatorWorks.tsx` — personalized copy, urgency microcopy, accept `creatorName` prop
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — move HowCreatorWorks up, pass creatorName, build serviceLine, update CTA copy
- **Edit**: `src/components/profile/ProfileHero.tsx` — add `serviceLine` prop
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — "Get a custom itinerary" CTA text
- **Edit**: `src/components/profile/ProfileTripsGrid.tsx` — update empty state CTA text

