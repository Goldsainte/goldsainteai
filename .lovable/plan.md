

# Merge Step Guide Into Accordion Sections

## Problem
The page currently shows a step guide banner **plus** all three content sections (Trip Details, Add Photos, Browse Inspiration) at once. The step guide helps with labeling but doesn't reduce visual density -- users still see everything simultaneously.

## Approach
Replace the separate step guide banner and individual sections with a single **stepped accordion** where each step IS its own collapsible panel. Only one section is open at a time (or the user can open multiple). This provides progressive disclosure -- users focus on one task at a time while still seeing their progress on the others.

## Changes -- `src/pages/TikTokLab/StoryboardEditorPage.tsx`

1. **Remove the standalone Step Guide banner** (lines 525-567) -- it becomes redundant because each accordion trigger now shows the step number, title, required/optional badge, and completion checkmark.

2. **Wrap all three sections in a single `<Accordion type="multiple">`** with three items:
   - **Step 1: Trip Details** -- Contains the existing trip fields (currently inside the Collapsible). Trigger shows "1 Trip Details [Required] [X/2 done]" with CheckCircle2 when destination + dates are filled.
   - **Step 2: Add Photos** -- Contains the existing `<StoryboardBuilder>` component. Trigger shows "2 Add Photos [Required · min 3] [N photos]" with CheckCircle2 when >= 3 photos.
   - **Step 3: Browse Inspiration** -- Contains the existing `<TravelStoryboard>` component. Trigger shows "3 Browse Inspiration [Optional]" in muted styling.

3. **Remove the existing Trip Details `<Collapsible>`** -- replaced by AccordionItem.

4. **Default open state** -- In create mode, Step 1 is open by default. In edit mode, Step 2 is open by default (since details are likely already filled).

5. **Keep the "Build Your Trip Board" heading and subtitle** above the accordion for context.

## Visual Design
- Each AccordionTrigger: step number circle (or green check), title, and required/optional pill -- same styling as current step guide
- Dashed connector lines removed (not needed when sections are stacked vertically)
- AccordionContent has the same rounded card styling currently used for Trip Details content
- Consistent with existing accordion patterns used for Vibe Tags, Must-Haves, Dealbreakers inside Trip Details

