

## Fix: Populate email in profiles for messaging search

The recipient search correctly queries `profiles.email`, but that column is empty for users because the `handle_new_user()` trigger never copies the email from `auth.users` into `profiles`.

### Changes needed:

1. **Database migration** — Backfill existing users' emails from `auth.users` into `profiles.email`:
```sql
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
```

2. **Update `handle_new_user()` trigger** — Add `NEW.email` to the insert so future signups automatically have their email in profiles:
```sql
email = COALESCE(NEW.email, '')
```
Add to the INSERT columns and VALUES, and add an `ON CONFLICT DO UPDATE` clause to also set email if missing.

3. **No frontend changes needed** — The search filter `email.ilike.%${search}%` already exists in `RecipientSearchModal.tsx` from the previous change.

### Privacy note
The `profiles` table already has an `email` column and existing RLS policies. Storing email there enables search but the column is only used server-side in the ilike filter — the email is not returned in the `.select()` call and won't be displayed in the UI.

