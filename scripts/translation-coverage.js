#!/usr/bin/env node

/**
 * Translation Coverage Report
 * Generates a detailed coverage report for all translations
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar'];
const LOCALE_PATH = join(__dirname, '..', 'src', 'i18n', 'locales');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function loadTranslation(lang) {
  try {
    const filePath = join(LOCALE_PATH, `${lang}.json`);
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

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

function getTopLevelSections(obj) {
  return Object.keys(obj);
}

function generateCoverageReport() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Translation Coverage Report${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  const translations = {};
  for (const lang of LANGUAGES) {
    const translation = loadTranslation(lang);
    if (translation) {
      translations[lang] = translation;
    }
  }

  const referenceKeys = getAllKeys(translations.en);
  const sections = getTopLevelSections(translations.en);

  // Overall coverage
  console.log(`${colors.cyan}Overall Coverage:${colors.reset}\n`);
  console.log(`Total keys: ${referenceKeys.length}`);
  console.log(`Languages: ${LANGUAGES.length}`);
  console.log(`Top-level sections: ${sections.join(', ')}\n`);

  // Per-language coverage
  console.log(`${colors.cyan}Per-Language Coverage:${colors.reset}\n`);
  
  const coverageData = [];
  for (const lang of LANGUAGES) {
    const langKeys = getAllKeys(translations[lang]);
    const coverage = ((langKeys.length / referenceKeys.length) * 100).toFixed(2);
    const status = coverage === '100.00' ? colors.green : colors.yellow;
    
    coverageData.push({
      lang: lang.toUpperCase(),
      keys: langKeys.length,
      coverage: coverage,
      status: status
    });
  }

  // Print table
  console.log('Language | Keys      | Coverage');
  console.log('---------|-----------|----------');
  coverageData.forEach(data => {
    const langPadded = data.lang.padEnd(8);
    const keysPadded = data.keys.toString().padEnd(9);
    const coveragePadded = `${data.coverage}%`.padEnd(10);
    console.log(`${langPadded} | ${keysPadded} | ${data.status}${coveragePadded}${colors.reset}`);
  });

  console.log('\n');

  // Section-by-section coverage
  console.log(`${colors.cyan}Section Coverage:${colors.reset}\n`);
  
  for (const section of sections) {
    const sectionKeys = getAllKeys(translations.en[section], section);
    console.log(`${colors.cyan}${section}${colors.reset} (${sectionKeys.length} keys):`);
    
    for (const lang of LANGUAGES) {
      if (translations[lang][section]) {
        const langSectionKeys = getAllKeys(translations[lang][section], section);
        const coverage = ((langSectionKeys.length / sectionKeys.length) * 100).toFixed(0);
        const bar = '█'.repeat(Math.floor(coverage / 5)) + '░'.repeat(20 - Math.floor(coverage / 5));
        const status = coverage === '100' ? colors.green : colors.yellow;
        console.log(`  ${lang.toUpperCase()}: ${status}${bar}${colors.reset} ${coverage}%`);
      } else {
        console.log(`  ${lang.toUpperCase()}: ${colors.yellow}${'░'.repeat(20)}${colors.reset} 0%`);
      }
    }
    console.log('');
  }

  console.log(`${colors.cyan}========================================${colors.reset}\n`);
}

generateCoverageReport();
