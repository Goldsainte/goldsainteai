

## Add Permanent Delete for Archived Conversations

### Problem
The UI sends a `"delete"` action to the `manage-conversation` edge function, but the function's switch statement has no `case "delete"` — it falls through to `default` returning "Invalid action". Archived messages can never be permanently removed.

### Changes

#### 1. Add `"delete"` case to the edge function (`supabase/functions/manage-conversation/index.ts`)

Add a new case in the switch block that:
- Deletes all `direct_messages` rows where `conversation_id` matches
- Deletes the `dm_conversations` row itself
- Returns early (no `update` call needed since the row is deleted)

```
case "delete":
  // Delete all messages in the conversation
  await supabase.from("direct_messages").delete().eq("conversation_id", conversationId);
  // Delete the conversation itself
  await supabase.from("dm_conversations").delete().eq("id", conversationId);
  return success response
```

#### 2. Add a visible "Delete" option in the archived conversations list (`src/components/messaging/DirectMessageInbox.tsx`)

Currently the delete option only appears in the conversation detail dropdown (line 454). Add a delete button/option visible when browsing the archived tab's conversation list, so users can delete archived conversations without opening them first. This could be a swipe action or a trash icon on each archived row.

### Files
1. `supabase/functions/manage-conversation/index.ts` — add `delete` case
2. `src/components/messaging/DirectMessageInbox.tsx` — add delete option to archived conversation list items

