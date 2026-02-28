

## Fix Message Readability + Elevate to Luxury Aesthetic

The dark sent-bubble (`bg-[#0a2225]`) makes text hard to read, and the overall feel is still too app/AI-like. Here's the plan:

### 1. Fix message bubble colors for readability

**Sent messages**: Change from dark green `bg-[#0a2225] text-white` to a warm gold-cream `bg-[#E8DCC8] text-[#0a2225]` — legible, warm, luxury. Timestamp in `text-[#9CA3AF]`. Read receipts use `text-[#C7A962]` (already gold).

**Received messages**: Keep `bg-[#F6F0E4] text-[#0a2225]` but add a very subtle border `border border-[#E5DFC6]/40` for definition.

### 2. Add delete message + swipe actions

Add a `Trash2` icon option to `MessageBubble` — on hover (desktop) show a small delete button. Only for own messages. Wire it to a new `deleteMessage` callback passed down from the inbox. Also add "Delete Conversation" to the existing dropdown menu alongside Archive and Block.

### 3. Make Block/Archive/Delete more accessible

Move Archive, Block, and new Delete Conversation options into clearer, more prominent controls:
- Add a subtle action bar below the conversation header with icon buttons (Archive, Block, Delete) instead of hiding everything behind a `⋮` menu
- Keep the dropdown as fallback but surface the key actions visually

### 4. Remove "AI website" feel — warmer microcopy and softer UI

- Replace hard geometric rounded-full tab pills with softer underline-style tabs
- Remove Lucide icons from tab labels (Inbox, MessageCircle, Archive icons) — use text only
- Soften conversation list: remove heavy borders, use subtle hover states
- Input placeholder: "Write something…" instead of "Type a message…"
- Empty states: warmer editorial copy

### 5. Refine message area background

Change message area from `bg-[#FDFBF7]` to pure `bg-white` to reduce the yellowish cast that makes dark text harder to read against bubble backgrounds.

### Files to change
1. `src/components/messaging/DirectMessageInbox.tsx` — all changes above (bubble colors, delete actions, UI refinements, microcopy)

