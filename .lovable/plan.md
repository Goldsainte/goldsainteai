

# Messaging System Audit & Fix Plan

## Current State Assessment

### What's working
- **Database schema**: `dm_conversations`, `direct_messages`, and `message_settings` tables exist with proper foreign keys
- **RLS policies**: All three tables have correct SELECT/INSERT/UPDATE policies scoped to participants
- **Edge functions**: `get-conversations`, `send-direct-message`, and `manage-conversation` are fully implemented with auth verification, content filtering, blocking, and notification creation
- **Frontend**: `DirectMessageInbox`, `RecipientSearchModal`, `NewMessageModal`, realtime subscriptions, and unread count tracking are all wired up
- **Recipient search**: Queries `profiles` table by `display_name`, shows `account_type` labels (Traveler, Creator, Travel Agent)

### Root problem
The messaging system is **fully wired and functional**. The reason you see no users in the inbox is:
1. **Zero conversations exist** in `dm_conversations` (confirmed: count = 0)
2. **Most profiles have NULL `display_name`** — the recipient search requires `display_name` to be set (via `ilike`), so most users are invisible in search
3. There are no test agent accounts — only traveler, creator, and brand accounts exist

### Profile data gaps
| User | account_type | display_name | full_name |
|------|-------------|-------------|-----------|
| 12412527... | traveler | NULL | (empty) |
| 3c9c947b... | traveler | NULL | Traveller 01 |
| bd8a00c9... | creator | NULL | Radu D |
| bd421884... | creator | asdfad | Jimmy johns |
| 1cf40a00... | NULL | NULL | NULL |

Only 1 user has a `display_name` set, so only 1 user would appear in recipient search.

## Plan

### 1. Fix existing profiles — populate `display_name` from `full_name`
Use a data update (not migration) to set `display_name = full_name` for all profiles where `display_name` is NULL but `full_name` is not empty. This immediately makes existing users discoverable in recipient search.

### 2. Fix the `handle_new_user()` trigger to auto-set `display_name`
Add a migration to update the trigger so new signups automatically get `display_name` populated from `full_name` (or first_name + last_name). This prevents future profiles from being invisible.

### 3. Fix RecipientSearchModal to also search `full_name`
Currently it only searches `display_name`. Update the query to also match against `full_name` so users without `display_name` are still findable.

### 4. No test account creation needed
Creating auth users programmatically requires admin API access that should not be done through code changes. The existing real accounts will become visible once `display_name` is populated. You can test messaging between your existing accounts (traveler and creator profiles already exist).

### Technical Details

**Data update** (via insert tool):
```sql
UPDATE profiles SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL AND full_name != '';
```

**Migration** — update `handle_new_user()` trigger to include:
```sql
display_name = COALESCE(
  NEW.raw_user_meta_data->>'display_name',
  NEW.raw_user_meta_data->>'full_name',
  ''
)
```

**Code change** in `RecipientSearchModal.tsx`:
- Change `.ilike("display_name", ...)` to `.or(`display_name.ilike.%${search}%,full_name.ilike.%${search}%`)` so both fields are searched

