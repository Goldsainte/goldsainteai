

## Fix: Design Editor Canvas — Fabric.js Not Initializing Properly

### Root Cause

The Fabric.js canvas is likely failing to initialize because the dialog's base `DialogContent` has `sm:max-w-lg` (32rem = 512px) baked in, but the Design Editor passes `sm:max-w-[900px]`. The problem is the base class `sm:max-w-lg` is applied *before* the override class, and Tailwind doesn't guarantee the override wins in a class conflict — both classes exist in the stylesheet, and whichever appears later in the CSS file wins, not whichever appears later in the `className` string.

This means the canvas container (800px wide) is being squeezed into a ~512px dialog. Fabric.js creates its wrapper div to match the canvas dimensions, but the overflow is hidden/clipped. The "upper-canvas" (Fabric's interaction layer) is positioned absolutely and gets clipped or pushed outside the visible area — so clicks never reach it.

Additionally, `contain-paint` in the base dialog creates a paint containment context that clips Fabric's absolutely-positioned layers.

### The Fix (2 files)

**1. `src/components/storyboards/DesignEditorModal.tsx`**
- Reduce canvas to 600x400 so it fits comfortably in the dialog without requiring a wider override
- Add explicit `pointer-events: auto` and `position: relative` on the canvas wrapper
- Add a `DialogDescription` to fix the accessibility warning in console
- Add console.log in the `useEffect` to confirm Fabric actually initializes (for debugging, remove later)
- Ensure the canvas wrapper has `overflow: visible` with an inline style

**2. `src/components/ui/dialog.tsx`**
- Remove `contain-paint` from the base DialogContent class — it breaks any component that uses absolutely-positioned layers (Fabric.js, drag-and-drop, etc.). Replace with nothing or a less restrictive containment.

### Why buttons "do nothing"

When you click "Text," "Rectangle," etc., the code calls `fabricRef.current.add(...)`. If Fabric never initialized (because the canvas was clipped or the DOM element was in a broken state), `fabricRef.current` is `null` and the function silently returns on line 71: `if (!fabricRef.current) return;`. No error, no feedback — it just does nothing.

### Changes

| Action | File | What |
|--------|------|------|
| Edit | `src/components/ui/dialog.tsx` | Remove `contain-paint` from base classes |
| Edit | `src/components/storyboards/DesignEditorModal.tsx` | Reduce canvas size to fit dialog, add accessibility description, add debugging log |

