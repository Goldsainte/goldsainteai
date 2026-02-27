

# Elevate Auth Page to Match Luxury Aesthetic

## Changes to `src/pages/Auth.tsx`

### 1. Remove TikTok and Apple sign-in
- Remove `handleTikTokSignIn` and `handleAppleSignIn` functions (lines 436-467)
- Remove TikTok and Apple buttons from the email step (lines 684-714)
- Keep only Google and Facebook

### 2. Elevate the visual design
- **Background**: Add a subtle full-bleed travel hero image or soft gradient texture behind the card, replacing the flat `bg-[#FDF9F0]`. Use a split layout on desktop: left side with an editorial travel image (Unsplash, fixed), right side with the auth card
- **Card**: Increase padding, use `rounded-[2rem]` with a softer shadow (`shadow-xl shadow-black/5`), add subtle inner glow
- **Logo**: Increase size from `h-12 w-12` to `h-14 w-14`, add breathing room below
- **Typography**: Use `font-secondary` (Playfair Display) for headings at larger size, add refined subtitle copy with more letter-spacing
- **Social buttons**: Refine to pill-shaped (`rounded-full`), lighter border (`border-[#E8E2D0]`), subtle hover lift with `transition-all hover:shadow-sm hover:-translate-y-0.5`
- **OR divider**: Use a thinner gold line with smaller "or" text
- **Email input**: `rounded-xl` with softer focus ring
- **CTA button**: Already using GS green rounded-full — keep, but ensure consistent height
- **Footer links**: More refined spacing, slightly larger touch targets
- **Mobile**: Full-screen card without the split image, card fills viewport width with generous padding

### 3. Desktop split-layout
- On `md:` and up, show a two-column layout: left column is a full-height luxury travel photo (from Unsplash, hardcoded editorial image), right column is the auth card centered vertically
- On mobile, hide the image column and show only the card

### Files modified
- `src/pages/Auth.tsx` — remove TikTok/Apple, add split layout, elevate styling

