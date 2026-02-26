

# Polish Storyboard Page Copy & Microcopy

## Changes — all in `src/pages/TikTokLab/StoryboardsPage.tsx`

### 1. Update subtitle copy (lines 141–143)

Replace the current one-liner with the fuller strategic framing:

**From:**
```
Create your travel vision. When you're ready, turn it into a trip request.
```

**To:**
```
Plan visually. Post confidently.
```

Plus add a second line of descriptive copy below it:
```
Save hotels, restaurants, destinations, and experiences into a private board. When you're ready, turn your storyboard into a trip request and receive proposals from trusted creators and travel agents.
```

This communicates the full arc: visual → actionable → marketplace.

### 2. Rename CTA button (lines 200–203)

**From:** `Create New Storyboard`
**To:** `Start a Trip Board`

Feels like momentum rather than a mechanical tool action.

### 3. Add microcopy under tabs (after line 216)

Insert a subtle privacy clarifier below the TabsList:

```tsx
<p className="text-[11px] text-[#9CA3AF]">
  Your boards are private until you choose to post them.
</p>
```

This removes ambiguity about visibility and builds trust.

### 4. Update accent label (line 136)

Keep "Your Travel Planning Board" as-is — it already works well with the new copy.

### Summary

| What | Lines | Action |
|------|-------|--------|
| Subtitle copy | 141–143 | Rewrite to two-part copy |
| CTA button text | 200–203 | Rename to "Start a Trip Board" |
| Privacy microcopy | After 216 | Insert under tabs |

Single file, copy-only changes. No logic or structural changes needed.

