import { ModelOperations } from '@vscode/vscode-languagedetection';
import type { Locale } from '../../i18n/config';
import { getDeepLClient } from './deepl/client';
import { logger } from '@/lib/utils/logger';

let languageDetector: ModelOperations | null = null;

/**
 * Initialize the language detector
 */
async function initializeDetector(): Promise<ModelOperations> {
  if (!languageDetector) {
    languageDetector = new ModelOperations();
  }
  return languageDetector;
}

/**
 * Map VSCode language codes to our locale codes
 */
function mapLanguageCode(vscodeCode: string): Locale {
  const mapping: Record<string, Locale> = {
    ja: 'ja',
    en: 'en',
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW',
    ko: 'ko',
    zh: 'zh-CN', // Default Chinese to simplified
    vi: 'vi',
    pt: 'pt',
    'pt-br': 'pt',
    'pt-pt': 'pt',
    id: 'id',
  };

  const lowercaseCode = vscodeCode.toLowerCase();
  return mapping[lowercaseCode] || 'ja'; // Default to Japanese
}

/**
 * Detect language using VSCode language detection (primary) with DeepL fallback
 */
export async function detectLanguage(text: string): Promise<{
  language: Locale;
  confidence: number;
  method: 'vscode' | 'deepl_fallback';
}> {
  try {
    // Try VSCode language detection first
    const detector = await initializeDetector();
    const results = await detector.runModel(text);

    if (results.length > 0 && results[0].confidence > 0.8) {
      return {
        language: mapLanguageCode(results[0].languageId),
        confidence: results[0].confidence,
        method: 'vscode',
      };
    }
  } catch (error) {
    logger.warn('VSCode language detection failed, falling back to DeepL:', { error });
  }

  // Fallback to DeepL
  try {
    const deeplClient = getDeepLClient();
    const detectedLanguage = await deeplClient.detectLanguage(text);

    return {
      language: detectedLanguage,
      confidence: 0.9, // DeepL is generally accurate
      method: 'deepl_fallback',
    };
  } catch (error) {
    logger.error('DeepL language detection also failed:', error);
    // Return Japanese as final fallback
    return {
      language: 'ja',
      confidence: 0.5,
      method: 'deepl_fallback',
    };
  }
}

/**
 * Clean up resources
 */
export async function cleanupLanguageDetector() {
  if (languageDetector) {
    languageDetector.dispose();
    languageDetector = null;
  }
}
