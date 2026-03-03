

## Fix: Align Image Stack with Headline

The pill badge sits above the two-column flex container (line 16–26), so both columns already share the same vertical start. The issue is the image wrapper's `relative` container with the decorative offset border (`translate-x-4 translate-y-4`) — this doesn't affect flow, so it's not the cause.

The real culprit: the `mx-auto max-w-md` wrapper (line 60) centers the image block horizontally but doesn't push it up. However, the `p-3` padding and the decorative border's `translate-y-4` create visual offset. The left column's `space-y-5` starts directly with the `h1`, while the right column has a `relative` wrapper adding visual weight above.

**Fix in `src/components/home/HomeHero.tsx`:**

1. **Line 31** — Remove the left column's top slack so it truly starts at the same point. Currently fine since `space-y-5` only adds gaps *between* children.

2. **Line 59** — The right column wrapper needs no extra top margin. But the decorative border offset (`translate-y-4`) visually pushes the card down by 16px while the border itself appears shifted. To compensate and align the *visible* top edge of the image card with the headline, add a small negative top margin to the right column:

```tsx
// Line 59: add -mt-1 on md to nudge the image container up slightly
<div className="w-full md:w-[48%] md:-mt-1">
```

Alternatively, a cleaner approach — remove `mx-auto` from the inner wrapper since it's already constrained by the 48% column, which may be adding subtle centering offset:

```tsx
// Line 60: remove mx-auto, keep max-w-md
<div className="relative max-w-md">
```

Both are minor nudges. The `md:items-start` from the last edit is correct and should stay.

