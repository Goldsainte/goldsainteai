

# Rename "Create Your Travel Storyboard" CTA to "Create & Post Your Trip"

## Change
Update the i18n translation string for the hero CTA button from "Create Your Travel Storyboard" to "Create & Post Your Trip".

## File to Edit

### `src/i18n/locales/en.json`
- Change line 77: `"postDreamTrip": "Create Your Travel Storyboard"` → `"postDreamTrip": "Create & Post Your Trip"`

No other files need changes — `HomeHero.tsx` already reads this value via `t('home.hero.postDreamTrip')`.

