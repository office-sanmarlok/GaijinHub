import { createClient } from '@supabase/supabase-js';
import * as deepl from 'deepl-node';
import dotenv from 'dotenv';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const deeplApiKey = process.env.DEEPL_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !deeplApiKey) {
  console.error('必要な環境変数が設定されていません');
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
  console.log('翻訳キューの処理を開始します...');

  try {
    // RPC関数を使用してpendingの翻訳キューを取得
    const { data: queueItems, error: fetchError } = await supabase.rpc('get_pending_translations', {
      p_limit: 10
    });

    if (fetchError) {
      console.error('翻訳キューの取得エラー:', fetchError);
      return;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('処理する翻訳キューがありません');
      return;
    }

    console.log(`${queueItems.length}件の翻訳を処理します`);

    for (const item of queueItems as QueueItem[]) {
      try {
        console.log(`処理中: Listing ${item.listing_id} - "${item.listing_title}"`);

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
              console.warn(`DeepL言語マッピングが見つかりません: ${targetLocale}`);
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
              console.error(`翻訳の保存エラー (${targetLocale}):`, insertError);
            } else {
              console.log(`翻訳完了: Listing ${item.listing_id} (${targetLocale})`);
            }
          } catch (translationError) {
            console.error(`翻訳エラー (${targetLocale}):`, translationError);
          }
        }

        // ステータスを完了に更新
        await supabase.rpc('mark_translation_completed', {
          p_queue_id: item.id
        });
        
      } catch (itemError) {
        console.error(`アイテム処理エラー:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
        
        // ステータスを失敗に更新
        await supabase.rpc('mark_translation_failed', {
          p_queue_id: item.id,
          p_error_message: errorMessage
        });
      }
    }

    console.log('翻訳キューの処理が完了しました');
    
  } catch (error) {
    console.error('翻訳処理の全体エラー:', error);
    process.exit(1);
  }
}


// メイン実行
processTranslationQueue()
  .then(() => {
    console.log('処理完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });