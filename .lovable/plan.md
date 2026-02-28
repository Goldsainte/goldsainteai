

## Consolidate Creator Profile Routes: Redirect `/creator/:id` to `/creators/:id`

The old `/creator/:id` page (`CreatorProfilePage.tsx`) is unstyled, relies on a failing edge function, and shows confusing content (moodboard with stock images, collab form). The newer `/creators/:id` page already has the proper luxury Mr. & Mrs. Smith design.

### Changes

1. **`src/routes/AppRoutes.tsx`** — Replace the `CreatorProfilePage` route with a redirect:
   - Change `<Route path="/creator/:id" element={<CreatorProfilePage />} />` to use a `<Navigate>` component that redirects to `/creators/:id`
   - Remove the lazy import for `CreatorProfilePage`

2. **`src/App.tsx`** — Remove `/creator/:id` from the `HIDE_HEADER_PAGES` / `HIDE_FOOTER_PREFIXES` arrays if present, since the redirect will land on `/creators/:id` which handles its own layout.

3. **Update any internal links** pointing to `/creator/:id` to use `/creators/:id` instead (e.g., in `CreatorCard.tsx` which navigates to `/creators/${creator.id}`).

