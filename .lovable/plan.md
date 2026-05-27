## What I found
- The **33 seeded trips are still in the database**.
- Current count:
  - `packaged_trips`: **33 total**
  - `packaged_trips` with published status: **33**
  - `travel_packages`: **0**
- So they were **not deleted**.

## Likely cause
- The app now reads trips from **`packaged_trips`**.
- The current homepage route is using **`src/pages/Index.tsx`**.
- `Index.tsx` does **not render the featured trips/cards section**, so on `/` the seeded trips no longer show even though they still exist.
- I also confirmed the legacy `travel_packages` seed path is no longer the source of truth here.

## Plan
1. Restore the homepage trip-card section on the actual `/` page so the 33 published seeded trips are visible again.
2. Verify the homepage is pulling from `packaged_trips` and not the legacy table.
3. Verify the marketplace grid also shows the same published trips.
4. Keep the image-card behavior, but make sure it does not hide records when a cover image is missing.

## Technical details
- Database check showed: `packaged_trips_published = 33`.
- `src/pages/Marketplace.tsx` queries `packaged_trips` with `status = 'published'`.
- `src/pages/Index.tsx` currently renders hero/sections but no trip grid.
- `src/pages/HomePage.tsx` does have a featured trips section, but that is not what the current `/` page is using.

If you approve, I’ll restore the visible trip cards on the live homepage and verify the marketplace listing too.