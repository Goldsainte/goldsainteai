

# Fix: "Create a Storyboard" Button Routing

## Problem

The "Create a Storyboard" pill button in the "Why Goldsainte" section links to `/storyboards`, which is the **listing page** (My Storyboards). The user expects it to go to the **storyboard creation/editor page** — the one with trip details (destination, dates, budget, visual pins, etc.).

The "Trip not found" error is likely caused by a navigation issue after auth redirect, landing the user on a trip detail route instead of the storyboard route.

## Fix

### File: `src/components/home/TwoWaysComparison.tsx`

Change the Storyboarding card's `linkTo` from `/storyboards` to `/storyboards/new`.

This ensures the button links directly to the storyboard editor/creation page (`TikTokLabStoryboardEditorPage`) — the full-featured page with trip details, destination, dates, budget fields, visual pin builder, and marketplace submission.

The `/storyboards/new` route is already defined in AppRoutes (line 419) and renders the correct component.

Single-line change: `linkTo="/storyboards"` → `linkTo="/storyboards/new"`.

