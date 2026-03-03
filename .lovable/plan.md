

## Add Micro-Motion to Intro Screen

**File: `src/pages/trips/PostTripPage.tsx`** — lines 442–506

### Animations to add (all CSS-driven via inline styles, no new dependencies)

**1. Headline slides up + fades in** (0ms delay)
- `opacity: 0 → 1`, `translateY(20px) → 0` over 600ms ease-out

**2. Subline fades in** (200ms delay)
- Same upward fade, slightly delayed

**3. Step rows stagger in sequentially** (300ms base + 100ms × index)
- Each step fades up from `translateY(12px)` with increasing delay
- Creates a cascading "reveal" effect — momentum, not static

**4. Reassurance line fades in** (after last step, ~1000ms delay)

**5. CTA pulses with subtle gold glow**
- Add `shadow-[0_0_20px_rgba(199,169,98,0.4)]` on load after steps finish (~1100ms delay)
- Fade-up entrance + a gentle repeating glow animation via inline keyframes or tailwind `animate-gold-pulse` (already exists in config)

**6. Soft background shimmer** (optional, lightweight)
- A very subtle radial gradient that shifts position slowly — adds depth without distraction
- Implemented as a pseudo-element or a positioned div with CSS animation

### Implementation approach
- Use inline `style` props with `animation` and `animationDelay` for staggered timing — no state management needed
- Wrap each animated element in a style that starts `opacity: 0` and uses `animation-fill-mode: forwards`
- Reuse existing `fade-up` keyframe from tailwind config, add a new `glow-pulse` keyframe for the CTA
- Add the `glow-pulse` keyframe to `tailwind.config.ts` if needed, or use inline style

### No structural changes
Same layout, same copy, same logic. Only motion added.

