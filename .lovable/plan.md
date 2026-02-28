

## Remove Message Bubble Icon from Header

Simple removal of `MessageBubbleIcon` from both mobile and desktop header sections.

**File:** `src/components/Header.tsx`

1. Remove the import of `MessageBubbleIcon` (line 4)
2. Remove `<MessageBubbleIcon />` from mobile header (line 194)
3. Remove `<MessageBubbleIcon />` from desktop header (line 422)

The `MessageBubbleIcon` component file and `useUnreadMessageCount` import can stay — they may be used elsewhere or in the future.

