

# Flatten Menu: Remove Accordion Section Headers

## What changes
Replace the accordion-based menu structure in `Header.tsx` with a flat list of menu items. Remove the "Discover", "My Account", "Professional", and "Company" section headers/accordions entirely. Keep "Admin" accordion since it has many items and is admin-only.

## Changes in `src/components/Header.tsx`

### Both mobile (lines 268-411) and desktop (lines 532-666) dropdown menus:

1. **Remove the `<Accordion>` wrapper and all `AccordionItem`/`AccordionTrigger`/`AccordionContent` wrappers** for Discover, My Account, Professional, and Company sections
2. **List all menu items as flat `DropdownMenuItem`s** in order:
   - Travel Marketplace (already flat in Quick Access)
   - Storyboards
   - Post a Trip
   - My Trips (traveler only)
   - Messages
   - Available Trips (agent only)
   - Create Trip Package (creator/agent only)
   - Become an Agent
   - About
3. **Keep Admin accordion** wrapped in its own `<Accordion>` for admin users only
4. **Remove the "Quick Access" header** -- no longer needed since everything is flat
5. **Also fix the mobile bottom nav** (lines 765-772): replace the "Madison" button (concierge no longer exists) with something useful like "Storyboards" or "Post Trip"

