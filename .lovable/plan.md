

## Add Delete Trip Request for Admins and Owners

### Problem
There is no way for admins or the traveler who posted a trip to delete it. The RLS policy allows travelers to manage their own rows (`ALL` policy), but there's no admin delete policy. The UI has no delete button anywhere.

### Database Changes

**1. Add RLS policy for admin DELETE on `trip_requests`**
```sql
CREATE POLICY "Admins can delete any trip request"
ON public.trip_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

**2. Handle foreign key constraints that block deletion**
- `messages` FK → NO ACTION (blocks delete). Change to CASCADE or SET NULL.
- `bookings` FK → NO ACTION (blocks delete). Change to CASCADE or SET NULL.
- `trip_proposals` and `trip_request_matches` already CASCADE — fine.
- `trip_bookings` already SET NULL — fine.

Migration:
```sql
ALTER TABLE public.messages DROP CONSTRAINT messages_trip_request_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_trip_request_id_fkey
  FOREIGN KEY (trip_request_id) REFERENCES public.trip_requests(id) ON DELETE CASCADE;

ALTER TABLE public.bookings DROP CONSTRAINT bookings_trip_request_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_trip_request_id_fkey
  FOREIGN KEY (trip_request_id) REFERENCES public.trip_requests(id) ON DELETE SET NULL;
```

### UI Changes

**3. Add delete button on trip detail page (`src/pages/trips/TripRequestDetailPage.tsx`)**
- Show a "Delete trip" button for the trip owner (`isTraveler`) and for admins
- Use `AlertDialog` for confirmation before deleting
- On confirm, call `supabase.from("trip_requests").delete().eq("id", trip.id)`
- Navigate back to `/my-trips` (traveler) or `/marketplace` (admin) after deletion

**4. Add admin role check to the detail page**
- Import `useUserRole` hook to detect admin status
- Show delete button when `isAdmin` or `isTraveler`

### Files
1. **Database migration** — RLS policy + FK constraint fixes
2. `src/pages/trips/TripRequestDetailPage.tsx` — add delete button with confirmation dialog

