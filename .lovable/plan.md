

# Traveler Briefs Not Showing — Root Cause & Fix

## Problem

The database has 8 open trip requests, but the marketplace shows "No traveler briefs yet."

## Root Cause

The query in `Marketplace.tsx` uses this join:

```typescript
profiles!trip_requests_user_id_fkey(full_name, avatar_url)
```

But the foreign key `trip_requests_user_id_fkey` points to **`auth.users`**, not `public.profiles`. PostgREST cannot resolve this join hint, so the entire query fails silently (or returns an error that gets swallowed), resulting in zero results.

## Fix

### File: `src/pages/Marketplace.tsx`

Remove the FK hint from the profiles join. Since `trip_requests.user_id` and `profiles.id` share the same UUID values, PostgREST can infer the relationship if there's a FK from profiles to auth.users — but the safest approach is to drop the explicit hint and let PostgREST auto-detect via column name matching:

```typescript
.select(`
  *,
  profiles(full_name, avatar_url),
  trip_proposals(count)
`)
```

If PostgREST still can't infer the join (because there's no direct FK between `trip_requests` and `profiles`), we fall back to fetching profiles separately after the main query — similar to what `tripRequestsService.ts` already does.

### Fallback approach (if the implicit join doesn't work)

Fetch trip requests without the profiles join, then batch-fetch profiles by user_id:

```typescript
const { data, error } = await supabase
  .from("trip_requests")
  .select(`*, trip_proposals(count)`)
  .eq("status", "open")
  .order("created_at", { ascending: false });

// Then fetch profiles for all unique user_ids
const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, full_name, avatar_url")
  .in("id", userIds);

// Merge profiles into requests
```

This mirrors the pattern already used in `tripRequestsService.ts` (lines 68-75).

## Files to Edit

| File | Change |
|---|---|
| `src/pages/Marketplace.tsx` | Fix the profiles join in the `trip-requests-unified` query — remove the broken FK hint or switch to a two-step fetch |

Single file, single query fix. No database changes needed.

