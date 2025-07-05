import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { logger } from '@/lib/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function testRealtimeTranslation() {
  logger.debug('リアルタイム翻訳テストを開始します...\n');

  // Create a new listing
  const testListing = {
    title: '東京タワー近くのモダンなアパート',
    body: '東京タワーから徒歩10分の場所にある、新築のモダンなアパートです。2LDKで家族向けに最適です。設備も充実しており、エアコン、洗濯機、冷蔵庫などが完備されています。',
    category: 'Housing',
    price: 150000,
    station_id: '2800103', // 東京駅
    muni_id: '13103',
    lat: 35.658581,
    lng: 139.731742,
    user_id: 'd8193aad-829c-4a55-9059-d96be83890b9',
    has_location: true,
    is_city_only: false,
    original_language: 'ja',
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

  // Call real-time translation API
  logger.debug('\n🔄 リアルタイム翻訳を実行中...');
  
  const translationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/listings/${listing.id}/translate-now`;
  
  const response = await fetch(translationUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Simulate authentication
      'Cookie': `sb-access-token=${supabaseServiceKey}; sb-refresh-token=${supabaseServiceKey}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    logger.error('❌ 翻訳APIエラー:', { response: response.status, await: await response.text( }));
    return;
  }

  const result = await response.json();
  logger.debug('\n✅ 翻訳完了:', result);

  // Check translations in database
  const { data: translations, error: translationError } = await supabase
    .from('listing_translations')
    .select('*')
    .eq('listing_id', listing.id);

  if (translationError) {
    logger.error('❌ 翻訳確認エラー:', translationError);
    return;
  }

  logger.debug('\n📋 保存された翻訳:');
  translations?.forEach((translation) => {
    logger.debug(`\n🌐 ${translation.locale}:`);
    logger.debug(`  タイトル: ${translation.title}`);
    logger.debug(`  本文: ${translation.body.substring(0, 100)}...`);
  });

  logger.debug('\n✅ リアルタイム翻訳テスト完了！');
  logger.debug(`リスティングID: ${listing.id}`);
}

testRealtimeTranslation().catch(console.error);