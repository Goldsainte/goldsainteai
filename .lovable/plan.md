

# Convert to Trip: Pre-fill Post-a-Trip with Storyboard Data

## Problem
When a user clicks "Convert to Trip" on a storyboard card, two things are broken:
1. On the TikTokLab StoryboardsPage, the card links to the storyboard detail page instead of `/post-trip?fromStoryboard=ID`
2. When arriving at `/post-trip?fromStoryboard=ID`, the storyboard's images and items are NOT loaded into the StoryboardBuilder on Step 4 — the builder starts empty because the existing TODO on line 64 of `StoryboardBuilder.tsx` was never implemented

## Changes

### 1. `src/pages/TikTokLab/StoryboardsPage.tsx` — Fix "Convert to Trip" click target

The StoryboardCard is currently a `<Link to={/storyboards/${id}}>` with a hover overlay saying "Convert to Trip". The hover overlay needs to intercept the click and navigate to `/post-trip?fromStoryboard=${id}` instead of going to the detail page. The card itself should still link to the detail page for normal clicks (on the top portion).

- Add an `onClick` handler on the "Convert to Trip" overlay that calls `e.preventDefault(); e.stopPropagation(); navigate(/post-trip?fromStoryboard=${id})`
- Import `useNavigate` (wrap the card list in a component or use inline navigation)

### 2. `src/hooks/useStoryboardPrefill.ts` — Include storyboard items in prefill

Currently the hook loads the storyboard via `getStoryboardById` (which already fetches items), but only extracts title/description/tags into `prefill`. The storyboard items are available on `sourceStoryboard.items` but never used.

No changes needed here — `sourceStoryboard` already contains `items`. The consumer (PostTripPage) needs to use them.

### 3. `src/pages/trips/PostTripPage.tsx` — Pass storyboard ID and set it when prefilling from storyboard

When `fromStoryboard` is present:
- Set `storyboardId` state to the storyboard's ID so the StoryboardBuilder knows it's editing an existing board
- Pass `storyboardId={storyboardIdFromQuery || storyboardId}` to StoryboardBuilder on Step 4

Add a `useEffect` that sets `storyboardId` from the query param:
```tsx
useEffect(() => {
  if (storyboardIdFromQuery && !storyboardId) {
    setStoryboardId(storyboardIdFromQuery);
  }
}, [storyboardIdFromQuery]);
```

Update the StoryboardBuilder usage to pass the storyboard ID:
```tsx
<StoryboardBuilder
  storyboardId={storyboardId || undefined}
  mode="traveler"
  ...
/>
```

### 4. `src/components/storyboards/StoryboardBuilder.tsx` — Load existing items when storyboardId is provided

Replace the TODO on line 62-65 with actual loading logic:
```tsx
useEffect(() => {
  if (!storyboardId) return;
  let cancelled = false;

  async function loadItems() {
    const { data, error } = await supabase
      .from("storyboard_items")
      .select("*")
      .eq("storyboard_id", storyboardId)
      .order("position", { ascending: true });

    if (cancelled || error) return;

    const mapped = (data || []).map(item => ({
      id: item.id,
      kind: (item.item_type === "image" ? "photo" : item.item_type) as Item["kind"],
      source: (item.source_type || "manual") as Item["source"],
      data: {
        thumb_url: item.image_url,
        full_url: item.image_url,
        alt: item.title || "Storyboard item",
        title: item.title,
        ...(item.metadata as Record<string, any> || {}),
      },
    }));

    setItems(mapped);
  }

  loadItems();
  return () => { cancelled = true; };
}, [storyboardId]);
```

This ensures that when a user converts a storyboard to a trip, all their saved photos/items appear in the Step 4 builder, pre-populated and ready to submit.

## Files to Edit
1. `src/pages/TikTokLab/StoryboardsPage.tsx` — Fix Convert to Trip click to navigate to `/post-trip?fromStoryboard=ID`
2. `src/pages/trips/PostTripPage.tsx` — Set storyboardId from query param, pass to StoryboardBuilder
3. `src/components/storyboards/StoryboardBuilder.tsx` — Load existing storyboard items when storyboardId is provided

