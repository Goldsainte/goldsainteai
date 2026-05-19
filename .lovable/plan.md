## Plan: Swap public Trust & Safety page

### 1. Replace `src/pages/TrustSafety.tsx`
Full overwrite with the uploaded editorial public-facing page (hero + 6 pillars + commitments + emergency contacts + CTA). Replaces the old admin report dashboard that previously lived at this filename.

### 2. Move the admin dashboard to its own file
The admin route at line 536 still expects a `TrustSafety` component. To keep that working without leaving the admin dashboard code orphaned, rename the existing admin dashboard component to a new file:
- Create `src/pages/admin/AdminTrustSafety.tsx` containing the current admin report-review logic (verbatim from today's `TrustSafety.tsx`, just renamed export).
- Update `AppRoutes.tsx` line 536 to import and use `AdminTrustSafety` instead of `TrustSafety`.

This preserves the admin functionality while letting the public `/trust-safety` route serve the new editorial page.

### 3. Update `src/routes/AppRoutes.tsx`
- Line 142: remove `TrustSafetyPage` lazy import (no longer used).
- Line 204: keep `<Route path="/trust-safety" element={<TrustSafety />} />` — `TrustSafety` is now the public page, so no element change needed.
- Line 536: change to `<Route path="/admin/trust-safety" element={<AdminGuard><AdminTrustSafety /></AdminGuard>} />` and add lazy import for `AdminTrustSafety`.

### 4. Delete `src/pages/TrustSafetyPage.tsx`
No longer referenced after the import is removed.

### 5. Community Guidelines
Wait for the user to paste/upload the new `CommunityGuidelines.tsx` code, then do a full replacement in a follow-up step.

### Notes
- No backend, schema, or business-logic changes.
- Admin `/admin/trust-safety` continues to work via the renamed `AdminTrustSafety` component.
- The user's instruction said "leave admin pointing to `TrustSafety`" — but since `TrustSafety.tsx` is being fully replaced with the public page, the admin dashboard must be relocated or it would be deleted. Renaming to `AdminTrustSafety` is the minimal safe move.
