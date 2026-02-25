

# Fix Storyboard Cards to Match Airbnb-Style Grid

## Problem
The storyboard cards on My Storyboards page use a dark teal gradient placeholder with a small icon when there's no cover image. This looks nothing like the Airbnb-style cards used on the homepage and marketplace (clean aspect-[4/3] images, metadata below, no dark overlays).

## Root Cause
1. `cover_image_url` is null for most storyboards because users rarely set an explicit cover
2. The card uses a dark gradient fallback instead of pulling the first item's image
3. The card layout (fixed `h-36` height, dark gradient) doesn't match the Airbnb pattern used elsewhere

## Changes

### 1. `src/pages/TikTokLab/StoryboardsPage.tsx` — Fetch first item image as cover fallback

In the `load()` function, after fetching storyboards, for any storyboard without a `cover_image_url`, fetch the first `storyboard_item` with an `image_url` to use as the cover. This mirrors what the TravelerStoryboardsTab already does with item counts.

```tsx
// After mapping storyboards, enrich with first-item image
const enriched = await Promise.all(
  mapped.map(async (sb) => {
    if (sb.cover_image_url) return sb;
    const { data: firstItem } = await supabase
      .from("storyboard_items")
      .select("image_url")
      .eq("storyboard_id", sb.id)
      .not("image_url", "is", null)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    return { ...sb, cover_image_url: firstItem?.image_url || null };
  })
);
setStoryboards(enriched);
```

### 2. `src/pages/TikTokLab/StoryboardsPage.tsx` — Redesign `StoryboardCard` to Airbnb style

Replace the current card layout with the same pattern used in `LiveTripCard`, `StoryboardsHighlight`, and `RoleSpecificCTAs`:

- **Image**: `aspect-[4/3]` with `rounded-xl md:rounded-2xl`, clean image with no dark gradient overlay. When no image exists, show a cream placeholder with a subtle icon.
- **Metadata below image**: Title as `text-sm font-medium`, description as muted text, tags as small pills — all in a clean section below the image (not overlaid).
- **Item count badge**: Small pill in top-right corner of the image area (matching the current badge style).
- **Convert to Trip**: Keep the hover slide-up CTA bar.
- **Grid**: Change to `grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` for 4-column on large screens.

```tsx
function StoryboardCard({ storyboard }: { storyboard: Storyboard }) {
  const navigate = useNavigate();
  return (
    <Link to={`/storyboards/${storyboard.id}`} className="group cursor-pointer space-y-2.5">
      {/* Clean image — Airbnb style */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
        {storyboard.cover_image_url ? (
          <img
            src={storyboard.cover_image_url}
            alt={storyboard.title || "Storyboard"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[#F0EBE0] flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-[#C7A962]/30" />
          </div>
        )}
        {/* Item count badge */}
        {storyboard.item_count > 0 && (
          <span className="absolute top-2.5 right-2.5 ...">
            {storyboard.item_count} items
          </span>
        )}
        {/* Convert to Trip hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 ..." onClick={...}>
          Convert to Trip →
        </div>
      </div>
      {/* Metadata below image */}
      <div className="space-y-1 px-0.5">
        <h3 className="text-sm font-medium line-clamp-1">{storyboard.title || "Untitled"}</h3>
        {storyboard.description && <p className="text-xs text-[#6B7280] line-clamp-1">...</p>}
      </div>
    </Link>
  );
}
```

### Files to Edit
- **`src/pages/TikTokLab/StoryboardsPage.tsx`** — Both the data fetching (add first-item image fallback) and the card component (Airbnb-style layout)

No database changes needed.

