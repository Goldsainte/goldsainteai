

## Fix Message Request Acceptance + Elevate Messaging UX

Two problems to solve: (1) the edge function CORS failure blocking accept/decline/block, and (2) the messaging UI needs the Instagram-fluidity × Goldsainte-elegance treatment.

---

### 1. Fix CORS headers on edge functions (root cause of "non-2xx" error)

The `manage-conversation` and `get-conversations` edge functions use outdated CORS headers missing `x-supabase-client-*` headers that the newer Supabase JS client sends. This causes preflight (OPTIONS) failures.

**Files:** `supabase/functions/manage-conversation/index.ts`, `supabase/functions/get-conversations/index.ts`

Update both functions' `corsHeaders` to:
```
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

Also check and fix any other DM-related edge functions (e.g. `send-direct-message`).

---

### 2. Optimistic accept flow with loading states

**File:** `src/components/messaging/DirectMessageInbox.tsx`

- Add `acceptingRequest` loading state
- On accept click: immediately set `acceptingRequest = true`, disable button, show spinner
- On success: optimistically move conversation from requests → primary, update `selectedConversation.status` to `"active"`, clear request banner with fade animation, auto-focus message input
- On error: revert UI, show non-blocking toast, re-enable button
- Add `inputRef` to auto-focus the message input after accept

---

### 3. Elevate messaging UX — Instagram fluidity, Goldsainte elegance

**File:** `src/components/messaging/DirectMessageInbox.tsx`

**Request banner microcopy:**
- Replace "This is a message request. Accept to continue the conversation." with "This member would like to connect with you. Accept to begin the conversation."
- Add transition animation on banner dismiss (`transition-all duration-200`)

**Message bubbles:**
- Sent messages: subtle gold-tinted background (`bg-[#0a2225]` stays but add slightly more padding, `px-4 py-3`)
- Received messages: warm cream (`bg-[#F6F0E4]`) instead of white with border
- Larger, softer bubbles with `rounded-[1.25rem]`
- More breathing room between messages (`space-y-3` → `space-y-4`)

**Conversation header:**
- Bold display name with subtle verified badge
- Sub-label: capitalize account type (e.g., "Creator", "Certified Travel Agent") — already present, just refine styling

**Timestamp grouping:**
- Group messages by date with centered date labels ("Today", "Yesterday", date)

**Input bar:**
- Sticky at bottom with subtle shadow
- Auto-focus on conversation select and after accept
- Slightly larger input field

**Empty state refinement:**
- Remove `MessageCircle` icon from empty conversation view
- Use serif heading "Select a conversation" with editorial sub-copy

**Scroll behavior:**
- Ensure scroll-to-bottom on new messages (already present, verify smooth)

---

### 4. Real-time typing indicator (stretch)

Add a simple typing indicator using Supabase Realtime broadcast channel:
- When user types, broadcast presence to conversation channel
- Show "typing..." indicator below the last message from the other participant
- Debounce typing events (stop after 2s of no input)

**Files:** `src/hooks/useDirectMessages.ts` (add typing broadcast), `src/components/messaging/DirectMessageInbox.tsx` (render indicator)

---

### Summary of files to change:
1. `supabase/functions/manage-conversation/index.ts` — fix CORS
2. `supabase/functions/get-conversations/index.ts` — fix CORS  
3. Any other DM edge functions — fix CORS
4. `src/components/messaging/DirectMessageInbox.tsx` — optimistic accept, loading states, UX elevation, typing indicator UI, warm microcopy
5. `src/hooks/useDirectMessages.ts` — typing indicator broadcast

