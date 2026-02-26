

# Tighten Storyboard Cards & Page Polish

## Changes — all in `src/pages/TikTokLab/StoryboardsPage.tsx`

### 1. Remove duplicate actions on cards — keep ONE CTA

The hover "Convert to Trip" overlay AND the persistent "Post to Marketplace" link are redundant. Remove the hover overlay entirely. Keep only the persistent link, renamed to "Post to Marketplace →" (already done). This gives one clear action per card.

**Lines 281–292** — delete the entire hover CTA div.

### 2. Rename any remaining "Convert to Trip" references

Already handled by removing the hover overlay. The only card CTA becomes "Post to Marketplace →" (line 324), which is already correct.

### 3. Elevate subtitle tone

**Line 141** — change from:
`Create a visual board. Post when ready.`
to:
`Create your travel vision. When you're ready, turn it into a trip request.`

### 4. Add status badge + "last edited" metadata to cards

Add a `Draft` badge (top-left of card image) and a relative timestamp ("Edited 3 days ago") below the title. This makes cards informative at a glance.

- Badge logic: show "Draft" for all cards currently (future: "Live" if `is_public` is true or linked to a marketplace post). Uses a simple styled `<span>`.
- Relative time: use `date-fns` `formatDistanceToNow` on `created_at`.

**In StoryboardCard**, after the item count badge (line 279), add:
```tsx
<span className="absolute top-2.5 left-2.5 rounded-full bg-white/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
  Draft
</span>
```

**Below the description** (after line 305), add:
```tsx
<p className="text-[11px] text-[#9CA3AF]">
  Edited {formatDistanceToNow(new Date(storyboard.created_at), { addSuffix: true })}
</p>
```

Requires adding `import { formatDistanceToNow } from "date-fns"` at top.

### 5. Redesign empty state to feel inspiring

Replace the current minimal empty state with a warmer, more editorial design:
- Larger visual area with a gradient or subtle illustration
- Headline: "Your first storyboard starts here"
- Copy: "Pin destinations, hotels, and moments that inspire you. When the vision is clear, post it as a trip request."
- Prominent CTA button
- A secondary subtle link: "or browse inspiration →" that switches to the inspiration tab

### Summary of lines affected

| What | Lines | Action |
|------|-------|--------|
| Add `date-fns` import | 1 | Add import |
| Subtitle text | 141 | Edit |
| Hover CTA overlay | 281–292 | Delete |
| Draft badge on card | After 279 | Insert |
| Edited timestamp | After 305 | Insert |
| Empty state redesign | 334–352 | Rewrite |

Single file change. No database or routing changes needed.

