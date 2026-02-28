

## Fix: Update the actual mobile bottom nav in Header.tsx

The labels didn't change because the mobile bottom nav the user sees is **not** `MobileBottomNav.tsx` — it's an inline nav rendered directly inside `src/components/Header.tsx` (lines 629-687). That's the one currently showing "Collections".

### Changes in `src/components/Header.tsx`

**Lines 643-650** — Replace the "Collections" button:
- Label: `"Collections"` → `"Post a Trip"`
- Route: `/collections` → `/post-trip`
- Icon: `Sparkles` → `PlaneTakeoff`
- Remove auth gate (no need to check `user` for this route)

**Additionally**, update the Storyboards button icon (line 657) from `Plane` to `Sparkles` to match the intended icon set, and ensure `PlaneTakeoff` is imported.

