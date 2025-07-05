import { type Locale } from '../../i18n/config';
import { getDeepLClient } from './deepl/client';
import { logger } from '@/lib/utils/logger';

/**
 * Detect language of the given text
 */
export async function detectLanguage(text: string): Promise<Locale> {
  // Use DeepL detection directly
  try {
    logger.debug('[Language Detection] Input text:', { text: text.substring(0, 50) + '...' });
    const deepl = getDeepLClient();
    const result = await deepl.detectLanguage(text);
    logger.debug('[Language Detection] Detected language:', result);
    return result as Locale;
  } catch (error) {
    logger.error('[Language Detection] DeepL detection failed:', error);
    logger.error('[Language Detection] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Default to Japanese if all detection fails
    return 'ja';
  }
}

/**
 * Translate text from source language to target language
 */
export async function translateText(
  text: string,
  sourceLocale: Locale,
  targetLocale: Locale
): Promise<string> {
  try {
    const deepl = getDeepLClient();
    const result = await deepl.translateText(text, sourceLocale, targetLocale);
    return result;
  } catch (error) {
    logger.error(`Translation failed from ${sourceLocale} to ${targetLocale}:`, error);
    throw error;
  }
}

/**
 * Translate text to multiple target languages
 */
export async function translateToMultipleLanguages(
  text: string,
  sourceLocale: Locale,
  targetLocales: Locale[]
): Promise<Record<Locale, string>> {
  const deepl = getDeepLClient();
  const results: Record<Locale, string> = {} as Record<Locale, string>;
  
  // Translate to each target language in parallel
  const promises = targetLocales.map(async (targetLocale) => {
    try {
      const translated = await deepl.translateText(text, sourceLocale, targetLocale);
      results[targetLocale] = translated;
    } catch (error) {
      logger.error(`Failed to translate to ${targetLocale}:`, error);
      throw error;
    }
  });
  
  await Promise.all(promises);
  return results;
}