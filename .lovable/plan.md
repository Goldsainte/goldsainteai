

# Wire Up Trip Detail Page: Request to Book, Ask a Question, and How It Works

## The Problems

1. **"Request to Book" goes nowhere** -- `TripBookingSidebar` navigates to `/marketplace/trip/:id/book` which doesn't exist as a route
2. **"Ask a Question" goes nowhere useful** -- navigates to `/messages?tripId=...` but doesn't create a conversation with the trip's creator/agent
3. **"How it Works" steps are decorative** -- they describe a flow (share details, get matched, book securely) that isn't actually wired
4. **The `TrovaTripDetailPage` doesn't pass creator/agent context to the sidebar** -- so even if the buttons worked, the sidebar doesn't know who to contact

## The Fix

### 1. Pass creator/agent data into `TripBookingSidebar`

**File: `src/components/trips/TripBookingSidebar.tsx`**
- Add new props: `creatorId`, `creatorType` (creator or agent), `agentId` (optional)
- These identify who the trip belongs to so the buttons can act on it

**File: `src/pages/marketplace/TrovaTripDetailPage.tsx`**
- Pass the trip's `creator_id`, `creator_type`, and `agent_id` down to `TripBookingSidebar`

### 2. Wire "Request to Book" to create a real booking inquiry

Instead of navigating to a non-existent `/book` route, the button will:
- Check if the user is logged in (redirect to `/auth` if not)
- Insert a row into `trip_bookings` with the trip ID, traveler ID, and the trip's creator/agent as partner
- Show a success toast: "Booking request sent! Your host will be in touch."
- Navigate to `/messages` so the user can follow up

### 3. Wire "Ask a Question" to open a real conversation

Instead of navigating to a dead-end, the button will:
- Check if the user is logged in (redirect to `/auth` if not)
- Look for an existing `user_conversations` row between the user and the trip's agent
- If none exists, create one with an initial message referencing the trip
- Navigate to `/messages?conversation=:id`
- If the trip only has a `creator_id` (no agent), fall back to creating a conversation context or show a "Contact host" toast with guidance

### 4. Update "How It Works" to reflect real actions

Replace the generic steps with trip-specific wording:
1. "Select your dates and guests" (they can do this above)
2. "Request to book with {hostName}" (links to the actual host)
3. "Pay securely through Goldsainte" (escrow messaging)

## Technical Details

### File: `src/components/trips/TripBookingSidebar.tsx`

**Props changes:**
```
+ creatorId?: string;
+ creatorType?: string;
+ agentId?: string;
```

**`handleRequestToBook`:**
- Import `useAuth` from `@/contexts/AuthContext`
- Import `supabase` client
- If not logged in, navigate to `/auth`
- Insert into `trip_bookings`:
  - `trip_request_id`: null (this is a direct booking, not from a request)
  - `traveler_id`: user.id
  - `partner_id`: creatorId or agentId
  - `partner_role`: creatorType
  - `total_price`: pricePerPerson (placeholder, host confirms later)
  - `currency`: currency
  - `status`: 'pending'
- Toast success, navigate to `/messages`

**`handleAskQuestion`:**
- If not logged in, navigate to `/auth`
- Query `user_conversations` for existing conversation between user and the agent/creator
- If found, navigate to it
- If not found, create a new conversation and navigate to it
- If no agent_id available, show a toast explaining the host will be contacted

### File: `src/pages/marketplace/TrovaTripDetailPage.tsx`

**Changes to the `TripBookingSidebar` call (around line 263):**
```tsx
<TripBookingSidebar
  tripId={trip.id}
  pricePerPerson={trip.original_price || trip.price_per_person || 0}
  currency={trip.currency || "USD"}
  spotsAvailable={spotsAvailable || undefined}
  hostName={trip.creator?.full_name || undefined}
  creatorId={trip.creator_id || undefined}
  creatorType={(trip as any).creator_type || "creator"}
  agentId={(trip as any).agent_id || undefined}
/>
```

Also update the TripData interface to include `creator_type` and `agent_id` fields, and add them to the select query.

### No database changes needed
- `trip_bookings` table already exists with the right schema
- `user_conversations` table already exists
- Both have appropriate columns for this flow
