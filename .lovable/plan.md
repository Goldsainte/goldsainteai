

## Update Intro Screen Copy & Tone

**File: `src/pages/trips/PostTripPage.tsx`** — edit the intro screen block (lines ~432–512):

### Changes

**1. Headline** → outcome-driven:
```
"Turn your idea into a
bookable experience."
```
Subline: *"We'll guide you through it — most trips go live in under 10 minutes."*

**2. Step labels** → concrete, action-based, no descriptions (remove `desc` field):
| # | Current | New |
|---|---------|-----|
| 1 | Where you're going | Choose your destination |
| 2 | Who's coming along | Add traveler details |
| 3 | Set the mood | Set the style & pace |
| 4 | Build your brief | Create your storyboard |
| 5 | Final details | Set pricing & dates |
| 6 | Review & post | Review & post |

**3. Reassurance line** below steps:
*"You can edit everything later — nothing is final until you say so."*

**4. CTA** → `"Create my trip"` (with arrow icon)

**5. Visual lightness** — remove `desc` lines entirely, increase step row padding (`py-5` → `py-6`), remove `font-semibold` from step numbers, vertically center the two-column flex (`items-start` → `items-center`).

