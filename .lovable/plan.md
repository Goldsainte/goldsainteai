

## Add Admin Delete Button to Trip Request Grid Cards

### Changes

**File: `src/components/marketplace/TripRequestGrid.tsx`**

1. Accept new props: `isAdmin` boolean and `onDelete(id: string)` callback
2. When `isAdmin` is true, render a `Trash2` icon button in the top-right corner of each card's image area (absolute positioned, visible on hover)
3. The button calls `e.stopPropagation()` to prevent card navigation, then calls `onDelete(request.id)`
4. Wrap the delete action in an `AlertDialog` for confirmation before deletion

**File: Parent marketplace page that renders `TripRequestGrid`** (need to identify which page passes requests)

1. Import `useUserRole` to get `isAdmin`
2. Add a `handleDeleteRequest` function that:
   - Calls `supabase.from("trip_requests").delete().eq("id", id)`
   - Shows toast on success/error
   - Removes the deleted request from local state
3. Pass `isAdmin` and `onDelete={handleDeleteRequest}` to `TripRequestGrid`

### Implementation Details

- Delete icon: small `Trash2` button with `absolute top-2 right-2`, white/red styling, only shown when `isAdmin && group-hover`
- Confirmation dialog reuses existing `AlertDialog` component
- Deletion already works server-side (RLS policy from prior migration allows admin deletes)

