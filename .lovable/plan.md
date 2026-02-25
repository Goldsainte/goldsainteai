

# Send Email Notification on "Request to Book"

## Problem
When a traveler clicks "Request to Book" on a platform trip, the system inserts a row into `booking_interests` and shows a toast — but no email is sent to the Goldsainte team (concierge/admin), so the team never knows someone wants to book.

## Solution
Create a new edge function `notify-booking-interest` that sends an email via Resend to the concierge/admin team whenever a booking interest is created. Then call it from `TripBookingSidebar` after the successful insert.

## Implementation

### 1. New Edge Function: `supabase/functions/notify-booking-interest/index.ts`
- Accepts `{ bookingInterestId, userId, tripId }`
- Uses service role key to fetch:
  - Traveler profile (name, email) from `profiles`
  - Trip details (title, destination, price) from `packaged_trips`
- Sends a branded Goldsainte email via Resend to `concierge@goldsainte.com` (configurable via `CONCIERGE_EMAIL` secret) containing:
  - Traveler name and email
  - Trip name and destination
  - Timestamp of interest
  - Link to view the booking interest in admin
- Also creates an in-app notification for admin users
- Uses the same Goldsainte email template style as the proposal-received email (cream/gold/dark teal palette)

### 2. Update `src/components/trips/TripBookingSidebar.tsx`
- After successful `booking_interests` insert (line 70), invoke the new edge function:
  ```typescript
  supabase.functions.invoke("notify-booking-interest", {
    body: { bookingInterestId: data.id, userId: user.id, tripId }
  });
  ```
- Fire-and-forget (don't block the user flow on email delivery)

### 3. Config: `supabase/config.toml`
- Add `[functions.notify-booking-interest]` with `verify_jwt = false`

### 4. Secret needed
- `CONCIERGE_EMAIL` — the email address that should receive booking interest notifications (e.g. `concierge@goldsainte.com`). Falls back to fetching admin users from `admin_users` table if not set.

## Files
- **New**: `supabase/functions/notify-booking-interest/index.ts`
- **Edit**: `src/components/trips/TripBookingSidebar.tsx` (add function invoke after insert)

