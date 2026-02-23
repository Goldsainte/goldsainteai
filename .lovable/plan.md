
# Move Visual Brief: Remove Top, Promote Sidebar

## What's Happening Now

There are two "Visual Brief" / Storyboard sections on the Trip Request Detail page:

1. **Full-width gallery** (right below the hero) -- the large horizontal scrolling version with editorial intro text
2. **Sidebar compact version** (in the right column, near the bottom) -- a smaller grid-based storyboard viewer

## The Change

- **Remove** the full-width gallery section (lines 526-540) that sits between the hero and the two-column layout
- **Remove** the compact sidebar storyboard card (lines 992-1002)
- **Add** the sidebar-style storyboard into the full-width position (right below the hero), keeping the gallery variant for the larger display but using the sidebar's position in the page flow

In short: one single Visual Brief section, placed right after the hero in the full-width slot, using the gallery variant for best visual impact.

## Technical Details

### File: `src/pages/marketplace/TripRequestDetail.tsx`

1. **Keep** the full-width storyboard section (lines 526-540) with its gallery variant -- this is the one the user wants to keep (it has the photos they see in the screenshot)
2. **Remove** the sidebar compact storyboard card (lines 992-1002) -- this is the duplicate at the bottom that should be eliminated

This results in a single "Visual Brief" section positioned right after the hero, exactly matching the screenshot the user shared.
