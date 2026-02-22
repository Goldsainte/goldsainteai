
# Fix "Host Information Missing" for Platform-Curated Trips

## Root Cause

All 6 featured trips in the "Curated Journeys" section have `creator_id = NULL`, `agent_id = NULL`, and `creator_type = 'platform'`. These are platform-curated trips with no host assigned. When you click "Request to Book" or "Ask a Question," the `TripBookingSidebar` checks for a `partnerId` (derived from `agentId || creatorId`) and finds nothing, so it shows the error.

## The Fix

### 1. Create a platform host profile

Create a dedicated Goldsainte platform profile in the `profiles` table to act as the "host" for platform-curated trips. This profile handles booking requests and inquiries for any trip not tied to a specific creator or agent.

### 2. Update the featured trips

Set `creator_id` on all platform-curated trips to point to the Goldsainte platform profile, so the booking and messaging flows have a valid partner to route to.

### 3. Update TripBookingSidebar to handle platform trips gracefully

In `TripBookingSidebar`, add a fallback: if `creatorType` is `'platform'` and no `creatorId`/`agentId` is provided, show "Goldsainte Concierge" as the host name and route booking requests to the platform profile.

### 4. Update TrovaTripDetailPage to pass creator_type

Add `creator_type` to the `TripData` interface (it's already fetched via `SELECT *` but cast with `as any`). This ensures the sidebar gets the correct type without unsafe casts.

## Technical Details

### Database: Create platform profile

A database migration will insert a platform profile into the `profiles` table with a known ID and `account_type = 'admin'`. Then update all `packaged_trips` where `creator_id IS NULL` to point to this profile.

### File: `src/pages/marketplace/TrovaTripDetailPage.tsx`

- Add `creator_type?: string | null` to the `TripData` interface
- Replace `(trip as any).creator_type` with `trip.creator_type`
- Replace `(trip as any).agent_id` with `trip.agent_id` (also add to interface)

### File: `src/components/trips/TripBookingSidebar.tsx`

- When `creatorType === 'platform'` and no `creatorId`/`agentId`, use the platform profile ID as fallback `partnerId`
- Display "Goldsainte Concierge" as the host name in the "How it works" section
- Adjust the "Request to Book" flow to route platform bookings appropriately

### Alternative approach (simpler, no new profile needed)

Instead of creating a platform profile, we could:
- Skip the database insert entirely
- When `creatorType === 'platform'`, change "Request to Book" to link to a contact/inquiry form or the AI Concierge
- Change "Ask a Question" to open a general support conversation

This avoids fake host profiles but changes the user flow for platform trips. The booking would go through a different path than creator/agent trips.

Both approaches work. The first is more consistent (all trips behave the same). The second is lighter but requires different UI behavior for platform trips.
