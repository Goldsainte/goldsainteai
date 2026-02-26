

# Route All Storyboard Links to My Storyboards Page

## Problem

The previous fix incorrectly changed links to point to `/storyboards/new` (the Create Storyboard editor — screenshot 2). The user wants every storyboard link across the site to go to `/storyboards` (the My Storyboards listing page — screenshot 1). The creation editor should only be reachable from the "+ New storyboard" button on that listing page itself.

## Changes

Revert or update all external `/storyboards/new` links back to `/storyboards`. The "+ New storyboard" button on the My Storyboards page itself stays as-is since it's the intended entry point to the editor.

### Files to update (7 files, 11 locations):

| File | What changes |
|------|-------------|
| `src/components/home/TwoWaysComparison.tsx` | `linkTo="/storyboards/new"` → `linkTo="/storyboards"` |
| `src/pages/CreatorTripPage.tsx` | `to="/storyboards/new"` → `to="/storyboards"` |
| `src/pages/traveler/components/TravelerStoryboardsTab.tsx` | 2 links `/storyboards/new` → `/storyboards` |
| `src/pages/traveler/components/TravelerOverviewTab.tsx` | `to="/storyboards/new"` → `to="/storyboards"` |
| `src/components/AIBookingConcierge.tsx` | 4 navigate calls `/storyboards/new` → `/storyboards` |
| `src/components/MadisonChat.tsx` | 2 references `/storyboards/new` → `/storyboards` |
| `src/pages/CollectionsPage.tsx` | `to="/storyboards/new"` → `to="/storyboards"` |

### Not changed (intentionally kept at `/storyboards/new`):
- **`MyStoryboardsPage.tsx`** — the "+ New storyboard" button lives on the listing page itself; this is the correct entry point to the editor.
- **`AgentDashboard.tsx`** — agent-specific storyboard builder at `/agent-dashboard/storyboards/new` is a separate flow.

All changes are single-string replacements. No logic changes.

