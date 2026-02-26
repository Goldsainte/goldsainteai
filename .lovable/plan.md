

# Alternate Bullet Row Backgrounds in FeatureCard

In `src/components/home/TwoWaysComparison.tsx`, the alternating row currently uses `bg-[#FAF7F0]` which is very close to the card's `bg-[#FDF9F0]` background — making the alternation nearly invisible.

**Change (line 40):** Update the alternating row background from `bg-[#FAF7F0]` to `bg-white` so every other row clearly stands out against the cream card background.

**Before:** `i % 2 === 1 ? "bg-[#FAF7F0]" : ""`
**After:** `i % 2 === 1 ? "bg-white" : ""`

Single line change, affects both cards since they share the `FeatureCard` component.

