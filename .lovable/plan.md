

## Update Traveler Welcome Modal Copy & Color Palette

### File: `src/components/OnboardingWelcomeModal.tsx`

**Copy changes (traveler block, lines 20-28):**
- Title → `"Welcome to your private Goldsainte studio."`
- Bullets → 3 items: `"Share your vision."`, `"Review curated proposals from trusted experts."`, `"Confirm your trip with discretion and protection."`
- CTA label → `"Begin Your Journey"`, href stays `/traveler`
- Add a `subtitle` variable for traveler: `"This is where your next journey is thoughtfully designed."`

**Remove casual greeting (lines 82-84):**
- Delete the `"Hi {name}, welcome in."` paragraph entirely
- Add subtitle line below the title instead: `<p>` with `text-[#7A7151]` styling

**Update footer text (line 114):**
- Replace `"You can always find this view again from your dashboard."` → `"Your studio remains here whenever you return."`

**Color palette fix — match GS design system:**
- CTA button: change from dark `bg-[#0a2225]` to GS green `bg-[#0c4d47]` with `text-[#FDF9F0]` and hover `hover:bg-[#0c4d47]/90`
- Bullet card dots: change from `bg-[#C7B892]` to gold `bg-[#C7A962]`
- Badge: keep current styling (already matches)

**No structural/layout changes.** Creator and agent copy remain unchanged.

