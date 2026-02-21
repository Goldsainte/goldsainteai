

# Replace Hero Description Text

## What Changes
Update the `mainDescription` value in the English locale file (`src/i18n/locales/en.json`, line 76) to replace the current single-paragraph description with the new three-paragraph storyboard-focused copy.

## Technical Details

**File:** `src/i18n/locales/en.json` (line 76)

**Current text:**
> Goldsainte turns inspiration into itinerary. Post your dream trip, match instantly with creators and certified agents whose style fits yours, co-design the journey through a shared storyboard, and book the entire experience inside a trusted luxury marketplace.

**New text:**
> A travel storyboard turns your ideas into a structured, day-by-day vision of your trip -- the experiences, pacing, and priorities that matter most to you.\n\nOnce created, your storyboard is shared with vetted travel agents and creators who compete to design and price your perfect journey.\n\nYou choose the best proposal -- and your story becomes reality.

The three paragraphs will be joined with `\n\n` line breaks in the JSON string. The component rendering this text will need to preserve those line breaks (e.g., via `whitespace-pre-line` CSS or splitting into separate `<p>` tags). I'll verify the rendering component and adjust if needed to ensure the paragraph breaks display correctly.

