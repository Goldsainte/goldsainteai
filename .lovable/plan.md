

## Align Image Card with Pill Badge

The pill badge (line 16) sits *outside* the two-column flex container (line 29), with `mb-8 md:mb-10` spacing below it. The two columns then start together via `md:items-start`. The problem is the image card's visual top is pushed down by:

1. The decorative absolute border (`translate-y-4` = 16px visual offset, but doesn't affect flow)
2. The `md:-mt-1` on the right column is only -4px — not enough

To align the image card's top with the pill, the simplest fix is to **move the pill badge inside the two-column flex** so it spans both columns, or **pull the right column up** so the image card visually aligns with the pill.

The cleanest approach: restructure so the pill sits in the same row as the two columns. Move the pill outside the flex container is already done — but the `mb-8 md:mb-10` creates a gap that only the left column's headline respects. The right column needs to start at the same point as the pill.

**Actual fix — pull the right column up by the pill's margin:**

In `src/components/home/HomeHero.tsx`, line 59:

Change `md:-mt-1` to `md:-mt-[72px]` (approximately the pill height ~32px + mb-10 = 40px = 72px) to pull the image card up to align with the pill. But this is fragile.

**Better approach — move the image column to start at the pill level:**

Restructure lines 16–29 so the pill and columns share a single flex layout:

1. Remove the pill from its standalone wrapper (lines 16–26)
2. Wrap the pill + left column content together in the left column
3. Start the right column at the same level as the pill

This means the left column contains: pill → headline → description → CTAs. The right column contains: image card. Both start at the same vertical point via `md:items-start`.

**File: `src/components/home/HomeHero.tsx`**

- Move the pill badge (lines 16–26) inside the left column div (after line 31), making it the first child of the left column
- Remove the standalone pill wrapper and its `mb-8 md:mb-10` margin
- Add `mb-5` to the pill inside the left column to preserve spacing before the headline
- Change right column from `md:-mt-1` back to no negative margin — both columns now naturally align at the top

This way `md:items-start` on the parent flex aligns the pill's top edge with the image card's top edge.

