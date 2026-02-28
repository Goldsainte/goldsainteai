

## Add Instagram-Style Notification Bell + Message Notification Badges

### Current state
- The `send-direct-message` edge function **already creates a notification** in the `notifications` table when a message is sent (line 238) — so notifications are being generated.
- The `NotificationBell` component only **polls every 60s** via `fetchUnreadCount()` — no real-time subscription, so new notifications don't appear immediately.
- The Messages menu item in the dropdown already shows an unread badge via `useUnreadMessageCount` hook with real-time subscription — this works.
- The bell icon is small (h-4 w-4) and understated — needs to be more prominent like Instagram.

### Changes

**1. Upgrade `NotificationBell` to use real-time Supabase subscription** (`src/components/notifications/NotificationBell.tsx`)
- Replace polling with a Supabase realtime channel subscription on the `notifications` table filtered by `user_id`
- On INSERT event, increment count immediately
- On UPDATE (is_read = true), decrement
- Import `useAuth` to get the current user ID for the subscription filter
- Keep initial fetch on mount

**2. Make the bell more prominent — Instagram-style** (`src/components/notifications/NotificationBell.tsx`)
- Increase button size to `h-10 w-10` (from h-8 w-8)
- Increase icon to `h-5 w-5` (from h-4 w-4)
- Badge: use `bg-red-500 text-white` (Instagram's red dot) instead of `bg-[#0c4d47]` with `text-[#E5DFC6]`
- Add a subtle scale animation on new notification (`animate-bounce` briefly or a pulse on the badge)
- Badge size increase to `h-5 min-w-5 text-[10px]` for better visibility

**3. Add unread message count badge to the bell area in the header** (`src/components/Header.tsx`)
- Next to the notification bell, show a separate messages icon with unread badge (already exists in dropdown, but also show it as a standalone icon in the header bar for quick access on both mobile and desktop)
- This gives users two visible indicators: bell (notifications) + message bubble (DMs)

**4. Combine notification + message counts for the bell (optional alternative)**
- Instead of two icons, show combined count on the bell. The plan will go with two separate icons for clarity — matching Instagram's pattern of separate notification heart and DM paper-plane icons.

### Files to change
1. `src/components/notifications/NotificationBell.tsx` — real-time subscription + Instagram-style bell design
2. `src/components/Header.tsx` — add a standalone Messages icon with unread badge next to the bell (mobile + desktop)

