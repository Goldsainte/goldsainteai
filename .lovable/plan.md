

# Remove Mobile Bottom Navigation Bar

## Change — `src/App.tsx`

Remove the `<MobileBottomNav />` component render (around line 137) and its import (line 11).

Also remove `pb-16 lg:pb-0` from the wrapper div (line 130) since that padding was only there to account for the fixed bottom nav.

Single file change.

