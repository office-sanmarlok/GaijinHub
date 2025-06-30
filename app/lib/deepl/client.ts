import { type Locale } from '../../../i18n/config';

// Pro API configuration
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2';

console.log('[DeepL] Using API URL:', DEEPL_API_URL);
console.log('[DeepL] API Key configured:', !!DEEPL_API_KEY);
console.log('[DeepL] API Key ends with:', DEEPL_API_KEY?.slice(-4));

export interface TranslationResult {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

export interface LanguageDetectionResult {
  detected_language: string;
  confidence: number;
}

export class DeepLClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || DEEPL_API_KEY;
    if (!key) {
      console.error('[DeepL] No API key found!');
      throw new Error('DeepL API key is required');
    }
    console.log('[DeepL] Client initialized with API key ending:', key.slice(-4));
    this.apiKey = key;
  }

  /**
   * Translate text from source to target language
   */
  async translateText(text: string, sourceLanguage: Locale, targetLanguage: Locale): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('source_lang', this.toDeepLLangCode(sourceLanguage));
      params.append('target_lang', this.toDeepLLangCode(targetLanguage));

      const response = await fetch(`${DEEPL_API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DeepL] API Error Response:', errorText);
        throw new Error(`DeepL API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: TranslationResult = await response.json();
      return result.translations[0].text;
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw error;
    }
  }

  /**
   * Detect language from text (using translation API with source_lang auto)
   */
  async detectLanguage(text: string): Promise<Locale> {
    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('target_lang', 'EN'); // We need a target language for detection

      const response = await fetch(`${DEEPL_API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DeepL] API Error Response:', errorText);
        throw new Error(`DeepL API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: TranslationResult = await response.json();
      const detectedLang = result.translations[0].detected_source_language;
      console.log('[DeepL] Detected language code:', detectedLang);
      const mappedLocale = this.fromDeepLLangCode(detectedLang);
      console.log('[DeepL] Mapped to locale:', mappedLocale);
      return mappedLocale as Locale;
    } catch (error) {
      console.error('DeepL language detection error:', error);
      throw error;
    }
  }

  /**
   * Convert app locale code to DeepL language code
   */
  private toDeepLLangCode(locale: Locale): string {
    const mapping: Record<string, string> = {
      ja: 'JA',
      en: 'EN',
      'zh-CN': 'ZH',
      'zh-TW': 'ZH', // Note: DeepL doesn't support traditional Chinese directly
      ko: 'KO',
    };
    console.log(`[DeepL] Converting locale ${locale} to DeepL code: ${mapping[locale] || locale.toUpperCase()}`);
    return mapping[locale] || locale.toUpperCase();
  }

  /**
   * Convert DeepL language code to app locale code
   */
  private fromDeepLLangCode(deeplCode: string): Locale {
    const mapping: Record<string, Locale> = {
      JA: 'ja',
      EN: 'en',
      'EN-US': 'en',
      'EN-GB': 'en',
      ZH: 'zh-CN', // Default to simplified Chinese
      KO: 'ko',
    };
    console.log('[DeepL] fromDeepLLangCode input:', deeplCode, 'mapped:', mapping[deeplCode]);
    
    // Check direct mapping first
    if (mapping[deeplCode]) {
      return mapping[deeplCode];
    }
    
    // Check if it starts with a known language code (e.g., EN-US -> en)
    const baseCode = deeplCode.split('-')[0];
    if (mapping[baseCode]) {
      return mapping[baseCode];
    }
    
    // Log warning for unmapped language
    console.warn(`[DeepL] Unknown language code: ${deeplCode}, returning as-is`);
    return deeplCode.toLowerCase() as Locale;
  }
}

// Singleton instance
let deeplClient: DeepLClient | null = null;

export function getDeepLClient(): DeepLClient {
  if (!deeplClient) {
    deeplClient = new DeepLClient();
  }
  return deeplClient;
}
