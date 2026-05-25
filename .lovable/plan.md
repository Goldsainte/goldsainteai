## Goal

One-time seed of four pre-confirmed test users via the Supabase Admin API, then lock the script so it can't be re-run.

## ⚠️ Heads-up before we run it

The `profiles.account_type` CHECK constraint (latest migration `20251116070801`) only allows:
`personal | traveler | creator | agent | admin | business | partner`

**`brand` is NOT in that list** — inserting/updating to `'brand'` will fail with a constraint violation. Two options:

1. **Map `brand` → `business`** for the brand-test user (closest existing type, no schema change). Recommended for a pure seed task.
2. Add a migration that extends the CHECK to include `'brand'`. This is a schema change beyond "change nothing else."

I'll assume option 1 unless you say otherwise.

## Approach

Create a one-shot edge function `seed-test-users` (service-role, JWT-not-required only for our manual `curl`) that:

1. Uses `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { account_type } })` for each of the four users.
2. The `handle_new_user` trigger inserts a `profiles` row using `raw_user_meta_data->>'account_type'` (falls back to `'traveler'`).
3. After creation, `UPDATE profiles SET account_type = <intended>` for each user to guarantee correctness (covers the case where the trigger defaulted).
4. Returns the four email+password pairs in the response (one-time output only — I'll relay them to you in chat).
5. Self-locks: the function checks a `seed_locks` row (or simply checks if any of the four emails already exist in `auth.users`) and refuses to run a second time, returning 409.

After you confirm the users work, I'll **delete the edge function entirely** (`supabase/functions/seed-test-users/`) so it cannot be invoked again. The self-lock is belt-and-suspenders for the brief window it exists.

## Users to create

| Email | Password | account_type |
|---|---|---|
| traveler-test@goldsainte.com | (generated, 20-char random) | traveler |
| creator-test@goldsainte.com  | (generated, 20-char random) | creator  |
| agent-test@goldsainte.com    | (generated, 20-char random) | agent    |
| brand-test@goldsainte.com    | (generated, 20-char random) | business (mapped from brand) |

Passwords generated server-side and returned once in the response. If you'd rather I use a fixed known password (e.g. `GoldsainteTest!2026`) for all four to make manual testing easier, say the word.

## Technical details

- File added: `supabase/functions/seed-test-users/index.ts` (uses `SUPABASE_SERVICE_ROLE_KEY` env, already available).
- Invocation: I'll call it once via `supabase.functions.invoke('seed-test-users')` from the sandbox using the anon key + service role (function reads service role from env, not request).
- Idempotency: function lists existing users, aborts if any target email is already present.
- Cleanup step: after a successful run, I delete `supabase/functions/seed-test-users/` so the function is removed from deployment.
- No frontend changes. No migration. No changes to `handle_new_user` or RLS.

## Deliverables

1. The four `email + password` pairs posted in chat.
2. Confirmation that each `profiles.account_type` row matches the intended value (verified via a `SELECT`).
3. Confirmation that the seed function has been deleted.

## Confirm before I switch to build

- OK to map `brand` → `business`? (Or do you want a migration to add `'brand'`?)
- Random per-user passwords, or one shared known password?
