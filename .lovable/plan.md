

# Update Storyboards Section Title and Description

## What Changes
Update the title and description text for the Storyboards Highlight section to shift from explaining what storyboards are to a benefit-driven marketplace value proposition.

## Copy Changes

**Title:**
- Current: "Storyboards: The Blueprint for Every Goldsainte AI Journey"
- New: "Curated Journeys, Ready to Book or Personalize"

**Description:**
- Current: "Every trip on Goldsainte starts as a storyboard -- a visual brief that blends your saved TikToks, creator content, mood images and curated experiences. It's how travelers express what they want to feel, and how creators and agents collaborate without chaos."
- New: "Explore expertly designed trips you can book instantly -- or customize with a creator or agent to make them your own."

## Why
- Shifts from feature explanation to user benefit
- "Ready to Book or Personalize" communicates the dual value clearly
- Shorter, punchier description reduces cognitive load
- Aligns with the simplified CTA strategy already in place

## Technical Details

**File: `src/i18n/locales/en.json` (lines 174-175)**

Update two keys inside `home.storyboards`:
- `title`: Change to `"Curated Journeys, Ready to Book or Personalize"` (remove the `<em>` tags since they are no longer needed)
- `description`: Change to `"Explore expertly designed trips you can book instantly — or customize with a creator or agent to make them your own."`

**File: `src/components/home/StoryboardsHighlight.tsx` (line ~73)**

Since the title no longer contains `<em>` tags, simplify the rendering from `<Trans>` with components to a plain `{t('home.storyboards.title')}` call. This is a minor cleanup -- the `Trans` component would still work, but removing it keeps the code clean.

