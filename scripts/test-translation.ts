import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestListing() {
  console.log('テスト用リスティングを作成します...');

  // テスト用のリスティングデータ（日本語）
  const testListing = {
    title: '渋谷駅近くの便利なワンルームマンション',
    body: '渋谷駅から徒歩5分の好立地にある、リノベーション済みのワンルームマンションです。設備も充実しており、初めての一人暮らしに最適です。',
    category: 'Housing',
    price: 85000,
    station_id: '2800215', // 渋谷駅のstation_cd
    muni_id: '13113', // 渋谷区
    lat: 35.658581,
    lng: 139.701742,
    user_id: 'd8193aad-829c-4a55-9059-d96be83890b9', // 有効なユーザーID
    original_language: 'ja',
  };

  try {
    // リスティングを作成
    const { data: listing, error } = await supabase
      .from('listings')
      .insert(testListing)
      .select()
      .single();

    if (error) {
      console.error('リスティング作成エラー:', error);
      return;
    }

    console.log('リスティングが作成されました:', {
      id: listing.id,
      title: listing.title,
    });

    // 翻訳キューに追加
    const { data: queueItem, error: queueError } = await supabase
      .from('translation_queue')
      .insert({
        listing_id: listing.id,
        source_locale: 'ja',
        target_locales: ['en', 'zh-CN', 'zh-TW', 'ko'],
        status: 'pending',
      })
      .select()
      .single();

    if (queueError) {
      console.error('翻訳キュー追加エラー:', queueError);
      return;
    }

    console.log('翻訳キューに追加されました:', {
      id: queueItem.id,
      listing_id: queueItem.listing_id,
      target_locales: queueItem.target_locales,
    });

    console.log('\n✅ テストリスティングが正常に作成され、翻訳キューに追加されました！');
    console.log('リスティングID:', listing.id);
    console.log('\nGitHub Actionsで翻訳処理が開始されるのを確認してください。');
    
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

// メイン実行
createTestListing();