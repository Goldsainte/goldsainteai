

# Add Numbered Step Guide to Storyboard Creation Flow

## Problem
New users landing on the storyboard create/edit page see Trip Details, a photo builder, and Browse Inspiration all at once with no sense of order or what's optional. It's unclear what to do first and what can be skipped.

## Approach
Add a numbered step guide banner at the top of the page (both create and edit modes) that shows the workflow as 3 clear steps, marking which are required vs optional. This replaces the cognitive load with a simple visual sequence.

## Changes — `src/pages/TikTokLab/StoryboardEditorPage.tsx`

1. **Add a StepGuide component** — A horizontal numbered step bar rendered above Trip Details (around line 525). Three steps:
   - **Step 1: Fill in Trip Details** — labeled "Required" in a small pill
   - **Step 2: Add Photos** — labeled "Required · min 3"  
   - **Step 3: Browse Inspiration** — labeled "Optional" in a muted pill

   Each step shows a numbered circle, title, and required/optional badge. Steps that are complete (based on existing readiness logic) get a green check instead of a number.

2. **Mark Browse Inspiration as optional** — Add a small "Optional" badge and a one-line description ("Save ideas from our library to your board") above the existing `TravelStoryboard` section at line 724-728 so it's clearly secondary.

3. **Update the create mode heading** — Replace the generic "Create Storyboard" heading (line 717) with a more guided message like "Build Your Trip Board" with a subtitle: "Follow the steps below to create your storyboard. Only steps 1 and 2 are needed to submit."

## Visual Design
- Step circles: 24px, numbered 1-2-3, connected by a thin dashed line
- Completed steps: green CheckCircle2 icon replacing the number
- Required badge: small `bg-[#0c4d47]/10 text-[#0c4d47]` pill
- Optional badge: small `bg-[#E5DFC6] text-[#8D8D8D]` pill
- Fits the warm luxury aesthetic already in use

