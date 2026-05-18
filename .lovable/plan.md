## Goal
Make the newsroom mobile dropdown menus open cleanly above the page content instead of sliding behind the separator line or nearby sections.

## What I’ll change
1. Update the shared mobile picker so its open panel renders in a safer stacking layer on mobile.
2. Adjust the newsroom layout container so the sticky mobile section bar and the dropdown panel don’t compete with the next content section.
3. Check every place using the shared picker in the newsroom, especially:
   - top section switcher in `NewsroomLayout.tsx`
   - archive filter in `Archive.tsx`
   - press contact topic picker in `PressContact.tsx`
4. Validate the fix on the phone viewport and confirm the opened options list stays fully visible above separators and content.

## Technical details
- Likely changes will be in `src/pages/newsroom/ui.tsx` and `src/pages/newsroom/NewsroomLayout.tsx`, with small follow-up adjustments only if needed in picker consumers.
- I’ll correct the stacking context rather than just increasing random spacing, so the dropdown panel behaves consistently across mobile newsroom pages.
- Validation will be done on the 390px mobile viewport where the issue is currently reproducible.