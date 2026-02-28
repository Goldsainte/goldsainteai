

## Fix: "Could not withdraw proposal" Error

### Root Cause
The `withdrawProposal` function tries to update a column called `withdrawn_at` on the `trip_proposals` table, but **that column does not exist** in the database. This causes Supabase to return an error on every withdraw attempt.

### Plan

**1. Add missing column via database migration**
- Add `withdrawn_at TIMESTAMPTZ` to `trip_proposals` (nullable, no default)

**2. Also add other missing timestamp columns referenced in `proposalService.ts`**
- Check if `accepted_at` and `declined_at` also exist — if not, add them in the same migration to prevent similar bugs in accept/decline flows

**3. No code changes needed** — the service functions are already correctly written, they just need the columns to exist

