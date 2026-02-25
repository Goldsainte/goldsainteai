

# Rename Marketplace Tabs to "Curated Trips" / "Custom Requests"

## Changes

### File: `src/components/marketplace/MarketplaceTabs.tsx`
- Change the first tab's `label` from `"Ready to Book"` to `"Curated Trips"` and `shortLabel` from `"Book"` to `"Curated"`
- Update its `description` to something like: `"Pre-packaged trips from verified creators & agents, ready to book instantly"`
- Change the second tab's `label` from `"Trip Requests"` to `"Custom Requests"` and `shortLabel` from `"Requests"` to `"Custom"`
- Update its `description` to: `"Travelers looking for a custom quote — submit a proposal to plan their dream trip"`

### File: `src/pages/Marketplace.tsx`
- No structural changes needed — the tab `id` values (`"trips"` / `"trip-requests"`) stay the same, only the display labels change in `MarketplaceTabs.tsx`

Single file edit, label-only change.

