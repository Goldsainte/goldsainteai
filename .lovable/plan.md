## Finding: React is already deduplicated

I verified before proposing any fix:

- `npm ls react react-dom` — every entry resolves to a single `react@18.3.1` / `react-dom@18.3.1`; every nested occurrence is marked `deduped`. There is no second copy.
- `vite.config.ts` already sets `resolve.dedupe: ["react", "react-dom"]`.
- `package.json` pins a single React 18.3.1.

So the "duplicate React copy" hypothesis is not supported by the evidence. Adding another dedupe/resolutions entry would be a no-op and would not fix the crash.

Error #321 ("Invalid hook call") on `/creator-dashboard` therefore has to come from one of the other three legitimate causes:

1. A hook called conditionally / after an early return in a component actually rendered by this route (in `CreatorDashboard.tsx` itself the hooks all sit above the `Navigate` early return, but one of the many lazy-loaded tab subcomponents — `CreatorOverviewTab`, `CreatorProposalsTab`, `CreatorHiresTab`, `CreatorTripsTab`, `CreatorEarningsTab`, `CreatorSettingsTab`, `CreatorGuidesTab`, `CreatorPerformanceTab`, `CreatorServicesSection`, `CreatorAffiliateTab`, `CreatorContentToolsTab`, `TierBadge`, `GettingStartedChecklist`, or the `useCreatorTierWatcher` hook — could be violating rules of hooks).
2. A hook being called from a plain helper function instead of a component/custom hook.
3. A stale production bundle where a previously-mismatched React/ReactDOM chunk is cached in the browser (service worker or CDN), while the source tree is now clean.

## Plan

Confirm the actual cause before changing anything, then fix that. No dedupe change — it isn't needed.

1. **Reproduce and capture the exact stack.** Load `/creator-dashboard` in the running preview (dev build, unminified) with Playwright while logged in as a creator, and capture the console error + component stack. The dev build will print the real "Invalid hook call" message and the offending component name instead of just `#321`.
2. **Bisect the tab tree.** Using the query param the page already reads (`?tab=overview`, `?tab=proposals`, `?tab=trips`, …), navigate to each leaf tab and record which one triggers the crash. This isolates the failure to a single subcomponent.
3. **Inspect the offending component** for the real Rules-of-Hooks violation — most commonly:
   - a hook called after an `if (...) return` early exit,
   - a hook called inside a `.map` / callback / conditional,
   - a custom hook whose name doesn't start with `use` (React can't detect it, but callers using it inside JSX render break),
   - a hook imported from a barrel that pulls a second React (unlikely here given `npm ls`, but confirmed by inspection).
4. **Fix that specific violation** in the identified file. This is the only code change and it stays scoped to the crashing component.
5. **Clear the stale runtime bundle** if step 1 shows the source tree is already fine but production is still broken: `main.tsx` already unregisters service workers off-prod, so the residual risk is the production SW at `goldsainte.ai` serving old chunks. If that's the case, bump `swVersionPlugin`'s cache version (already automatic per build) and republish — no code change beyond a rebuild.
6. **Verify** by hitting every leaf tab of `/creator-dashboard` with Playwright and confirming zero console errors.

### Files likely to change
Exactly one of the creator tab components under `src/pages/creator/components/*` (or `src/hooks/useCreatorTierWatcher.ts`), depending on what step 2 pinpoints. No changes to `package.json`, `vite.config.ts`, or any dedupe/resolutions config.

### Explicitly NOT doing
- Not adding a `resolutions` / `overrides` block or another `resolve.dedupe` — React is already single-copy.
- Not touching unrelated routes or the marketplace.
