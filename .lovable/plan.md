

# Grant Admin Role to radu.diaconeasa@gmail.com

## Current State
- User exists with ID `12412527-8268-4fe6-8a71-0d5e007b06f7`
- No entries in `user_roles` table for this user

## Action
Insert a single row into `public.user_roles`:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('12412527-8268-4fe6-8a71-0d5e007b06f7', 'admin');
```

This uses the existing `user_roles` table and `app_role` enum. The `has_role()` security definer function, `AdminGuard`, `useRequireAdmin`, and `useUserRole` hooks will all recognize this account as admin immediately — no code changes needed.

