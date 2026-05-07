## Goal
Make the three signature animations on the "How Goldsainte Works" section truly mobile-optimized: legible at 360–414px, no edge clipping, no SVG distortion, performant (paused off-screen, respects reduced-motion).

## Files
- `src/components/home/TravelerDiscoveryMagic.tsx`
- `src/components/home/CreatorAIMagic.tsx`
- `src/components/home/AgentProposalMagic.tsx`
- `src/sections/HomeLuxurySections.tsx` (right panel wrapper, optional padding tweaks)

## Changes

### 1. Canvas sizing (all three)
- Replace `h-[300px] md:h-[460px]` with `h-[340px] sm:h-[400px] md:h-[460px]`.
- Add internal safe-area padding on mobile (`px-4 sm:px-5`) so cards don't kiss the edges.

### 2. Inner card widths
- Convert fixed `w-[180px]`, `w-[200px]`, `max-w-[300px]`, `max-w-[320px]` to fluid + cap:
  - `w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px]`.
- Keep phone mockup in CreatorAIMagic at `w-[170px] sm:w-[190px] md:w-[200px]`.

### 3. Typography legibility
- Bump all `text-[8px]` / `text-[8.5px]` / `text-[9px]` to `text-[10px] md:text-[9px]` (slightly larger on mobile, same on desktop) — minimum readable size on phones is ~10px.
- Headline cards (`text-[12–14px]`) gain `sm:` upscale where they currently don't.

### 4. SVG connectors
- Change `preserveAspectRatio="none"` to `preserveAspectRatio="xMidYMid meet"` on connector SVGs in TravelerDiscoveryMagic and AgentProposalMagic so curves don't distort when canvas height shrinks.
- Where lines are decorative-only and stretching is acceptable, keep `none` but verify visually.

### 5. Floating chip positions
- Re-anchor absolute chips that overlap on the 340px canvas:
  - Use `bottom-3 sm:bottom-12` style breakpoint pairs so chips sit inside the shorter mobile frame.

### 6. Performance / motion guards
- Add a small shared hook `useInViewAndMotion` (or inline) in each component:
  - Use `IntersectionObserver` to add a `data-paused="true"` attr when off-screen; pause CSS animations via `[data-paused="true"]_*:!animate-none` utility, OR conditionally render scenes only when in view.
  - Respect `prefers-reduced-motion: reduce` — if true, render the final frame statically (skip looped scene cycling).

### 7. Wrapper panel (HomeLuxurySections)
- Right panel wrapper (`max-w-md`) — add `mx-auto px-2 sm:px-0` to prevent edge contact on small phones.
- Reduce decorative offset frame on mobile: `translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3`.

## Out of scope
- No copy changes, no animation choreography rewrites, no new visuals.
- No changes to the accordion behavior or tab data.

## Verification
- Test viewports: 360, 390, 414, 768, 1280.
- For each tab (Travelers, Creators, Agents): confirm no horizontal overflow, all text readable, chips inside frame, SVG curves smooth, animations pause when scrolled away, static final frame when reduced-motion is enabled.
