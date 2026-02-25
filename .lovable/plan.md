

# Simplify Profile Menu

## What Changes

The profile dropdown menu (both mobile and desktop) currently has too many items. The user wants it streamlined.

### Items to Remove
- **Dashboard** (Quick Access) -- remove entirely
- **Madison by Goldsainte AI** (Quick Access) -- remove entirely
- **Browse Creators** (Discover section) -- remove entirely
- **Browse Agents** (Discover section) -- remove entirely
- **My Collections** (My Account section) -- remove entirely

### Items to Rename
- **"The Collection"** → **"Travel Marketplace"**

### Items to Keep (no change)
- Travel Marketplace (renamed), My Trips, Messages, Storyboards, Post a Trip, Creator Studio, Available Trips, Collab Opportunities, Partner Bookings, Earnings & Billing section, Professional section, Company section, Admin section (admin-only, already gated), Language selector, Preferences toggle, Sign Out

## Technical Details

### File: `src/components/Header.tsx`

Both the mobile menu (lines 251-566) and desktop menu (lines 619-944) need identical changes:

1. **Quick Access section**: Remove Dashboard and Madison items, keep only Travel Marketplace (renamed)
2. **Discover accordion**: Remove Browse Creators and Browse Agents items, keep Storyboards, Post a Trip, Creator Studio
3. **My Account accordion**: Remove My Collections item, keep My Trips, Messages, and role-specific items
4. **Rename** "The Collection" text to "Travel Marketplace" in both menus

No other files need changes -- Admin section is already gated behind `isAdmin`.

