

## Add Admin Account Management (Delete/Suspend Creators & Agents)

### Current State
- **AdminCreatorsPage**: Read-only performance table. No actions.
- **AdminAgentsPage**: Only has approve/reject verification buttons. No delete/suspend.
- **Database**: `moderation_actions` table and `profiles.account_status` column already exist but are unused in admin UI.

### Plan

#### A. Create Shared `AdminAccountActions` Component
**New: `src/components/admin/AdminAccountActions.tsx`**
- Dropdown menu with actions: **Suspend**, **Ban**, **Delete Account**
- Suspend/Ban: Updates `profiles.account_status` and inserts a row into `moderation_actions`
- Delete: Calls a backend function to cascade-delete the user (profile, posts, bookings, etc.)
- Each action requires a confirmation dialog with reason input

#### B. Create Backend Function for Account Deletion
**New edge function: `supabase/functions/admin-delete-account/index.ts`**
- Validates caller is admin (via `user_roles` table)
- Deletes the user's profile (cascading to related data)
- Deletes the auth user via `supabase.auth.admin.deleteUser()`
- Logs the action to `application_audit_log`

#### C. Update AdminCreatorsPage
**`src/pages/admin/AdminCreatorsPage.tsx`**
- Add an "Actions" column to the table
- Render `AdminAccountActions` for each creator row

#### D. Update AdminAgentsPage
**`src/pages/admin/AdminAgentsPage.tsx`**
- Add `AdminAccountActions` next to the existing approve/reject buttons

#### E. Database Migration
- Add RLS policy on `moderation_actions` allowing admin inserts
- Ensure `profiles.account_status` updates are allowed for admins

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/admin/AdminAccountActions.tsx` | **New** — suspend/ban/delete dropdown |
| `supabase/functions/admin-delete-account/index.ts` | **New** — secure account deletion |
| `src/pages/admin/AdminCreatorsPage.tsx` | Add Actions column with account management |
| `src/pages/admin/AdminAgentsPage.tsx` | Add account management actions |
| Migration SQL | RLS for moderation_actions admin access |

