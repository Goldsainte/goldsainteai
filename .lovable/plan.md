

## Add Intro Screen Before the 6-Step Post Trip Flow

Great idea — an introductory screen like Airbnb's "It's easy to get started" would set expectations, reduce anxiety, and make the 6-step form feel approachable.

### Design

A full-page intro screen shown before step 1, using the Goldsainte luxury design language. Layout inspired by the Airbnb reference: large serif heading on the left ("It's easy to post your dream trip on Goldsainte AI"), numbered steps on the right summarizing all 6 steps with short descriptions. A "Get Started" CTA button at the bottom.

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ← Back                                             │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │                 │  │ 1  Where you're going     │  │
│  │  Six easy steps │  │    Destination & dates    │  │
│  │  to posting     │  │ ─────────────────────     │  │
│  │  your dream     │  │ 2  Who's coming along     │  │
│  │  trip on        │  │    Travelers & budget     │  │
│  │  Goldsainte AI  │  │ ─────────────────────     │  │
│  │                 │  │ 3  Set the mood           │  │
│  │                 │  │    Style & pace           │  │
│  │                 │  │ ─────────────────────     │  │
│  │                 │  │ 4  Build your brief       │  │
│  │                 │  │    Photos & inspiration   │  │
│  │                 │  │ ─────────────────────     │  │
│  │                 │  │ 5  Final details          │  │
│  │                 │  │    Notes & preferences    │  │
│  │                 │  │ ─────────────────────     │  │
│  │                 │  │ 6  Review & post          │  │
│  └─────────────────┘  │    Confirm & submit       │  │
│                       └──────────────────────────┘  │
│                                                      │
│                        [ Get Started → ]             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Changes

**`src/pages/trips/PostTripPage.tsx`**:
- Add a `showIntro` state (default `true`)
- When `showIntro` is true, render the intro screen instead of the form
- Clicking "Get Started" sets `showIntro = false`, revealing the existing step 0
- The intro screen uses the same cream background, serif heading, Goldsainte green accents, and gold CTA
- Each of the 6 steps listed maps to the existing `stepMeta` titles with brief one-line descriptions
- Include a back button that navigates to the previous page
- Skip the intro if arriving with prefill params (storyboard, itinerary, or direct request) to avoid friction

Single file change — no new components or routes needed.

