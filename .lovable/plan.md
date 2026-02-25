

# Marketplace Trip Request Cards — Clarity for Agents & Creators

## Problem

The "Custom Requests" grid cards look like product listings rather than traveler briefs seeking proposals. An agent or creator can't tell at a glance: who posted this, what kind of trip they want, how competitive it is, or that they should respond.

## Changes

### 1. `TripRequestGrid.tsx` — Enriched Cards

**Add to each card:**
- **Traveler avatar + name** (or "A Goldsainte Traveler" fallback) at the top of the card — immediately signals "a person posted this"
- **"Seeking proposals" label** — small badge below the image so it's unambiguous this is a request, not a listing
- **Vibe/interest tags** — show up to 3 pill tags from `interests` array (e.g. "Romantic", "Wellness") so agents can pre-qualify fit
- **Travelers count** — "2 travelers" line next to destination
- **Trip length** if available — "7 days" alongside the date
- **Relative time** — "Posted 2h ago" instead of absolute date (using `date-fns` `formatDistanceToNow`)
- **Proposal count badge** — "3 proposals" in a small pill, giving urgency signal

**Data requirements:** The parent `Marketplace.tsx` query for `trip_requests` needs to join `profiles` (for traveler name/avatar) and get a count of `trip_proposals`. Update the query to:
```sql
select *, profiles!trip_requests_user_id_fkey(full_name, avatar_url), trip_proposals(count)
```

Update the `TripRequest` interface in the grid to include: `travelers_adults`, `travelers_children`, `interests`, `profiles`, `proposal_count`.

### 2. `TripRequestGrid.tsx` — Card Layout Redesign

Current layout: image → title + budget → destination → date

New layout:
```text
┌─────────────────────────────┐
│  [4:3 destination image]    │
│  ┌─────────────────────┐    │
│  │ Seeking proposals    │    │  ← overlay badge, bottom-left
│  └─────────────────────┘    │
├─────────────────────────────┤
│ 🧑 Jane D. · 2 travelers   │  ← avatar + name + travelers
│ Trip to Amalfi Coast        │  ← title
│ 📍 Italy · 7 days           │  ← destination + trip length
│ Romantic · Wellness · Food  │  ← up to 3 vibe tags as pills
│ $5,000–$8,000 · 3 proposals │  ← budget + proposal count
│ Posted 2h ago               │  ← relative time
└─────────────────────────────┘
```

### 3. `Marketplace.tsx` — Update Query

Expand the `trip-requests-unified` query to fetch:
- `profiles(full_name, avatar_url)` via the user_id FK
- `trip_proposals(count)` for proposal count
- `interests`, `travelers_adults`, `travelers_children`, `source_metadata` for trip length

Map the enriched data into the `TripRequestGrid` props.

### 4. `MarketplaceTabs.tsx` — Rename for Clarity

Change "Custom Requests" → **"Traveler Briefs"** (or "Open Briefs") and update the tooltip description to: *"Real travelers looking for a custom trip — review their brief and submit your proposal"*

This small rename removes the ambiguity of whose "request" it is.

### 5. `EmptyState.tsx` — Update Trip Requests Copy

Change the empty state for `trip-requests`:
- Title: "No traveler briefs yet"
- Description: "When travelers post trip requests, they'll appear here for you to review and propose on."

## Files to Edit

| File | Changes |
|---|---|
| `src/components/marketplace/TripRequestGrid.tsx` | Enriched card layout with avatar, vibe tags, proposal count, relative time, "Seeking proposals" badge |
| `src/pages/Marketplace.tsx` | Expand trip_requests query to join profiles + count proposals, pass enriched data |
| `src/components/marketplace/MarketplaceTabs.tsx` | Rename "Custom Requests" → "Traveler Briefs" |
| `src/components/marketplace/EmptyState.tsx` | Update trip-requests empty state copy |

No database changes needed — all data already exists.

