

# Fix Hero Layout: Back Button & Status Badge Collision

## Problems

From your screenshots:

1. **"← Back to trip requests" and "Open Request" are visually side-by-side** — they're both inside the hero overlay at the bottom-left. On wider screens they render on the same visual line, making them look like one confusing element.
2. **The back button is nearly invisible** — it uses `text-white/70` over the hero image. On lighter parts of the image (like the sky in your Bali temple screenshot), it becomes an unreadable white blob. That's the "all white button" you can't read.

## Fix

**File:** `src/pages/marketplace/TripRequestDetail.tsx`

### 1. Move back button OUT of the hero image
- Place it above the hero as a normal page-level navigation element on a white background, like the TripDetailPage does (`← Back to trips` above the hero).
- Uses dark text on white — always readable.

### 2. Keep status badge in the hero
- The "Open Request" pill with the green dot stays in the hero overlay — that's fine and contextual there.

### 3. Result

```text
┌─────────────────────────────────────────┐
│  ← Back to trip requests                │  ← white bg, dark text, always readable
├─────────────────────────────────────────┤
│                                         │
│  [HERO IMAGE]                           │
│                                         │
│  ● Open Request                         │  ← status pill stays in hero
│  Fun                                    │
│  📍 Germany  📅 4/4 – 4/10  👥 2        │
└─────────────────────────────────────────┘
```

| File | Change |
|------|--------|
| `src/pages/marketplace/TripRequestDetail.tsx` | Move back button above the hero into its own `div` with white background and dark text. Remove it from inside the hero overlay. |

