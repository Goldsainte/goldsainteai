

# Redesign My Storyboards Page — Clean Workflow Hierarchy

## Problem

The current `/storyboards` page (`TikTokLabStoryboardsPage`) suffers from:
1. **Identity crisis** — tries to be a dashboard, creation studio, and feed simultaneously
2. **Heavy explainer box** interrupts momentum (belongs on a landing page, not inside the tool)
3. **Long subtitle** reads like marketing copy, not a tool interface
4. **No clear primary action** — user doesn't know what to do first
5. **"Browse Inspiration" section** blends into the storyboard grid with no visual separation
6. **"Convert to Trip"** CTA is buried in hover state and floating copy

## Design — Option A (Cleanest)

Restructure the page into a focused tool with clear hierarchy:

```text
┌─────────────────────────────────────────┐
│ ← Back to Dashboard                    │
│                                         │
│ MY STORYBOARDS                          │
│ Create a visual board. Post when ready. │
│                                         │
│ [+ Create New Storyboard]  ← PRIMARY   │
│                                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │ sb1 │ │ sb2 │ │ sb3 │ │ sb4 │       │
│ │     │ │     │ │     │ │     │       │
│ │ Post│ │ Post│ │ Post│ │ Post│       │
│ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  What's the difference between          │
│  Storyboard & Post a Trip? ← subtle    │
│                                         │
│ ── Browse Inspiration ──── [tab/section]│
│ ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐        │
│ └───┘└───┘└───┘└───┘└───┘└───┘        │
└─────────────────────────────────────────┘
```

## Changes

### File: `src/pages/TikTokLab/StoryboardsPage.tsx`

This is the only file that needs significant changes:

1. **Remove** the `StoryboardExplainerCard` import and usage (lines 9, 157)

2. **Replace subtitle** (line 117):
   - From: "Think Pinterest — but for planning a trip. Save hotels, destinations, restaurants..."
   - To: "Create a visual board. Post when ready."

3. **Add subtle explainer link** — a small text link below the subtitle: "What's the difference between Storyboard & Post a Trip?" that opens a modal/dialog containing the comparison content (reusing the two-column layout from `StoryboardExplainerCard`)

4. **Make "Create New Storyboard" the dominant CTA**:
   - Move the `+ New storyboard` button to appear prominently below the subtitle (not just in the header row)
   - Show it always, not just when `storyboards.length > 0`
   - Make it larger and more prominent

5. **Add "Post to Marketplace →" to each storyboard card** — the existing hover CTA is good but also add a persistent subtle link beneath each card's metadata so it's visible without hovering (especially important on mobile where hover doesn't exist)

6. **Separate "Browse Inspiration" with tabs** — wrap the storyboard grid and Browse Inspiration in a `Tabs` component with two tabs: "My Storyboards" and "Browse Inspiration". This gives each section its own space instead of stacking them.

7. **Update empty state** — simplify copy to match the new tone. Remove the "Browse Inspiration" scroll button since it now has its own tab.

### Detailed structure of the redesigned page:

**Header area:**
- Back button (existing role-aware logic, unchanged)
- Gold accent label: "Your Travel Planning Board"
- Title: "My Storyboards"
- Subtitle: "Create a visual board. Post when ready."
- Subtle link: "What's the difference between Storyboard & Post a Trip?" → opens Dialog with the two-column comparison content from `StoryboardExplainerCard`
- Primary CTA button: `+ Create New Storyboard` (always visible, prominent)

**Tabs:**
- Tab 1: **My Storyboards** — grid of storyboard cards (existing grid). Each card gets a persistent "Post to Marketplace →" link below metadata for unconverted boards
- Tab 2: **Browse Inspiration** — the existing `TravelStoryboard` component

**Modal/Dialog:**
- Triggered by the subtle link
- Contains the same two-column Storyboard vs Post a Trip comparison from `StoryboardExplainerCard`
- Dismissible, non-intrusive

### Files affected:
- `src/pages/TikTokLab/StoryboardsPage.tsx` — main redesign (all changes above)
- No other files need changes. `StoryboardExplainerCard` can remain in the codebase for now (it's just no longer imported on this page).

