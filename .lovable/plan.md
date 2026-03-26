

## First-Time User Onboarding for Discovery Pages

### What Gets Built

1. **Welcome modal** for first-time visitors to the discovery/creator pages
2. **3-step guided tooltips** after modal dismissal (category pills → image grid → save button)
3. **Persistent inline instruction bar** ("Browse → Save → Build your trip")
4. **Empty storyboard state** with CTA
5. **Save feedback animation** + toast
6. **Milestone nudge** after saving 2-3 images

---

### 1. Discovery Welcome Modal — `src/components/discovery/DiscoveryWelcomeModal.tsx` (New)

First-time-only modal (keyed on `localStorage: goldsainte_discovery_onboarded`). Shows:
- Title: "Plan your next trip visually"
- Subtitle explaining the loop
- 3 visual steps with icons (Compass/Explore, Bookmark/Save, Map/Plan)
- CTA: "Start Exploring" → dismisses modal, triggers tooltip tour
- Styled in the existing Goldsainte cream/gold palette

### 2. Discovery Tooltip Tour — `src/components/discovery/DiscoveryTooltipTour.tsx` (New)

Lightweight 3-step tooltip sequence using `react-joyride` (already installed). Targets:
- `[data-tour="category-pills"]` → "Start here: choose a travel vibe"
- `[data-tour="discovery-grid"]` → "Click any image to explore more like this"
- `[data-tour="save-button"]` → "Save images to build your trip"

Triggered after welcome modal dismisses. Sets `localStorage: goldsainte_discovery_toured`.

### 3. Inline Instruction Bar

Add a subtle bar inside `CreatorPinterestFeed.tsx` below the refinement chips:
```text
Browse → Save → Build your trip
```
Small text, cream background, dismissible via × button (persisted to localStorage).

### 4. Empty Storyboard State

In `DiscoveryFeed.tsx`, when user has no storyboards and no saved pins, show an empty state card:
- "You haven't created a trip yet"
- "Save images to start building your travel storyboard"
- CTA: "Create Your First Storyboard" → opens `SaveToStoryboardModal` in create-new mode

### 5. Save Feedback Animation

In `SaveToStoryboardModal.tsx`, after successful save:
- Add a brief scale+check animation on the saved board row
- The existing `toast.success("Saved to storyboard!")` stays
- Add a subtle bookmark fill animation on the save button in `DiscoveryFeed.tsx` (button briefly turns gold with a scale pulse)

### 6. Milestone Nudge — `src/hooks/useDiscoveryMilestone.ts` (New)

Track saves in session via a simple counter in React state/context. After 3 saves, show a toast/banner:
- "You're building your trip — Keep going or start planning now"
- CTA: "Start Your Trip" → navigates to `/post-trip`
- Only shown once per session

### 7. Data Tour Attributes

Add `data-tour` attributes to existing elements:
- `RefinementChips.tsx`: `data-tour="category-pills"` on the category row
- `DiscoveryFeed.tsx`: `data-tour="discovery-grid"` on the masonry container, `data-tour="save-button"` on the first visible save button

---

### Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/components/discovery/DiscoveryWelcomeModal.tsx` | First-time welcome modal with 3-step visual |
| Create | `src/components/discovery/DiscoveryTooltipTour.tsx` | 3-step Joyride tooltip tour |
| Create | `src/hooks/useDiscoveryMilestone.ts` | Session save counter + milestone nudge |
| Edit | `src/components/creator/CreatorPinterestFeed.tsx` | Add welcome modal, tooltip tour, inline instruction bar |
| Edit | `src/components/discovery/DiscoveryFeed.tsx` | Add data-tour attrs, empty state, save animation |
| Edit | `src/components/discovery/RefinementChips.tsx` | Add data-tour attr on category row |
| Edit | `src/components/discovery/SaveToStoryboardModal.tsx` | Add save animation feedback, milestone counter |

