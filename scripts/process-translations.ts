import { createClient } from '@supabase/supabase-js';
import * as deepl from 'deepl-node';
import dotenv from 'dotenv';
import { logger } from '@/lib/utils/logger';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const deeplApiKey = process.env.DEEPL_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !deeplApiKey) {
  logger.error('必要な環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const translator = new deepl.Translator(deeplApiKey);

// アプリの言語コード
const locales = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko'] as const;
type Locale = typeof locales[number];

// アプリの言語コードをDeepL APIの言語コードに変換
const deeplLangMap: Record<string, deepl.TargetLanguageCode> = {
  'en': 'en-US',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'ko': 'ko'
};

interface QueueItem {
  id: string;
  listing_id: string;
  source_locale: string;
  target_locales: string[];
  listing_title: string;
  listing_body: string;
}

async function processTranslationQueue() {
  logger.debug('翻訳キューの処理を開始します...');

  try {
    // 特定のリスティングIDが指定されている場合
    const specificListingId = process.env.SPECIFIC_LISTING_ID;
    
    let queueItems: QueueItem[] | null;
    let fetchError;
    
    if (specificListingId) {
      logger.debug(`特定のリスティング ${specificListingId} を処理します`);
      // 特定のリスティングのみ取得
      const { data, error } = await supabase
        .from('translation_queue')
        .select('*')
        .eq('listing_id', specificListingId)
        .eq('status', 'pending')
        .single();
      
      queueItems = data ? [data] : null;
      fetchError = error;
    } else {
      // 通常のキュー処理
      const { data, error } = await supabase.rpc('get_pending_translations', {
        p_limit: 10
      });
      queueItems = data;
      fetchError = error;
    }

    if (fetchError) {
      logger.error('翻訳キューの取得エラー:', fetchError);
      return;
    }

    if (!queueItems || queueItems.length === 0) {
      logger.debug('処理する翻訳キューがありません');
      return;
    }

    logger.debug(`${queueItems.length}件の翻訳を処理します`);

    for (const item of queueItems as QueueItem[]) {
      try {
        logger.debug(`処理中: Listing ${item.listing_id} - "${item.listing_title}"`);

        // ステータスを処理中に更新
        await supabase.rpc('mark_translation_processing', {
          p_queue_id: item.id
        });

        // 翻訳対象の言語をフィルタリング
        const targetLocales = item.target_locales.filter(locale => 
          locales.includes(locale as Locale) && locale !== item.source_locale
        ) as Locale[];

        // 各言語に対して翻訳を実行
        for (const targetLocale of targetLocales) {
          try {
            const deeplTargetLang = deeplLangMap[targetLocale];
            if (!deeplTargetLang) {
              logger.warn(`DeepL言語マッピングが見つかりません: ${targetLocale}`);
              continue;
            }

            // タイトルの翻訳
            const titleResult = await translator.translateText(
              item.listing_title,
              item.source_locale === 'ja' ? null : item.source_locale as deepl.SourceLanguageCode,
              deeplTargetLang
            );

            // 本文の翻訳
            const bodyResult = await translator.translateText(
              item.listing_body,
              item.source_locale === 'ja' ? null : item.source_locale as deepl.SourceLanguageCode,
              deeplTargetLang
            );

            // 翻訳結果を保存
            const { error: insertError } = await supabase
              .from('listing_translations')
              .upsert({
                listing_id: item.listing_id,
                locale: targetLocale,
                title: titleResult.text,
                body: bodyResult.text,
                is_auto_translated: true,
                translated_at: new Date().toISOString()
              }, {
                onConflict: 'listing_id,locale'
              });

            if (insertError) {
              logger.error(`翻訳の保存エラー (${targetLocale}):`, insertError);
            } else {
              logger.debug(`翻訳完了: Listing ${item.listing_id} (${targetLocale})`);
            }
          } catch (translationError) {
            logger.error(`翻訳エラー (${targetLocale}):`, translationError);
          }
        }

        // ステータスを完了に更新
        await supabase.rpc('mark_translation_completed', {
          p_queue_id: item.id
        });
        
      } catch (itemError) {
        logger.error(`アイテム処理エラー:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
        
        // ステータスを失敗に更新
        await supabase.rpc('mark_translation_failed', {
          p_queue_id: item.id,
          p_error_message: errorMessage
        });
      }
    }

    logger.debug('翻訳キューの処理が完了しました');
    
  } catch (error) {
    logger.error('翻訳処理の全体エラー:', error);
    process.exit(1);
  }
}


// メイン実行
processTranslationQueue()
  .then(() => {
    logger.debug('処理完了');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('予期しないエラー:', error);
    process.exit(1);
  });