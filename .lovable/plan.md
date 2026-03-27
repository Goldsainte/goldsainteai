

## Structured 4-Tier Services System for Creator Storefronts

### What Changes

Replace the current generic `creator_services` table and flat card UI with a structured 4-tier service system where each tier has specific fields, deliverables, and UI treatment.

---

### 1. Database: Add `service_tier` column + tier-specific fields

Migrate the existing `creator_services` table to support tiers:

- Add `service_tier` enum column: `digital_guide`, `custom_itinerary`, `full_trip_design`, `add_on`
- Add new columns: `trip_days` (int), `has_priority_support` (bool), `duration_minutes` (int for add-ons), `revisions` already exists
- Add `file_url` (text) for digital guide file/link uploads
- Add `delivery_time_option` (text) for standardized dropdown values ("2 days", "3 days", "5 days", "7 days")
- Keep existing columns: title, description, starting_price_cents, currency, delivery_days, includes, cover_image_url, is_active, sort_order

No new table needed — extend the current one with the tier column and tier-specific nullable fields.

---

### 2. Service Card UI — Tier-Aware Display

Rebuild `CreatorServicesSection.tsx` to:

- Group services by tier with tier labels and color-coded badges (green/yellow/blue/purple matching the spec)
- Each tier section shows its cards in a horizontal scroll row
- Card content adapts per tier:
  - **Digital Guide** (green badge): Price, description, inclusions, "Download" or "Purchase" CTA
  - **Custom Itinerary** (yellow badge): Price, delivery time, days covered, revisions, inclusions, "Request This" CTA
  - **Full Trip Design** (blue badge): Price, delivery time, trip length, priority support indicator, inclusions, "Request This" CTA
  - **Add-On** (purple badge): Name, price, duration, description, "Add" CTA
- Luxury styling preserved: white cards, `border-[#E5DFC6]`, serif titles, gold accents

---

### 3. Creator Service Management — Add/Edit Dialog

Build an inline dialog for creators to add/edit services from their profile (when `isOwnProfile`):

- Step 1: Select tier (4 visual tier cards with icons and descriptions)
- Step 2: Tier-specific form fields (only show relevant fields per tier)
- "Includes" field: dynamic bullet-point list (add/remove items)
- Keep it lightweight — no multi-page wizard, just a clean modal form
- Edit and delete via dropdown on existing service cards

---

### 4. Profile Page Integration

- Keep the current page structure (Hero → Storyboards → Services → Reviews → About)
- Update the Services section to render tiered groups instead of a flat row
- Empty state for owners: show the 4 tier options as dashed cards to guide first-time setup
- Non-owners see only active services grouped by tier

---

### 5. Microcopy Updates

- "Packages" → "Services" everywhere
- Card CTAs: "Request This" for itinerary/trip design tiers, "Purchase" for digital guides, "Add" for add-ons
- No "Book Now" language

---

### Technical Summary

| Action | File |
|--------|------|
| Migration | Add `service_tier`, `trip_days`, `has_priority_support`, `duration_minutes`, `file_url`, `delivery_time_option` to `creator_services` |
| Rewrite | `src/components/creator/CreatorServicesSection.tsx` — tier-grouped display + management |
| Create | `src/components/creator/AddServiceDialog.tsx` — tier-aware add/edit modal |
| Edit | `src/pages/creators/CreatorPublicProfilePage.tsx` — minor wiring updates |

