

# Fix "Request to Book" -- Persist Booking Interest + Require Auth

## What's Happening Now

When a traveler clicks "Request to Book" on a platform trip (which is most marketplace trips right now), the code:
1. Checks for auth (already redirects to login if not signed in -- good)
2. Shows a toast: "Your booking interest has been noted!"
3. Navigates to /messages
4. **Saves nothing to the database** -- the interest vanishes

The existing `trip_bookings` table requires a `partner_id` (the host), which platform trips don't have, so it can't be used here.

## The Fix

### 1. Create a `booking_interests` table

A lightweight table to capture every "Request to Book" click:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (NOT NULL) | The traveler |
| trip_id | text (NOT NULL) | The packaged trip ID |
| status | text | Default `'pending'` |
| notes | text | Optional (future use) |
| created_at | timestamptz | Auto-set |

RLS policies:
- Authenticated users can insert their own records (`user_id = auth.uid()`)
- Authenticated users can read their own records

### 2. Update `TripBookingSidebar.tsx`

Replace the platform-trip toast-only path with an actual database insert:

- Insert a record into `booking_interests` before showing the success toast
- Keep the same user-facing message and navigation to `/messages`
- Add error handling if the insert fails

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `booking_interests` table + RLS |
| `src/components/trips/TripBookingSidebar.tsx` | Insert into `booking_interests` for platform trips before showing toast |

