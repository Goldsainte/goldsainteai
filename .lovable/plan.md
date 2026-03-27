

## Fix: Design Editor Canvas Not Interactive

### Root Cause

Two issues prevent the Fabric.js canvas from receiving mouse/touch events:

1. **`contain-paint` on DialogContent** — Fabric.js v6 creates a wrapper `<div>` containing two stacked `<canvas>` elements (a render canvas and an "upper canvas" for mouse interaction). The CSS `contain-paint` property on the dialog creates a containment context that interferes with Fabric's absolutely-positioned upper canvas layer, blocking pointer events.

2. **`overflow-hidden` on DialogContent** — Combined with `contain-paint`, this clips Fabric's interaction layer, making the canvas appear present but completely unresponsive.

### Fix

**Edit `src/components/storyboards/DesignEditorModal.tsx`** (1 file):

1. **Canvas container needs `relative` positioning and explicit size** — Wrap the `<canvas>` in a container with `position: relative` and explicit `width`/`height` matching the Fabric canvas dimensions, so Fabric's absolutely-positioned upper canvas stays properly stacked.

2. **Override dialog's restrictive CSS on the canvas area** — Add `overflow-visible` and remove containment on the canvas wrapper so Fabric's event layer isn't clipped.

3. **Pass `className` override to DialogContent** — Add `!overflow-visible` to the DialogContent className to prevent the dialog's default `overflow-hidden` and `contain-paint` from eating pointer events on the canvas. Alternatively, use inline style `{{ contain: 'none' }}`.

4. **Increase init delay** — Bump the `setTimeout` from 100ms to 200ms for more reliable DOM readiness inside the dialog animation.

No changes to `dialog.tsx` needed — the fix is scoped to the Design Editor modal only.

### Summary

| Action | File |
|--------|------|
| Edit | `src/components/storyboards/DesignEditorModal.tsx` |

