

# Functional & On-Brand Marketplace Search Bar

## Summary
Rewrite `MarketplaceSearch.tsx` to be fully functional, on-brand, and wire all filters end-to-end through `Marketplace.tsx` queries. Add a date range picker, traveler stepper, active filter chips, and proper filtering logic for both tabs.

## Changes

### 1. Wire search filters into database queries (`src/pages/Marketplace.tsx`)

**Curated Trips query** — add filters to the `queryKey` and query builder:
- `destination`: `.ilike("destination", `%${destination}%`)`
- `startDate` (available_from): `.gte("available_until", startDate)` (trip must still be available)
- `endDate` (available_until): `.lte("available_from", endDate)` (trip must start before checkout)
- `travelers`: `.gte("max_participants", travelers)` (enough capacity)
- Persist all filters to URL search params (destination, startDate, endDate, travelers) and restore on load
- Initialize state from URL params for all fields

**Trip Requests query** — add similar client-side or server-side filtering:
- `destination`: `.ilike("destination", `%${destination}%`)`  
- `startDate`/`endDate`: filter overlap with `start_date`/`end_date`
- `travelers`: compare against `travelers_adults + travelers_children`

**Empty state** — update to show "No trips match your filters" with a "Clear filters" reset button when filters are active but no results found.

### 2. Redesign `MarketplaceSearch.tsx` — on-brand luxury styling

Replace the current search bar with a refined single-card design:
- **Container**: `rounded-2xl border border-[#E5DFC6] bg-white shadow-sm` with softer padding
- **Where field**: MapPin icon, placeholder "Where are you going?"
- **Dates field**: Replace two native date inputs with the existing `MobileDatePicker` component (mode="range") — one interaction for check-in/check-out, renders as a popover on desktop and drawer on mobile
- **Travelers field**: Replace number input with a +/– stepper (`Minus` / `Plus` icons from lucide, min 1, max 20)
- **Search button**: Gold circle `bg-[#BFAD72] hover:bg-[#9d8f5d]` with white Search icon
- **Mobile**: Collapsible pill stays but inputs get the same upgrades (date range picker, stepper)
- Typography: labels in `text-[#8D8D8D] text-xs uppercase tracking-wider`, values in `text-[#0a2225] text-sm`

### 3. Add active filter chips below search bar

After search is performed, show removable chips below the bar:
- Chips for: destination, date range ("Mar 10–15"), travelers count
- Each chip has an × to remove that specific filter
- "Clear all" link when any filters are active
- Styled as `rounded-full border border-[#E5DFC6] bg-[#FBF9F0] px-3 py-1 text-xs text-[#0a2225]`

### 4. Date validation
- Check-out must be after check-in (enforced via `disabled` prop on calendar)
- If user clears check-in, also clear check-out

### 5. Update EmptyState for filtered results
- Add a new variant or prop `hasFilters` to EmptyState
- When filters are active: "No trips match your filters" + "Clear filters" button instead of "Post your dream trip"

### Files modified
- `src/components/marketplace/MarketplaceSearch.tsx` — full rewrite with date range picker, stepper, chips, on-brand styling
- `src/pages/Marketplace.tsx` — wire all filters into both queries, persist all to URL params, pass reset handler

