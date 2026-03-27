

## Fix: Publish Storyboard Button Not Working

### Problem

The "Publish Storyboard" button has two likely failure modes:

1. **Button is disabled (greyed out)** — It's disabled when `!title.trim()`, meaning if the title input is empty, clicking does nothing with no explanation to the user.
2. **User not authenticated** — `handlePublish` calls `supabase.auth.getUser()`. If the user isn't logged in, it throws "Not authenticated" which shows a toast, but if the toast isn't visible (e.g., positioned off-screen or styled to blend in), it seems like nothing happened.

### Fix (1 file: `StoryboardNewPage.tsx`)

1. **Add visual feedback when disabled** — Show a tooltip or inline message below the button explaining "Enter a title to publish" when the title is empty.

2. **Add auth check before publish** — Instead of silently failing, redirect to login if not authenticated, or show a clear modal/alert.

3. **Add console logging** — Temporary `console.log` at the start of `handlePublish` to confirm the click handler fires at all (to rule out event propagation issues).

4. **Check button `type` attribute** — The button is inside a form-like structure. If it's inside a `<form>`, it may be submitting the form instead of calling `onClick`. Add `type="button"` explicitly to both Publish buttons.

### Changes

| Action | File |
|--------|------|
| Edit | `src/pages/storyboards/StoryboardNewPage.tsx` |

- Add `type="button"` to both publish `<Button>` elements (lines 462 and 614)
- Add a disabled-state message: when `!title.trim()`, show helper text "Add a title first"
- Add `console.log("handlePublish called")` at top of `handlePublish` for debugging
- If user is not authenticated, navigate to `/auth` instead of just showing a toast

