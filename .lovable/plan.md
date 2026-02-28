

## Root Cause: Schema Mismatch Breaking ALL Notification Triggers

The current `notifications` table uses column `type` with a strict CHECK constraint allowing only 13 values. But **all existing trigger functions** write to a column called `notification_type` (which doesn't exist) and use types like `'comment'`, `'like'`, `'follow'` (which aren't in the CHECK constraint). This means **every trigger silently fails** — no notifications are ever created.

### Current State
- **Table column**: `type` (not `notification_type`)
- **Table column**: `action_url` (not `link`)
- **Table column**: `entity_type` + `entity_id` (not `metadata` jsonb)
- **CHECK constraint** on `type`: only allows `application_update`, `new_trip_request`, `new_proposal`, `proposal_accepted`, `proposal_declined`, `booking_confirmed`, `payment_received`, `milestone_funded`, `milestone_released`, `payout_completed`, `review_received`, `message_received`, `system_announcement`
- **14 triggers exist** but all fail due to wrong column names and disallowed type values

---

### Migration 1: Fix the schema constraint

Drop the restrictive CHECK constraint on `type` to allow all notification types the system needs. This is safer than enumerating every possible type.

### Migration 2: Rewrite all trigger functions

Rewrite every trigger function to use the correct column names (`type`, `action_url`, `entity_type`, `entity_id` instead of `notification_type`, `link`, `metadata`):

1. **`notify_new_like`** — `type = 'like'`
2. **`notify_new_comment`** — `type = 'comment'`
3. **`notify_new_follow`** — `type = 'follow'`
4. **`notify_user_tag`** — `type = 'tag'`
5. **`notify_collaboration_invite`** — `type = 'collaboration_invite'`
6. **`notify_collaboration_accepted`** — `type = 'collaboration_accepted'`
7. **`notify_new_partnership_request`** — `type = 'partnership_request'`
8. **`notify_partnership_status`** — `type = 'partnership_approved'` / `'partnership_rejected'`
9. **`notify_moment_reply`** — `type = 'moment_reply'`
10. **`notify_moment_interaction`** — `type = 'moment_interaction'`
11. **`notify_direct_message`** — `type = 'message_received'`
12. **`notify_verification_status_change`** — `type = 'verification'`

### Migration 3: Add new trigger functions + triggers

New triggers needed based on the system's tables:

1. **Trip proposal received** — When a row is inserted into `trip_proposals`, notify the trip request owner that a partner responded
2. **Trip proposal accepted/declined** — When `trip_proposals.status` changes to `accepted` or `declined`, notify the proposer
3. **New trip request posted** — When a `trip_requests` row is inserted, notify relevant agents (or skip if agent matching handles this via edge function)
4. **Booking confirmed** — When `marketplace_bookings` status changes to `confirmed`
5. **New bid on job** — Already handled by edge function `notify-new-bid`, so skip trigger
6. **Tier upgrade** — Already in `evaluate_and_upgrade_creator_tier` function, just needs column fix

### Migration 4: Re-drop and recreate triggers

Drop duplicate triggers (e.g., `trg_post_likes_notify` and `trigger_notify_new_like` both fire on `post_likes`) and recreate cleanly — one trigger per event.

---

### Frontend Fix: Update `useNotifications` and `notificationService`

**`src/hooks/useNotifications.ts`**: Update the field mapping to match the actual table schema:
- `n.type` → `type` (already correct column name)  
- `n.action_url` → for navigation links
- `n.entity_type` / `n.entity_id` → for metadata

**`src/services/notificationService.ts`**: Update the `fetchNotifications` mapping to use `type`, `action_url`, `entity_type`, `entity_id` correctly.

**`src/components/NotificationCenter.tsx`**: Update to read `notification.type` for icon mapping and display the `title`/`message` fields directly from the notification object instead of looking inside `payload`.

---

### Summary of all notification types after this fix

| Event | Trigger on table | Type value |
|---|---|---|
| Post liked | `post_likes` INSERT | `like` |
| Post commented | `post_comments` INSERT | `comment` |
| New follower | `user_follows` INSERT | `follow` |
| Tagged in post | `post_user_tags` INSERT | `tag` |
| Collaboration invite | `post_collaborators` INSERT | `collaboration_invite` |
| Collaboration accepted | `post_collaborators` UPDATE | `collaboration_accepted` |
| Partnership request | `paid_partnerships` INSERT | `partnership_request` |
| Partnership approved/rejected | `paid_partnerships` UPDATE | `partnership_approved` / `partnership_rejected` |
| Story reply | `moment_replies` INSERT | `moment_reply` |
| Story interaction | `moment_interaction_responses` INSERT | `moment_interaction` |
| Direct message | `conversation_messages` INSERT | `message_received` |
| Verification status | `customer_verifications` UPDATE | `verification` |
| **NEW: Proposal received** | `trip_proposals` INSERT | `new_proposal` |
| **NEW: Proposal accepted** | `trip_proposals` UPDATE (→accepted) | `proposal_accepted` |
| **NEW: Proposal declined** | `trip_proposals` UPDATE (→declined) | `proposal_declined` |
| Tier upgrade | (already in DB function) | `tier_upgrade` |

