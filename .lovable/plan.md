## Plan: Routing, Auth Protection, Mobile Padding & SEO Fixes

### 1. New Booking Route
- Create `src/pages/trips/BookTripPage.tsx` — fetches trip by id, redirects unauth users to `/auth?redirect=/book/:id`, then redirects authed users to `/trips/:id?book=true`. Includes loading and not-found states styled with brand tokens (#f7f3ea bg, #C7A962 accent).
- In `src/routes/AppRoutes.tsx`: add lazy import and `<Route path="/book/:id" element={<RequireAuth><BookTripPage /></RequireAuth>} />`.

### 2. Remove Duplicate `/my-bookings` Route
- In `src/routes/AppRoutes.tsx`: delete the `<Navigate to="/my-trips?tab=booked" replace />` redirect block (~line 301). Keep only the protected `MyBookings` route.

### 3. Wrap Unprotected Routes with `RequireAuth`
In `src/routes/AppRoutes.tsx`, wrap:
- `/escrow-timeline`, `/emergency-contacts`, `/tour/:tourId`, `/restaurant/:restaurantId`, `/earnings`, `/notifications`, `/group-trips`, `/group-trips/:tripId`, `/apply/agent`.

### 4. Fix `returnTo` → `redirect` Param
- In `src/pages/onboarding/TravelerPreferencesOnboardingPage.tsx`: replace `navigate("/auth?returnTo=/onboarding/traveler/preferences")` with `navigate("/auth?redirect=%2Fonboarding%2Ftraveler%2Fpreferences")`.

### 5. Mobile Bottom Nav Padding (`pb-20 lg:pb-0`)
Add to outermost container in:
- `src/pages/traveler/TravelerDashboardPage.tsx`
- `src/pages/AgentDashboard.tsx`
- `src/pages/trips/PostTripPage.tsx`
- `src/pages/Marketplace.tsx`
- `src/pages/trips/MyTripsPage.tsx` (verify — may already be applied from prior pass)

### 6. SEO — Sitemap & Robots
- Create `public/sitemap.xml` with the 8 listed URLs.
- Append `Sitemap: https://goldsainte.ai/sitemap.xml` line to `public/robots.txt`.

### Verification
- Re-read modified files; confirm no duplicate routes, all targeted routes wrapped, sitemap reachable at `/sitemap.xml`.
