## Goal
Make Preview and Published use the same backend so:
- Homepage Popular Trips and Featured Trips match
- Marketplace shows all 33 published trips live
- Custom domain and published subdomain stop calling the old backend

## Plan

1. Refresh the managed backend client configuration
- Replace the stale backend reference in the generated integration so it resolves to the current backend project instead of the old `ktzsgqrqvwtxlimctkaf` project.
- Do this through the managed integration flow rather than treating `src/integrations/supabase/client.ts` as a normal hand-edited app file.

2. Remove fallback behavior that allows preview and published to diverge
- Audit the app for any `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` fallback logic or production fallback assumptions.
- Update those call sites so the app cannot silently connect to one backend in preview and another in published.
- Keep the client import shape the same across the app.

3. Validate the data path end to end
- Confirm the backend currently has 33 published trips.
- Verify Preview network requests hit the current backend.
- Verify the published subdomain and custom domain also hit the current backend after the refresh.

4. Recheck the affected UI surfaces
- Compare homepage Popular Trips / Featured Trips between Preview and Published.
- Recheck marketplace trip count and confirm the seeded published trips render live.

## Technical notes
- Root cause is a stale backend reference in the managed client/fallback path, not the marketplace query itself.
- Right now Preview is using the current backend via environment/config, while Published falls back to the old backend, causing the mismatch.
- Success criteria: all live URLs request data from the current backend only, with no requests to `ktzsgqrqvwtxlimctkaf`.