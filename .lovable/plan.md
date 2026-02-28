

## Fix Global Layout Spacing: Footer Placement + Consistent Page Padding

### Root cause

`src/App.css` contains `#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }` which conflicts with the full-viewport flex layout defined in `index.css`. This constrains the root element and adds 2rem of padding around the entire app, breaking the footer-push-down behavior.

### Changes

#### 1. Clean up App.css (remove conflicting #root styles)

**File:** `src/App.css`

Remove or zero out the `#root` block — specifically `max-width: 1280px`, `margin: 0 auto`, and `padding: 2rem`. These override the flex layout in `index.css` that correctly handles footer placement. The rest of App.css (logo animations, card styles) can stay since they're unused but harmless.

#### 2. Ensure footer has `margin-top: auto`

**File:** `src/components/Footer.tsx`

Add `mt-auto` to the `<footer>` element so it's explicitly pushed to the bottom of the flex column on short pages.

#### 3. Standardize page-level top padding

Multiple pages use different top padding values. Normalize to a consistent system:

- **Standard inner page** (has BackButton + heading): `pt-8 md:pt-10` — enough breathing room below header without excess whitespace
- **Landing/hero pages**: keep their own hero spacing

Pages to update:
- `src/pages/NotificationsPage.tsx` — change `pt-14 md:pt-16` → `pt-8 md:pt-10` (too much top space currently)
- Spot-check other pages like `MyTripRequestsPage`, `PartnerBookingsPage`, `TripRequestDetailPage` which use `py-10 md:py-12` — these are fine as they include top+bottom together

#### 4. Remove nested `<main>` tags from pages

Pages like NotificationsPage render `<main>` inside App.tsx's `<main>`. Change page-level `<main>` to `<div>` to avoid nested landmarks and ensure the flex chain works cleanly. Apply to NotificationsPage and any other pages using `<main className="flex-1">`.

### Files to change
1. `src/App.css` — remove conflicting `#root` styles
2. `src/components/Footer.tsx` — add `mt-auto`
3. `src/pages/NotificationsPage.tsx` — fix padding + change `<main>` to `<div>`
4. `src/pages/PartnerBookingsPage.tsx` — change `<main>` to `<div>`
5. `src/pages/MyTripRequestsPage.tsx` — change `<main>` to `<div>`
6. `src/pages/TripRequestDetailPage.tsx` — change `<main>` to `<div>`
7. `src/pages/trips/PostTripPage.tsx` — change `<main>` to `<div>`

