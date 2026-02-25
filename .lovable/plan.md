

# Add "Departing From" Field to Post a Trip Form

## Problem
The trip request detail page shows a "Departing from" field (reading from `departure_city` column which already exists in the database), but the Post a Trip form has no input for it — so it always shows "Not specified."

## Changes

### 1. `src/pages/trips/PostTripPage.tsx`
- **Add state**: `const [departureCity, setDepartureCity] = useState("")`
- **Step 1 UI** (after the Destination input, before the date grid): Add a "Departing from" text input with placeholder like "New York, London, Los Angeles..."
- **Session save/restore**: Include `departureCity` in the `goldsainte:pendingTrip` JSON and restore it on load
- **Insert query**: Add `departure_city: departureCity || null` to the `.insert()` call
- **Review step (Step 6)**: Add a `<SummaryRow label="Departing from" value={departureCity} />` after the Destination row

No database migration needed — the `departure_city` column already exists on `trip_requests`.

