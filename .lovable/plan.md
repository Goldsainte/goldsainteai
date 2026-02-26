

# Update Storyboard Caption Copy

Two files need updating with the new verbiage.

## 1. `src/i18n/locales/en.json` (lines 86–87)

Replace translation keys:

- `storyboardCaption`: `"Every journey begins with a vision."`
- `storyboardDescription`: `"Save the moments that move you — TikToks, Reels, YouTube clips, images that capture the feeling.\nCreators refine the aesthetic. Advisors design the details.\n\nYou experience the trip long before you ever click Book."`

## 2. `src/components/home/HowItWorksSection.tsx` (lines 117–124)

Replace the hardcoded caption block with:

```tsx
<p className="font-semibold mb-1">
  Every journey begins with a vision.
</p>
<p className="text-xs text-[#E5DFC6]/90 whitespace-pre-line">
  Save the moments that move you — TikToks, Reels, YouTube clips, images that capture the feeling.
Creators refine the aesthetic. Advisors design the details.

You experience the trip long before you ever click Book.
</p>
```

Two files, copy-only changes.

