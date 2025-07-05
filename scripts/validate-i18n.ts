import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../app/lib/utils/logger';

interface ValidationReport {
  missingKeys: Record<string, string[]>;
  extraKeys: Record<string, string[]>;
  totalKeys: number;
  validKeys: number;
}

async function validateI18n() {
  const messagesDir = path.join(process.cwd(), 'messages');
  const localeFiles = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));
  
  if (localeFiles.length === 0) {
    console.error('No locale files found in messages directory');
    process.exit(1);
  }

  // Load all locale messages
  const messages: Record<string, any> = {};
  for (const file of localeFiles) {
    const locale = path.basename(file, '.json');
    const content = fs.readFileSync(path.join(messagesDir, file), 'utf-8');
    messages[locale] = JSON.parse(content);
  }

  // Use the first locale as the reference
  const referenceLocale = 'en'; // or could be 'ja'
  if (!messages[referenceLocale]) {
    console.error(`Reference locale ${referenceLocale} not found`);
    process.exit(1);
  }

  const referenceKeys = getAllKeys(messages[referenceLocale]);
  const report: ValidationReport = {
    missingKeys: {},
    extraKeys: {},
    totalKeys: referenceKeys.size,
    validKeys: 0,
  };

  // Check each locale against the reference
  for (const [locale, content] of Object.entries(messages)) {
    if (locale === referenceLocale) continue;

    const localeKeys = getAllKeys(content);
    const missing: string[] = [];
    const extra: string[] = [];

    // Check for missing keys
    for (const key of referenceKeys) {
      if (!localeKeys.has(key)) {
        missing.push(key);
      }
    }

    // Check for extra keys
    for (const key of localeKeys) {
      if (!referenceKeys.has(key)) {
        extra.push(key);
      }
    }

    if (missing.length > 0) {
      report.missingKeys[locale] = missing;
    }
    if (extra.length > 0) {
      report.extraKeys[locale] = extra;
    }

    const validKeys = localeKeys.size - extra.length;
    report.validKeys = Math.max(report.validKeys, validKeys);
  }

  // Print report
  printReport(report, Object.keys(messages));

  // Return exit code based on validation result
  const hasErrors = Object.keys(report.missingKeys).length > 0 || 
                   Object.keys(report.extraKeys).length > 0;
  process.exit(hasErrors ? 1 : 0);
}

function getAllKeys(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

function printReport(report: ValidationReport, locales: string[]) {
  console.log('\\n=== i18n Validation Report ===\\n');
  console.log(`Total locales checked: ${locales.length}`);
  console.log(`Total keys in reference: ${report.totalKeys}`);
  console.log('');

  const hasIssues = Object.keys(report.missingKeys).length > 0 || 
                   Object.keys(report.extraKeys).length > 0;

  if (!hasIssues) {
    console.log('✅ All locales are in sync!');
    return;
  }

  // Report missing keys
  if (Object.keys(report.missingKeys).length > 0) {
    console.log('❌ Missing Keys:');
    for (const [locale, keys] of Object.entries(report.missingKeys)) {
      console.log(`\\n  ${locale}: ${keys.length} missing keys`);
      keys.slice(0, 10).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (keys.length > 10) {
        console.log(`    ... and ${keys.length - 10} more`);
      }
    }
  }

  // Report extra keys
  if (Object.keys(report.extraKeys).length > 0) {
    console.log('\\n⚠️  Extra Keys (not in reference):');
    for (const [locale, keys] of Object.entries(report.extraKeys)) {
      console.log(`\\n  ${locale}: ${keys.length} extra keys`);
      keys.slice(0, 10).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (keys.length > 10) {
        console.log(`    ... and ${keys.length - 10} more`);
      }
    }
  }

  console.log('\\n💡 To fix:');
  console.log('1. Add missing keys to the affected locale files');
  console.log('2. Remove or add extra keys to the reference locale');
  console.log('3. Run this script again to verify');
}

// Run validation
validateI18n().catch(console.error);