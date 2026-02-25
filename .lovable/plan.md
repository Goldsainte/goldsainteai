

# Part 3–6: Storyboard → Marketplace Conversion & Detail Page Enrichment

## Current State

The storyboard editor already has:
- All structured fields (destination, dates, budget, travelers, vibes, must-haves, dealbreakers)
- A "Submit to Marketplace" button that creates a `trip_requests` row and links the storyboard
- Status tracking (draft → submitted)
- Visual Brief gallery on the marketplace detail page via `TripStoryboardViewer`

**What's missing per the spec:**

| Requirement | Status |
|---|---|
| Marketplace detail page shows vibe tags, must-haves, dealbreakers, trip length | Missing — only basic fields displayed |
| Storyboard status shows "Live in Marketplace" | Missing — only "Submitted" badge |
| MVP validation (3+ visual pins required) | Missing |
| Lock storyboard after submission (prevent edits) | Missing |
| Marketplace detail page displays source_metadata fields | Missing — must-haves, dealbreakers, budget_per_person, trip_length_days stored in source_metadata but never read back |

## Plan

### 1. Storyboard Editor — MVP Validation & Lock

**`src/pages/TikTokLab/StoryboardEditorPage.tsx`**

- **MVP validation** in `submitToMarketplace`: require at least 3 visual pins (`itemCount >= 3`), destination, and either dates or trip length. Show specific toast errors for each missing requirement.
- **Lock after submission**: when `storyboard.status === "submitted"`, disable all trip detail fields, hide the "Submit to Marketplace" button, and show a "Live in Marketplace" badge (replacing "Submitted"). Add a link to view the marketplace listing (`/marketplace/request/${storyboard.trip_request_id}`).
- **Status label update**: change the badge from "Submitted" to "Live in Marketplace" with a green pulse dot.

### 2. Marketplace Detail Page — Display Rich Trip Data

**`src/pages/marketplace/TripRequestDetail.tsx`**

The detail page currently reads `trip_requests` but ignores `source_metadata` (where must-haves, dealbreakers, trip_length_days, budget_per_person are stored). Changes:

- **Fetch source_metadata** from the trip request query (already selected via `select("*")`).
- **Parse and display** in the right sidebar "Trip Details" card:
  - Trip length (days) — from `source_metadata.trip_length_days`
  - Budget scope — "per person" or "total trip" from `source_metadata.budget_per_person`
- **Add new sections** to the left column Trip Brief card (below description, above Visual Brief):
  - **Vibe Tags** — pill badges from `interests` column (already on `trip_requests`)
  - **Must-Haves** — emerald pill badges from `source_metadata.must_haves`
  - **Dealbreakers** — red pill badges from `source_metadata.dealbreakers`
- **Expand the `TripRequest` type** to include `interests`, `tripLengthDays`, `budgetPerPerson`, `mustHaves`, `dealbreakers`.
- **Map from raw data** in the `fetchData` function, parsing `source_metadata` JSON.

### 3. No Database Changes Required

All the data is already persisted:
- `interests` is a direct column on `trip_requests`
- `must_haves`, `dealbreakers`, `trip_length_days`, `budget_per_person` are stored in `source_metadata` JSON on `trip_requests`

No migration needed.

### Files to Edit

| File | Changes |
|---|---|
| `src/pages/TikTokLab/StoryboardEditorPage.tsx` | MVP validation (3+ pins), lock fields after submission, "Live in Marketplace" badge with link |
| `src/pages/marketplace/TripRequestDetail.tsx` | Parse source_metadata, display vibe tags, must-haves, dealbreakers, trip length, budget scope |

