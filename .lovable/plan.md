

## Tighten Copy-to-CTA Spacing

In `src/components/home/HomeHero.tsx`:

- Change CTA wrapper from `mt-8` (32px) → `mt-8` is already 32px, which matches the request. Looking at the current code, the CTA block uses `mt-8` but it's outside the top `<div>` group (it's a sibling via `justify-between`), so the `mt-8` only applies on mobile when flex doesn't stretch.

The real issue: the CTAs are pushed to the bottom by `justify-between`, creating a large gap. To get exactly 32px between paragraph and CTAs, move the CTA block **inside** the top content group and remove `justify-between`:

1. Move the CTA `<div>` inside the top `<div>` wrapper (after the paragraph)
2. Change left column from `justify-between` to `justify-start` (or just remove `justify-between`)
3. Set CTA wrapper to `mt-8` (32px) — already set, just confirm

Wait — this would break the bottom-alignment with the image card. The user specifically wants 32px gap but also wants the buttons anchored to the bottom from the previous plan.

Better approach: keep `justify-between` but wrap paragraph + CTAs together so they stay connected, while the pill stays at top and the paragraph+CTA group anchors to bottom.

**Changes in `src/components/home/HomeHero.tsx`:**

1. Restructure left column into two groups inside the `justify-between` flex:
   - **Top group**: pill badge only
   - **Bottom group**: headline + paragraph + CTAs (connected as one block)
2. Move headline and paragraph out of the current top `<div>` into a bottom `<div>` along with CTAs
3. Headline: `mt-0` (spacing from pill handled by `justify-between`)
4. Paragraph: `mt-8` (32px below headline)  
5. CTA block: `mt-8` (32px below paragraph — the "handoff")
6. Keep `gap-3` (12px) between the two buttons

This way `justify-between` pushes pill to top and the headline+copy+CTA block to bottom, but within that bottom block, spacing is tight and connected.

