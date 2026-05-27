1. Update the Handpicked Trips marketplace query so it always fetches the full published `packaged_trips` set for that tab, not a limited or curated subset.
2. Remove any logic on the Handpicked Trips screen that makes the seeded inventory appear partial or secondary compared with editorial rows, while keeping the existing card design intact.
3. Verify the result in the browser by checking the Handpicked Trips grid renders the full seeded inventory and that the network request returns the expected published trip set.

Technical details
- Focus file: `src/pages/Marketplace.tsx`
- Likely supporting checks: `src/components/marketplace/LiveTripGrid.tsx`, `src/components/marketplace/LiveTripCard.tsx`
- Keep backend data unchanged; the 33 published trips already exist in `packaged_trips`
- Preserve current visual styling and image-card behavior; only fix the data/rendering path for the Handpicked Trips tab