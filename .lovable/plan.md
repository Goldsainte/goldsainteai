

# Simplify the Post a Trip Page

## The Problem
The current `/post-trip` page shows every field at once in one long scrolling form — 6+ sections, 15+ inputs, pill selectors, textareas, and a storyboard builder all stacked together. It feels like a generic admin form, not a luxury editorial experience.

## The Solution: Multi-Step Wizard with Editorial Pacing

Replace the single long form with a clean, stepped wizard that shows one section at a time. Each step gets its own full screen with generous whitespace, serif headers, and a progress indicator — matching the calm, editorial pacing of Mr & Mrs Smith.

### Step Flow

```text
Step 1: "Where are you dreaming of?"
   - Destination input
   - Start & end dates
   - Trip nickname (optional)

Step 2: "Who's coming along?"
   - Adults & children
   - Occasion (optional)
   - Budget range + budget style pills

Step 3: "Set the mood"
   - Accommodation style
   - Trip pace pills
   - Interest pills (Food & wine, Design hotels, etc.)
   - Aesthetic tags (if from storyboard)

Step 4: "Anything else?"
   - Flexibility textarea
   - Special notes textarea
   - Who should respond (creator/agent/both) pills

Step 5: "Review & post"
   - Clean summary card of all selections
   - Trust & safety note (condensed to one line + link)
   - Submit button
```

The storyboard builder is moved out of the main flow — it becomes an optional "Add visual storyboard" expandable section on the review step, so it doesn't overwhelm first-time users.

### Design Details

**Layout per step:**
- Centered column, max-w-2xl (narrower than current max-w-6xl)
- Serif heading (font-secondary, text-2xl) as the step question
- Short subtitle in muted text
- Generous vertical padding (py-16 on desktop)
- Inputs remain cream-background with gold-focus borders

**Progress indicator:**
- Minimal dot stepper at top (5 dots, active = dark teal, completed = gold)
- Step count text: "Step 2 of 5" in small muted text

**Navigation:**
- "Back" and "Continue" buttons at bottom, pill-shaped
- Back = ghost style, Continue = dark teal filled
- Keyboard: Enter advances to next step

**Animations:**
- Simple fade transition between steps (CSS only, no library needed)

### Technical Approach

**File: `src/pages/trips/PostTripPage.tsx`** — Full rewrite
- All existing state variables remain unchanged
- Form submission logic stays identical
- Wrap content in a step state machine (useState for currentStep 1-5)
- Each step rendered conditionally
- Prefill logic (storyboard, AI collection) still works on mount
- StoryboardBuilder moved to an expandable section in step 5

No new files needed — this is a layout restructure of the existing page, not new components.

### What Gets Removed/Simplified
- The "Build your visual storyboard" section no longer dominates the form — becomes optional on review step
- Trust & safety block condensed from a full card to a single line with "View safety guidelines" link
- AI itinerary preview becomes a collapsible on the review step instead of mid-form
- Bottom disclaimer text shortened

### What Stays the Same
- All form fields and their values
- Form submission to `trip_requests` table
- Storyboard and itinerary prefill hooks
- All state management
- Route and auth requirements

