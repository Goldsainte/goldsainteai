

## Fix: Remove Redundant "Back to Dashboard" from Earnings Tab

The `PartnerEarningsView` component renders as a full standalone page with its own `<main>`, back button, and header — but when used inside the Creator Dashboard's Earnings tab, it's already nested within the dashboard layout. This creates a redundant "Back to Dashboard" link and duplicated header elements mid-page.

### Solution

**Refactor `CreatorEarningsTab.tsx`** to render the earnings content inline (summary cards + booking payouts) directly, instead of embedding the full `PartnerEarningsView` standalone page wrapper.

**Changes:**

1. **`src/pages/creator/components/CreatorEarningsTab.tsx`** — Rewrite to call `getPartnerBookingEarnings("creator")` directly and render the summary cards + booking list inline, without the `<main>`, `BackButton`, or redundant header. Reuse the same `formatMoney` helper and `SummaryCard` pattern but strip the page-level wrapper.

2. **`src/components/earnings/PartnerEarningsView.tsx`** — No changes needed (it's still used as a standalone page for agents or direct navigation).

The earnings tab content will just show the three summary cards, the booking payouts list, and the footnote — matching the dashboard's existing tab content pattern without any standalone page chrome.

