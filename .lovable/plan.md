# Match "How Goldsainte Works" header to "Why Goldsainte" style

Single edit: `src/sections/HomeLuxurySections.tsx`, header block of `HowGoldsainteWorksSection` (lines ~283-294).

## Replace current left-aligned header
Currently uses a soft-gold "POWERED BY AI" pill and left-aligned heading/subtitle.

## With the exact pattern from `TwoWaysComparison` (lines 97-107)

```tsx
<div className="mx-auto max-w-6xl px-4 text-center mb-12 md:mb-16">
  <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
    How It Works
  </span>
  <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
  <h2 className="font-secondary text-2xl md:text-4xl text-[#0a2225] mb-3">
    How <span className="italic">Goldsainte</span> Works
  </h2>
  <p className="text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
    A curated travel marketplace where travelers discover experiences, creators monetize itineraries, and certified travel agents sell or customize travel packages.
  </p>
</div>
```

Mirrors 1:1: dark-green pill (centered), gold hairline divider, same h2 font/size/color, same subtitle font/size/color, centered with `max-w-2xl mx-auto`. Section background, padding, accordion, image panel, and footer note remain unchanged.

Pill text: "How It Works" (parallel to "Why Goldsainte"). Confirm if you'd prefer different pill copy.
