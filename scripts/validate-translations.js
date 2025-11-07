#!/usr/bin/env node

/**
 * Translation Validation Script
 * Validates that all translation keys exist across all supported languages
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar'];
const LOCALE_PATH = join(__dirname, '..', 'src', 'i18n', 'locales');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Load a translation file
 */
function loadTranslation(lang) {
  try {
    const filePath = join(LOCALE_PATH, `${lang}.json`);
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${lang}.json: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Get all keys from an object recursively
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Get value from nested object using dot notation
 */
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Check if a value is empty or just whitespace
 */
function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Main validation function
 */
function validateTranslations() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Translation Validation Report${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  // Load all translations
  const translations = {};
  const loadErrors = [];

  for (const lang of LANGUAGES) {
    const translation = loadTranslation(lang);
    if (translation) {
      translations[lang] = translation;
    } else {
      loadErrors.push(lang);
    }
  }

  if (loadErrors.length > 0) {
    console.log(`${colors.red}✗ Failed to load translations: ${loadErrors.join(', ')}${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Successfully loaded ${LANGUAGES.length} language files${colors.reset}\n`);

  // Use English as the reference language
  const referenceKeys = getAllKeys(translations.en);
  console.log(`${colors.blue}Reference language: English (${referenceKeys.length} keys)${colors.reset}\n`);

  // Track issues
  let hasErrors = false;
  const missingKeysReport = {};
  const emptyValuesReport = {};
  const extraKeysReport = {};

  // Check each language
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue; // Skip reference language

    const langKeys = getAllKeys(translations[lang]);
    const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));
    const extraKeys = langKeys.filter(key => !referenceKeys.includes(key));
    const emptyValues = [];

    // Check for empty values
    for (const key of langKeys) {
      const value = getValueByPath(translations[lang], key);
      if (isEmptyValue(value)) {
        emptyValues.push(key);
      }
    }

    // Store results
    if (missingKeys.length > 0) {
      missingKeysReport[lang] = missingKeys;
      hasErrors = true;
    }

    if (extraKeys.length > 0) {
      extraKeysReport[lang] = extraKeys;
      hasErrors = true;
    }

    if (emptyValues.length > 0) {
      emptyValuesReport[lang] = emptyValues;
      hasErrors = true;
    }

    // Print summary for this language
    const status = (missingKeys.length === 0 && extraKeys.length === 0 && emptyValues.length === 0)
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;

    console.log(`${status} ${lang.toUpperCase()}: ${langKeys.length} keys`);
    
    if (missingKeys.length > 0) {
      console.log(`  ${colors.yellow}⚠ Missing: ${missingKeys.length}${colors.reset}`);
    }
    if (extraKeys.length > 0) {
      console.log(`  ${colors.yellow}⚠ Extra: ${extraKeys.length}${colors.reset}`);
    }
    if (emptyValues.length > 0) {
      console.log(`  ${colors.yellow}⚠ Empty values: ${emptyValues.length}${colors.reset}`);
    }
  }

  console.log('\n');

  // Detailed reports
  if (Object.keys(missingKeysReport).length > 0) {
    console.log(`${colors.red}========================================${colors.reset}`);
    console.log(`${colors.red}  Missing Keys Report${colors.reset}`);
    console.log(`${colors.red}========================================${colors.reset}\n`);

    for (const [lang, keys] of Object.entries(missingKeysReport)) {
      console.log(`${colors.yellow}${lang.toUpperCase()}:${colors.reset}`);
      keys.forEach(key => console.log(`  - ${key}`));
      console.log('');
    }
  }

  if (Object.keys(extraKeysReport).length > 0) {
    console.log(`${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.magenta}  Extra Keys Report${colors.reset}`);
    console.log(`${colors.magenta}========================================${colors.reset}\n`);

    for (const [lang, keys] of Object.entries(extraKeysReport)) {
      console.log(`${colors.yellow}${lang.toUpperCase()}:${colors.reset}`);
      keys.forEach(key => console.log(`  - ${key}`));
      console.log('');
    }
  }

  if (Object.keys(emptyValuesReport).length > 0) {
    console.log(`${colors.yellow}========================================${colors.reset}`);
    console.log(`${colors.yellow}  Empty Values Report${colors.reset}`);
    console.log(`${colors.yellow}========================================${colors.reset}\n`);

    for (const [lang, keys] of Object.entries(emptyValuesReport)) {
      console.log(`${colors.yellow}${lang.toUpperCase()}:${colors.reset}`);
      keys.forEach(key => console.log(`  - ${key}`));
      console.log('');
    }
  }

  // Final summary
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (hasErrors) {
    console.log(`${colors.red}✗ Translation validation failed${colors.reset}`);
    console.log(`  Languages with issues: ${Object.keys({...missingKeysReport, ...extraKeysReport, ...emptyValuesReport}).length}`);
    console.log(`  Total missing keys: ${Object.values(missingKeysReport).flat().length}`);
    console.log(`  Total extra keys: ${Object.values(extraKeysReport).flat().length}`);
    console.log(`  Total empty values: ${Object.values(emptyValuesReport).flat().length}`);
    console.log('');
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ All translations are valid!${colors.reset}`);
    console.log(`  ${LANGUAGES.length} languages verified`);
    console.log(`  ${referenceKeys.length} keys in each language`);
    console.log('');
    process.exit(0);
  }
}

// Run validation
validateTranslations();
