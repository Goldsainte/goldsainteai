

# Add Profile/Traveler Hub Link to Menus & Remove Preferences Toggle

## Changes in `src/components/Header.tsx`

### 1. Add "My Profile" menu item to both mobile and desktop dropdown menus
- Add a "My Profile" `DropdownMenuItem` near the top of the flat menu list (after Travel Marketplace)
- Routes based on role: travelers → `/traveler`, creators → `/creator/${user.id}`, agents → `/agent-dashboard`
- Uses `User` icon

### 2. Remove "Apply saved preferences to searches" toggle
- Remove the entire `{isTraveler && (<>...</>)}` block containing the "Use My Preferences" switch and "Apply saved preferences to searches" text from **both** mobile (lines 363-386) and desktop (lines 577-600) dropdown menus
- Also remove the `usePreferences` state, `fetchPreferences` useEffect, and `togglePreferences` function since they become unused
- Remove `Switch` and `Label` imports if no longer used elsewhere

## Changes in `src/components/social/LeftNav.tsx`

### 3. Fix Profile button routing for travelers
- Change the Profile `NavItemBtn` to route travelers to `/traveler` instead of always going to `/creator/${user.id}`

