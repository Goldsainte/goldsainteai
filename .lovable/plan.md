

## Above-the-Fold Hero: Viewport-Constrained Layout

Header is `h-16 md:h-14` (56px on desktop). The hero needs to fill exactly the remaining viewport.

### Changes in `src/components/home/HomeHero.tsx`

**1. Section: viewport height constraint**
- Add `md:min-h-[calc(100vh-56px)] md:max-h-[calc(100vh-56px)]` to the `<section>`
- Change padding from `py-16 md:py-24` → `py-10 md:py-12` (48px top/bottom)

**2. Inner container: fill available height**
- Add `md:h-full` to the `max-w-6xl` wrapper so the grid can stretch vertically within the viewport

**3. Grid: fill height**
- Add `md:h-full` to the grid container so both columns stretch to fill

**4. Headline: tighter line-height**
- Change `leading-snug` → `leading-tight` (~1.1 line-height)
- Reduce desktop size: `lg:text-[42px]` → `lg:text-[38px]`

**5. CTA block: tighter spacing**
- Change `gap-4 mt-12` → `gap-3 mt-8` (12px between buttons, 32px above block)
- Reduce button padding: `py-3` → `py-2.5` on both buttons

**6. Right image card: max-height constraint**
- Add `md:max-h-[calc(100vh-56px-96px)]` to the right column wrapper so the card never pushes below fold
- Images already use `h-full w-full object-cover` — no change needed

**7. Caption card: slightly tighter**
- Change `mt-3 py-3` → `mt-2 py-2` to save ~8px

### Result
The entire hero — pill, headline, copy, both CTAs, full image card with caption — fits within the viewport on standard laptops (1366×768, 1440×900, 1920×1080) without scrolling.

