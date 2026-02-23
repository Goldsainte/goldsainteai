
# Fix: Storyboard Photos Not Persisting After Auth Redirect

## Root Cause

When a traveler builds a storyboard during the trip posting flow, here is what happens:

1. They add ~15 photos in the StoryboardBuilder (Step 4)
2. They click "Save storyboard"
3. If they are NOT logged in, the builder saves items to browser sessionStorage and returns a placeholder ID of `"pending-auth"`
4. They proceed through the rest of the form and hit Submit
5. The form redirects them to login, saving form state (including `storyboardId: "pending-auth"`) to sessionStorage
6. After login, the form restores from sessionStorage -- but **never recreates the storyboard in the database**
7. On submit, it tries to link `storyboard.id = "pending-auth"` which does not exist
8. Result: zero storyboards, zero storyboard items in the database

Even when the user IS logged in, there is a second issue: the user might add photos but not click "Save storyboard" before proceeding to the next step, losing everything.

**Current state:** The `storyboards` table has 0 rows. The `storyboard_items` table has 0 rows. The Amalfi Coast trip has `source_metadata: { source_storyboard_id: "pending-auth" }`.

## The Fix

### 1. Restore pending storyboard after auth redirect (`PostTripPage.tsx`)

After login, when the form detects `storyboardId === "pending-auth"`, check sessionStorage for the saved storyboard data (`goldsainte:pendingStoryboard`). If found:
- Create the storyboard in the database (insert into `storyboards`)
- Insert all saved items into `storyboard_items`
- Update `storyboardId` state with the real database ID
- Clear the sessionStorage entry

### 2. Auto-save storyboard when leaving Step 4 (`PostTripPage.tsx`)

When the user clicks "Next" on Step 4 (the storyboard step), if they have added items but haven't saved yet, automatically trigger the save. This prevents data loss from users who add photos but forget to click "Save storyboard."

### 3. Fix the StoryboardBuilder guest save to preserve full item data (`StoryboardBuilder.tsx`)

The current guest save only stores `{ title, items }`. Ensure it stores the complete item data structure so everything can be faithfully restored after login.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/trips/PostTripPage.tsx` | Add post-auth storyboard restoration logic; auto-save on step transition |
| `src/components/storyboards/StoryboardBuilder.tsx` | Expose a `save()` method via ref or callback so PostTripPage can trigger saves; improve guest data persistence |

## What This Solves

- The ~15 Amalfi Coast photos (and any future storyboard) will actually persist to the database
- The storyboard will be properly linked to the trip request via `trip_request_id`
- The `TripStoryboardViewer` on the marketplace detail page will display the photos
- Works for both logged-in users (auto-save on step change) and guest users (restore after auth)
