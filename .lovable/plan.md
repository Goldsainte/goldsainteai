## Problem
After portaling the dropdown panel to `document.body`, the options render correctly but selecting one doesn't change the value. The outside-click handler treats the portaled panel as "outside" the picker and closes it on `pointerdown`, which unmounts the panel before the option's `click` fires.

## Fix
In `src/pages/newsroom/ui.tsx`:
- Add a ref to the portaled panel.
- Update the document `pointerdown` listener to treat clicks inside either the trigger wrapper or the panel as "inside" (do not close).
- Keep escape-to-close and outside-click-to-close behavior intact.

No other files need changes; all consumers (`NewsroomLayout`, `Archive`, `PressContact`) already use the shared component.

## Validation
Reproduce on the mobile viewport: open the section dropdown on `/newsroom/archive`, tap a different option, confirm the route changes and the trigger label updates. Repeat for the Archive filter and Press Contact topic picker.