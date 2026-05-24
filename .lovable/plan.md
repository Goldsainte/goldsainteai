## Root cause

`agent_applications` has a unique constraint on `email`. One orphan row already exists for `info@cornellfacilities.com` (id `75e7e1fe…`, `user_id = NULL`, status `pending_verification`, created 2026-05-17 — predates the auth wiring). On resubmit, the form mints a new `clientId`, the upsert runs as an INSERT, the `id` doesn't collide but the `email` does, and `onConflict: 'id'` can't resolve a conflict on a column it isn't targeting.

## Fix

### 1. Claim the orphan row (one-time data fix)

Set `user_id` on the existing row to the authenticated user's id, so future logic finds it by `user_id`. Done via `supabase--insert` UPDATE against id `75e7e1fe-adbc-4934-b056-c23e9b649b77`. (We'll fetch the auth user's id for `info@cornellfacilities.com` first.)

### 2. Add a partial unique index on `user_id`

Migration: `CREATE UNIQUE INDEX agent_applications_user_id_unique ON agent_applications (user_id) WHERE user_id IS NOT NULL;`

This makes "one agent = one application row" a real DB-level guarantee and lets us use `onConflict: 'user_id'` safely.

### 3. Rewrite `saveDraftApplication` lookup-then-upsert (src/pages/AgentApplicationForm.tsx, ~line 460)

Before the upsert:
- Query `agent_applications` for a row matching `user_id = authUser.id` → if found, reuse its `id`.
- Otherwise query by `email = formData.email` (case-insensitive) → if found (orphan from pre-auth attempt), reuse its `id` AND set `user_id = authUser.id` in the upsert payload so it's claimed.
- Otherwise mint a new `clientId`.

Keep `.upsert({...}, { onConflict: 'id' })` since we now always pass the correct existing id. This is robust regardless of whether the partial unique index exists, and resubmissions cleanly UPDATE the agent's single row.

### 4. Verify

- Test resubmit with `info@cornellfacilities.com`: should UPDATE the existing row (not insert), no unique-constraint error, advance to Stripe Identity (step 6).
- Confirm the row's `user_id` is now populated and status remains `pending_verification`.

## Files

- `supabase/migrations/<new>.sql` — partial unique index on `user_id`
- `src/pages/AgentApplicationForm.tsx` — lookup-then-upsert in `saveDraftApplication`
- Data fix: UPDATE the orphan row's `user_id` via insert tool
