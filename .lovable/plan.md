

## Fix: "Failed to save portfolio" — null ID constraint violation

### Problem
When saving new media items that don't have an `id` yet, the upsert sends rows without an `id` field. The `creator_media` table requires a non-null `id`, causing a constraint violation.

### Fix

**`src/pages/creator/components/CreatorPortfolioTab.tsx`** — line 59-60

For new items (no `id`), generate a UUID using `crypto.randomUUID()` so the upsert always has a valid `id`:

```typescript
const rows = media.map((item, idx) => ({
  id: item.id || crypto.randomUUID(),
  user_id: user.id,
  // ...rest stays the same
}));
```

This is the only change needed — one line replacement.

