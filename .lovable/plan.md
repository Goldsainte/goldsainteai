

# Left-Align Bullet Points on Mobile

The section wrapper at line 54 has `text-center` which centers everything including the bullet text. The fix is to make the `FeatureCard` content left-aligned by default (mobile) while keeping the section header centered.

**File:** `src/components/home/TwoWaysComparison.tsx`

**Change 1 (line 31):** Add `text-left` to the FeatureCard wrapper so bullet content is left-aligned on all screens:

`<div className="rounded-2xl border border-[#0c4d47] bg-[#FDF9F0] p-6 md:p-8 text-left">`

This single class addition overrides the parent's `text-center` for the card contents, ensuring bullet points are left-aligned on mobile and desktop.

