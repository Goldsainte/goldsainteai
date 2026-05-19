## Goal

Take the public-facing creator and travel-agent directory listings offline so empty grids don't undermine credibility. Keep direct profile URLs, signup/apply flows, and admin tooling untouched.

## Changes

1. **`src/routes/AppRoutes.tsx`** — Replace the directory routes with redirects to the marketplace; leave individual profile routes alone.
   - `/creators` → `<Navigate to="/marketplace" replace />`
   - `/agents` → `<Navigate to="/marketplace" replace />`
   - `/browse-creators` and `/browse-agents` redirects updated to `/marketplace` as well.
   - `/creators/:id` and `/agents/:id` remain functional (direct links keep working).
   - Drop the now-unused `CreatorsPage` and `BrowseAgents` lazy imports.

2. **Navigation surfaces** — Remove or hide any link pointing at the directory pages.
   - Audit `Header.tsx`, `MobileBottomNav.tsx`, footer, marketplace tabs, and homepage sections (`WhoItsFor`, `RoleSpecificCTAs`, `HowItWorksSection`, `StoryboardsHighlight`) for `to="/creators"` or `to="/agents"` links. Rewrite each to `/marketplace` or remove the CTA if it was directory-specific. Admin sidebar links (`/admin/creators`, `/admin/agents`) stay.

3. **Marketplace UI** — If `MarketplaceTabs` exposes a "Creators" or "Agents" tab that renders `CreatorGrid` / agent list, hide that tab. Leave the Trips/Storyboards tabs as the default surface. Keep the underlying components in the codebase so we can re-enable them once supply exists.

4. **Keep intact**
   - All `/apply/agent`, `/apply/brand`, and creator signup CTAs.
   - Direct profile pages `/creators/:id`, `/agents/:id`.
   - Admin dashboards under `/admin/creators` and `/admin/agents`.
   - Marketing copy that references creators/agents conceptually (no empty lists are rendered there).

## Verification

- Visit `/creators`, `/agents`, `/browse-creators`, `/browse-agents` → all land on `/marketplace`.
- `/creators/<id>` and `/agents/<id>` still render the profile if the id exists.
- Header, mobile nav, and homepage no longer link to the directory pages.
- Marketplace no longer surfaces an empty Creators or Agents tab.
- `/apply/agent` and creator signup CTAs still work end-to-end.
