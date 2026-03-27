

## Delete Old Accordion Storyboard Editor, Replace with New Visual Creator

### The Problem
`/storyboards/new`, `/storyboards/:id`, and `/storyboards/:id/edit` all load the old 837-line accordion form (`src/pages/TikTokLab/StoryboardEditorPage.tsx`). This needs to be deleted and replaced with the new visual creation page.

### Changes

**1. Create `src/pages/storyboards/StoryboardNewPage.tsx`** — New visual creator page:
- Cover image upload area (click to upload or open Design Editor)
- Large inline title + destination inputs (no form labels)
- Vertical content blocks list (image + caption per block)
- "+" button to add blocks via Upload, Design, or Unsplash
- Publish button creates storyboard + items, navigates to detail page
- Reuses existing `StoryboardPhotoUploader` and `DesignEditorModal` components

**2. Delete `src/pages/TikTokLab/StoryboardEditorPage.tsx`** — Remove the entire 837-line accordion form.

**3. Edit `src/routes/AppRoutes.tsx`:**
- Remove the `TikTokLabStoryboardEditorPage` lazy import
- `/storyboards/new` → new `StoryboardNewPage`
- `/storyboards/:id` → existing `StoryboardDetailPage` (view mode)
- `/storyboards/:id/edit` → new `StoryboardNewPage` (edit mode, loads existing data)

No database changes needed.

