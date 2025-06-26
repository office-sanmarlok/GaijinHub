import { type Locale, locales } from '../../../i18n/config';

const DEEPL_API_URL = 'https://api.deepl.com/v2';
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

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
      throw new Error('DeepL API key is required');
    }
    this.apiKey = key;
  }

  /**
   * Translate text to multiple target languages
   */
  async translateText(
    text: string,
    targetLanguages: Locale[],
    sourceLanguage?: Locale
  ): Promise<Record<Locale, string>> {
    const translations: Record<Locale, string> = {} as Record<Locale, string>;

    // Convert locale codes to DeepL format
    const deeplTargetLangs = targetLanguages.map((lang) => this.toDeepLLangCode(lang));

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('auth_key', this.apiKey);

      if (sourceLanguage) {
        formData.append('source_lang', this.toDeepLLangCode(sourceLanguage));
      }

      // DeepL API requires separate requests for each target language
      const translationPromises = deeplTargetLangs.map(async (targetLang, index) => {
        const targetFormData = new FormData();
        targetFormData.append('text', text);
        targetFormData.append('auth_key', this.apiKey);
        targetFormData.append('target_lang', targetLang);

        if (sourceLanguage) {
          targetFormData.append('source_lang', this.toDeepLLangCode(sourceLanguage));
        }

        const response = await fetch(`${DEEPL_API_URL}/translate`, {
          method: 'POST',
          body: targetFormData,
        });

        if (!response.ok) {
          throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
        }

        const result: TranslationResult = await response.json();
        return {
          locale: targetLanguages[index],
          text: result.translations[0].text,
        };
      });

      const results = await Promise.all(translationPromises);

      results.forEach(({ locale, text }) => {
        translations[locale] = text;
      });

      return translations;
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw error;
    }
  }

  /**
   * Detect language from text (using translation API with source_lang auto)
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('auth_key', this.apiKey);
      formData.append('target_lang', 'EN'); // We need a target language for detection

      const response = await fetch(`${DEEPL_API_URL}/translate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
      }

      const result: TranslationResult = await response.json();
      const detectedLang = result.translations[0].detected_source_language;

      return {
        detected_language: this.fromDeepLLangCode(detectedLang),
        confidence: 0.95, // DeepL doesn't provide confidence scores
      };
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
      'zh-TW': 'ZH',
      ko: 'KO',
    };
    return mapping[locale] || locale.toUpperCase();
  }

  /**
   * Convert DeepL language code to app locale code
   */
  private fromDeepLLangCode(deeplCode: string): Locale {
    const mapping: Record<string, Locale> = {
      JA: 'ja',
      EN: 'en',
      ZH: 'zh-CN', // Default to simplified Chinese
      KO: 'ko',
    };
    return mapping[deeplCode] || 'ja';
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
