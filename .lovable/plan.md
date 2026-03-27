

## Storyboard Creation: Add Photo Upload + React Design Editor

### What Changes

Add two new content sources to the storyboard builder alongside the existing Unsplash search and link tabs:

1. **Upload Photos** — creators upload their own travel photos directly from their device
2. **Design Editor** — embedded `react-design-editor` (Fabric.js-based) canvas for creating visual content blocks

---

### 1. Install `react-design-editor`

Add the npm package (MIT, free, Fabric.js + React). This provides a Canva-like canvas editor for creating cover images, caption cards, and styled visual blocks.

---

### 2. Add "Upload" Tab to `StoryboardBuilder.tsx`

Add a third tab alongside "Photos" and "TikTok/Reels/YouTube":

- **Upload** tab with a file input (multi-file, accepts image/*)
- On file select: upload each file to `trip-assets` storage bucket under `storyboard-uploads/{timestamp}-{random}.{ext}`
- Get public URL and add as a storyboard item (kind: "photo", source: "manual")
- Show upload progress with a spinner per file
- Reuse the same 50MB limit and JPEG/PNG/WebP/GIF validation from `TripImageUploader`

---

### 3. Add "Design" Tab to `StoryboardBuilder.tsx`

Add a fourth tab:

- **Design** tab that opens a modal/dialog containing the `react-design-editor` workspace
- Creator can add text, images, shapes, and layers on a canvas
- "Add to Storyboard" button exports the canvas as a PNG, uploads to storage, and adds as an item
- Keep it as a modal overlay so the builder flow isn't disrupted

---

### 4. New Component: `DesignEditorModal.tsx`

A dialog wrapping the react-design-editor:

- Full canvas workspace with toolbar (text, images, shapes, layers)
- "Export & Add" button: renders canvas to PNG blob → uploads to `trip-assets` bucket → returns URL → closes modal and adds item to storyboard
- Cancel button to dismiss without saving

---

### 5. Update `StoryboardDetailPage.tsx` — Owner Upload + Design

For the owner view, add two actions alongside the existing "Browse Creators" empty state:

- "Upload Photos" button (same upload flow)
- "Design" button (opens design editor modal)
- These also appear as floating action buttons when the storyboard has items

---

### Technical Summary

| Action | File |
|--------|------|
| Install | `react-design-editor` npm package |
| Create | `src/components/storyboards/DesignEditorModal.tsx` |
| Edit | `src/components/storyboards/StoryboardBuilder.tsx` — add Upload + Design tabs |
| Edit | `src/pages/storyboards/StoryboardDetailPage.tsx` — add upload/design actions for owners |

No database migration needed — uses existing `trip-assets` storage bucket and `storyboard_items` table.

