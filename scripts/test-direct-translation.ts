import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { detectLanguage, translateText } from '../app/lib/translation';
import { locales, type Locale } from '../i18n/config';
import { logger } from '@/lib/utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function testDirectTranslation() {
  logger.debug('ダイレクト翻訳テストを開始します...\n');

  // Create a new listing
  const testListing = {
    title: '京都の伝統的な町家をリノベーションしたゲストハウス',
    body: '京都の中心部に位置する、築100年の町家をリノベーションしたゲストハウスです。和の趣を残しながら、モダンな設備を完備。観光地へのアクセスも良好で、外国人観光客に人気です。',
    category: 'Housing',
    price: 80000,
    station_id: '2600411', // 京都駅
    muni_id: '26100',
    lat: 34.985458,
    lng: 135.758634,
    user_id: 'd8193aad-829c-4a55-9059-d96be83890b9',
    has_location: true,
    is_city_only: false,
  };

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert(testListing)
    .select()
    .single();

  if (listingError || !listing) {
    logger.error('❌ リスティング作成エラー:', listingError);
    return;
  }

  logger.debug('✅ リスティングが作成されました:', {
    id: listing.id,
    title: listing.title,
  });

  // Detect language
  logger.debug('\n🔍 言語を検出中...');
  const detectedLanguage = await detectLanguage(listing.title + ' ' + listing.body);
  logger.debug(`検出された言語: ${detectedLanguage}`);

  // Update listing with detected language
  await supabase
    .from('listings')
    .update({ original_language: detectedLanguage })
    .eq('id', listing.id);

  // Get target languages
  const targetLocales = locales.filter(locale => locale !== detectedLanguage);
  logger.debug(`翻訳対象言語: ${targetLocales.join(', ')}`);

  // Translate to all languages
  logger.debug('\n🔄 翻訳を実行中...');
  const translations = [];

  for (const targetLocale of targetLocales) {
    try {
      logger.debug(`\n  → ${targetLocale}に翻訳中...`);
      
      const startTime = Date.now();
      const [translatedTitle, translatedBody] = await Promise.all([
        translateText(listing.title, detectedLanguage as Locale, targetLocale),
        translateText(listing.body, detectedLanguage as Locale, targetLocale),
      ]);
      const endTime = Date.now();
      
      logger.debug(`    ✓ 完了 (${endTime - startTime}ms)`);
      logger.debug(`    タイトル: ${translatedTitle}`);
      logger.debug(`    本文: ${translatedBody.substring(0, 60)}...`);

      translations.push({
        listing_id: listing.id,
        locale: targetLocale,
        title: translatedTitle,
        body: translatedBody,
        is_auto_translated: true,
      });
    } catch (error) {
      logger.error(`    ✗ ${targetLocale}への翻訳エラー:`, error);
    }
  }

  // Save all translations
  if (translations.length > 0) {
    logger.debug('\n💾 翻訳を保存中...');
    const { data: savedTranslations, error: saveError } = await supabase
      .from('listing_translations')
      .insert(translations)
      .select();

    if (saveError) {
      logger.error('❌ 翻訳保存エラー:', saveError);
    } else {
      logger.debug(`✅ ${savedTranslations?.length}件の翻訳を保存しました`);
    }
  }

  // Display summary
  logger.debug('\n📊 翻訳サマリー:');
  logger.debug(`  - リスティングID: ${listing.id}`);
  logger.debug(`  - 元の言語: ${detectedLanguage}`);
  logger.debug(`  - 翻訳済み言語数: ${translations.length}`);
  logger.debug('\n✅ ダイレクト翻訳テスト完了！');
}

testDirectTranslation().catch(console.error);