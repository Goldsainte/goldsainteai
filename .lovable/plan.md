

# Reorganize Menu Bar with User Greeting

## Changes to `src/components/Header.tsx`

### 1. Fetch user's name alongside avatar
Extend the existing `fetchProfileAvatar` query to also select `display_name, full_name` from profiles. Store in a new `profileName` state variable. Display as "Hello [Name]" at the top of the dropdown.

### 2. Reorganize menu items (both mobile and desktop dropdowns) to match the reference image

**New order:**

```text
┌──────────────────────────┐
│ Hello, Radu D            │  ← greeting with user name
├──────────────────────────┤
│ Core Experience          │
│  Travel Marketplace      │
│  Storyboards             │
│  Post a Trip             │
│  My Trips                │
│  Messages                │
├──────────────────────────┤
│ Account                  │
│  My Profile              │
├──────────────────────────┤
│ Secondary                │
│  Become an Agent         │
├──────────────────────────┤
│ Informational            │
│  About                   │
├──────────────────────────┤
│ Admin (if admin)         │
├──────────────────────────┤
│ Language selector        │
│ Sign Out                 │
└──────────────────────────┘
```

### 3. Role-specific items stay conditional
- "My Trips" visible for travelers
- "Available Trips" / "Create Trip Package" for agents/creators
- Admin accordion for admins only

### Files modified
- `src/components/Header.tsx` — add `profileName` state, extend profile query, add greeting header, reorder menu items in both mobile and desktop dropdowns

