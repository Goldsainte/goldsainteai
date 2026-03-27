

## Fix: "New Storyboard" Button Should Navigate to Editor, Not Show a Form Dialog

### The Problem

Clicking "New Storyboard" on the creator profile opens a basic form dialog (Title, Destination, Description) that feels disconnected. After submitting, nothing visibly happens — the page just silently refreshes data without navigating anywhere. The creator has no way to actually add content to the storyboard they just created.

### The Fix

Replace the dialog with direct navigation to the storyboard editor at `/storyboards/new`. This is where the full creation experience lives (upload photos, design, add blocks). The title/destination/description can be set inside the editor — no need for a separate dialog.

### Changes

**Edit `src/pages/creators/CreatorPublicProfilePage.tsx`:**
- Remove the `showCreateDialog` state, `newBoardTitle`, `newBoardDescription`, `newBoardDestination`, `creating` state variables
- Remove the `handleCreateStoryboard` function
- Remove the `<Dialog>` block at the bottom (lines 427-470)
- Change the `onCreateNew` callback passed to `CreatorStorefrontFeed` to simply `navigate("/storyboards/new")`

That's it — one file, removing ~50 lines of unnecessary dialog code and replacing with a single navigation call.

