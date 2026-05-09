## Plan: 6 Targeted Fixes

### 1. BookTripPage redirect
`src/pages/trips/BookTripPage.tsx` — change the post-load `navigate` from `/trips/${trip.id}?book=true` to `/marketplace/trip/${trip.id}` (keep `replace: true`).

### 2. Wire TripBookingSidebar to Stripe checkout
`src/components/trips/TripBookingSidebar.tsx` — replace `handleRequestToBook` entirely with the provided implementation that:
- Redirects unauth users to `/auth?redirect=/marketplace/trip/${tripId}`.
- Guards on `spotsLeft <= 0` (note: current component uses `spotsAvailable`; will introduce a local `spotsLeft = spotsAvailable ?? Infinity` so the supplied snippet works without breaking existing prop API).
- Invokes `create-checkout` edge function with `tripId`, `pricePerPerson`, `currency`, `quantity: 1`, and success/cancel URLs.
- Redirects to `data.url` via `window.location.href`.
- Shows toast on error.

Note: The existing `create-checkout` edge function will be assumed to exist. If it doesn't, will flag during implementation (the `trip-checkout-create` function exists but takes a different payload — will verify in implement phase whether to create a new `create-checkout` function or rename the call).

### 3. Remove debug logging from supabase client
`src/integrations/supabase/client.ts` — delete the two `if (import.meta.env.PROD/DEV && isPlaceholderConfig)` blocks (lines ~28–43) so the file has zero console statements. The `isPlaceholderConfig` constant becomes unused and will also be removed.

### 4. Protect agent-trips and creator-trips routes
`src/routes/AppRoutes.tsx` — wrap `/agent-trips` and `/creator-trips` routes with `<RequireAuth>`.

### 5. Sitemap & robots
- Overwrite `public/sitemap.xml` with the 8-URL XML provided (replacing existing 8-URL version which differs slightly in URL set).
- Append `Sitemap: https://goldsainte.ai/sitemap.xml` line to `public/robots.txt` (currently missing).

### 6. Consolidate `/trip/:slug` route
`src/routes/AppRoutes.tsx` — replace the `/trip/:slug` route element with `<Navigate to="/marketplace" replace />`. Remove the now-unused lazy import for the prior component (will identify during implementation).

### Verification
- Re-read modified files.
- Confirm no console statements remain in `client.ts`.
- Confirm `AppRoutes.tsx` has both routes wrapped and `/trip/:slug` redirects.
- Confirm sitemap accessible and robots.txt updated.
