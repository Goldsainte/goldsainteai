actions/checkout@v5# Translation Scripts

This directory contains automated scripts for validating and monitoring translation files.

## Scripts

### validate-translations.js

Validates that all translation keys exist across all supported languages and checks for:
- Missing keys (keys in English but not in other languages)
- Extra keys (keys in other languages but not in English)
- Empty values (keys that exist but have no content)

**Usage:**
```bash
node scripts/validate-translations.js
```

**Exit Codes:**
- `0` - All translations are valid
- `1` - Validation failed (missing keys, extra keys, or empty values found)

**Example Output:**
```
========================================
  Translation Validation Report
========================================

✓ Successfully loaded 10 language files

Reference language: English (209 keys)

✓ ES: 209 keys
✓ FR: 209 keys
✓ DE: 209 keys
✓ IT: 209 keys
✓ PT: 209 keys
✓ JA: 209 keys
✓ ZH: 209 keys
✓ KO: 209 keys
✓ AR: 209 keys

========================================
  Summary
========================================

✓ All translations are valid!
  10 languages verified
  209 keys in each language
```

### translation-coverage.js

Generates a detailed coverage report showing:
- Overall translation statistics
- Per-language coverage percentages
- Section-by-section coverage with visual progress bars

**Usage:**
```bash
node scripts/translation-coverage.js
```

**Example Output:**
```
========================================
  Translation Coverage Report
========================================

Overall Coverage:

Total keys: 209
Languages: 10
Top-level sections: header, common, language, home, navigation, footer, welcomeModal, about

Per-Language Coverage:

Language | Keys      | Coverage
---------|-----------|----------
EN       | 209       | 100.00%
ES       | 209       | 100.00%
FR       | 209       | 100.00%
...

Section Coverage:

welcomeModal (10 keys):
  EN: ████████████████████ 100%
  ES: ████████████████████ 100%
  FR: ████████████████████ 100%
  ...
```

## Integrating with CI/CD

### GitHub Actions Example

Add this to `.github/workflows/validate-translations.yml`:

```yaml
name: Validate Translations

on:
  push:
    paths:
      - 'src/i18n/locales/**'
  pull_request:
    paths:
      - 'src/i18n/locales/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v5
        with:
          node-version: '18'
      - name: Validate translations
        run: node scripts/validate-translations.js
```

## Supported Languages

- English (en) - Reference language
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Japanese (ja)
- Chinese (zh)
- Korean (ko)
- Arabic (ar)

## Adding New Languages

1. Create a new JSON file in `src/i18n/locales/` (e.g., `nl.json` for Dutch)
2. Add the language code to the `LANGUAGES` array in both scripts
3. Add the language to `src/i18n/config.ts`
4. Run validation to ensure all keys are present

## Troubleshooting

### Script won't run
Make sure Node.js is installed (v14+) and the scripts have execute permissions:
```bash
chmod +x scripts/*.js
```

### Missing keys after adding new features
1. Add the new keys to `en.json` first (reference language)
2. Run `node scripts/validate-translations.js` to see which languages are missing the keys
3. Add the missing translations to each language file
4. Run validation again to verify

### Empty values warnings
Check if any translation files have keys with empty strings or null values. Every key should have meaningful content.
