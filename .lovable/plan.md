# Fix bubble sizing inside the camera-roll phone on mobile

## Problem
In `src/components/home/CreatorAIMagic.tsx` (Scene 1), the phone frame is only `w-[160px]` on mobile but scales up to `w-[200px]` on `md+`. The two bubbles inside it use a fixed `text-[10px]` with `px-2 py-0.5` padding (location pill) and `text-[10px] py-1.5` (CTA button). At 160px wide the strings "Captured in Santorini · Jun 12–14" and "Generate with Goldsainte AI" visually crowd / overflow the phone, while looking fine on desktop.

## Change (scoped to lines 116–127 of `CreatorAIMagic.tsx`)
Make the bubbles responsive — smaller on mobile, current size from `sm:` up. No layout, copy, color, or animation changes.

1. **Location pill (line 117–120)**
   - Add responsive text + icon size: `text-[8px] sm:text-[10px]`
   - Tighten padding on mobile: `px-1.5 py-[1px] sm:px-2 sm:py-0.5`
   - Icon: `w-[7px] h-[7px] sm:w-2 sm:h-2`
   - Optional: wrap text in `truncate max-w-full` and add `min-w-0` so it never overflows the phone interior.

2. **Generate CTA button (line 122–126)**
   - Responsive text: `text-[8px] sm:text-[10px]`
   - Tighter vertical padding on mobile: `py-1 sm:py-1.5`
   - Icon: `w-2 h-2 sm:w-2.5 sm:h-2.5`
   - Add `whitespace-nowrap` so it stays one line.

3. **Outer wrappers (lines 116 & 122)**
   - Change `px-3 pt-2` → `px-2 pt-1.5 sm:px-3 sm:pt-2` to reclaim a few pixels of horizontal room on mobile.

## Out of scope
- Phone frame dimensions, Scene 2/3 layouts, copy, colors, animations, and the parent `CameraRollHighlight` section all stay as-is.
- No design-system token changes.

## Verification
- Resize preview to 375px width and confirm both bubbles sit cleanly inside the phone with no clipping or wrapping.
- Confirm desktop (≥640px) renders identically to today.
