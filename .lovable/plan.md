

## Animated Progress Tease — Hover Previews for Each Step

This is a strong idea. Each step reveals a small visual vignette on hover, turning the list from static text into an interactive preview of what's coming. It creates curiosity and makes the screen feel like a product, not a form.

### Proposed visual for each step

| Step | Hover Visual | Implementation |
|------|-------------|----------------|
| 1. Choose your destination | Animated globe/pin icon that pulses + a subtle dotted arc path | SVG with CSS animation |
| 2. Add traveler details | Two-three small avatar circles that slide in and overlap | Styled divs with staggered slide-in |
| 3. Set the style & pace | Color palette swatches that fan out like cards | Small colored rectangles with rotate transform |
| 4. Create your storyboard | Mini polaroid-style image stack that shuffles | 3 layered divs with rotation + shadow |
| 5. Set pricing & dates | Mini calendar grid with a price tag that fades in | Simple CSS grid + badge |
| 6. Review & post | Miniature trip card that scales up from nothing | Scaled-down version of trip card shape |

### Technical approach

**In `src/pages/trips/PostTripPage.tsx`:**

- Add a `hoveredStep` state (`number | null`)
- Each step row gets `onMouseEnter` / `onMouseLeave` handlers
- To the right of each step title (or in a dedicated column), render a small (80×60px) animated vignette component that appears on hover with a scale+fade transition
- All visuals are pure CSS/SVG — no images, no external assets
- Each vignette is a small self-contained component (inline or extracted) using Tailwind classes and minimal inline SVG
- On mobile (touch), the vignettes could show briefly on tap or be hidden entirely to keep the screen clean

### Layout adjustment

The current step rows are single-column text. Add a fixed-width slot (w-20) at the end of each row for the vignette. On hover, the vignette scales from 0.8 to 1 with opacity 0→1 over 200ms. On mouse leave, it fades out.

```text
[ 1  Choose your destination          [🌍 vignette] ]
[ 2  Add traveler details             [👥 vignette] ]
```

### No new dependencies
Pure CSS animations + inline SVG. Reuses existing `fade-up` and transition utilities.

