

## Fix: Text Editing in Design Editor

### Problem
Radix Dialog has a built-in focus trap that steals focus from Fabric.js's hidden `<textarea>`. When you click "Text," Fabric creates an `IText` and enters edit mode, but the dialog immediately yanks focus back — so keystrokes never reach the canvas.

### Fix (1 file)

**`src/components/storyboards/DesignEditorModal.tsx`**

Add two props to `DialogContent`:

1. **`onOpenAutoFocus={(e) => e.preventDefault()}`** — Stop the dialog from grabbing focus on open, letting Fabric keep control.
2. **`onInteractOutside={(e) => { if (fabricRef.current?.getActiveObject()?.isEditing) e.preventDefault(); }`** — Prevent the dialog from closing/stealing focus when clicking inside the canvas while editing text.

That's it — two event handler props on the existing `DialogContent` element.

| Action | File |
|--------|------|
| Edit | `src/components/storyboards/DesignEditorModal.tsx` |

