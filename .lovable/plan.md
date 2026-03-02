

## Problem

The "Legal" section on the About page shows raw translation keys (`about.sections.legal.p1`, `about.sections.legal.p2`, `about.sections.legal.p3`) because the **English translation file** (`src/i18n/locales/en.json`) is missing these keys. Other languages (French, Spanish, Chinese, Arabic, Japanese) all have them populated.

## Fix

**`src/i18n/locales/en.json`** — Add the missing `p1`, `p2`, and `p3` keys to the `about.sections.legal` object, matching the content from the other language files (translated back to English):

- **p1**: Goldsainte Inc. corporate registration info (Delaware, USA), relationship to Support Companies
- **p2**: Contact instructions for questions about the Service or Website
- **p3**: Disclaimer that Support Companies are not responsible parties

This is a one-file fix — no component or structural changes needed.

