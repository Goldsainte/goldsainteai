

# Remove "From Unsplash" and "From your library" Labels

## File: `src/components/storyboards/TravelStoryboard.tsx`

### Changes
1. **Remove the "From Unsplash" header row** (lines 368-378) — delete the entire div containing the label, spinner, and photo count
2. **Remove the "Photos by Unsplash" attribution link** (lines 430-437)
3. **Remove the "From your library" label** (lines 444-448)
4. Keep the searching spinner inline somewhere subtle (e.g. next to the search input or just the shimmer skeleton is enough)

Result: Unsplash and local images will render seamlessly in one continuous grid without section dividers.

