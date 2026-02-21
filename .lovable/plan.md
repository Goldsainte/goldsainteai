

# Update Hero Description Text

## What Changes
Replace the current `mainDescription` text in the English locale file with the refined version that introduces "curated travel marketplace" language and adds "destinations" to the storyboard elements.

## Technical Details

**File:** `src/i18n/locales/en.json` (line 76, `mainDescription` key)

**Current:**
> A travel storyboard turns your ideas into a structured, day-by-day vision of your trip -- the experiences, pacing, and priorities that matter most to you.\n\nOnce created, your storyboard is shared with vetted travel agents and creators who compete to design and price your perfect journey.\n\nYou choose the best proposal -- and your story becomes reality.

**New:**
> A travel storyboard transforms your ideas into a structured, day-by-day plan -- outlining the experiences, pacing, destinations, and priorities that matter most to you.\n\nOnce created, your storyboard enters our curated travel marketplace, where vetted agents and creators compete to design and price your perfect journey.\n\nYou choose the best proposal -- and your story becomes reality.

Key wording changes:
- "turns" to "transforms"
- "vision of your trip" to "plan"
- "the experiences" to "outlining the experiences"
- Added "destinations" to the list
- "is shared with vetted travel agents and creators" to "enters our curated travel marketplace, where vetted agents and creators"

No component changes needed -- the `whitespace-pre-line` class is already in place on the rendering `<p>` tag.

