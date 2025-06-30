#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getDeepLClient } from '../app/lib/deepl/client';
import { detectLanguage } from '../app/lib/language-detection';

// import { type Database } from '../app/types/supabase';

// 環境変数を読み込む
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const deeplApiKey = process.env.DEEPL_API_KEY;

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// テストスイート
async function runTests() {
  console.log('🧪 翻訳システムコンポーネントテスト開始\n');

  // 1. DeepL API接続テスト
  console.log('1️⃣  DeepL API接続テスト');
  if (!deeplApiKey) {
    console.error('❌ DEEPL_API_KEY が設定されていません');
  } else {
    try {
      const deeplClient = getDeepLClient();
      const testTranslation = await deeplClient.translateText('こんにちは', 'ja', 'en');
      console.log('✅ DeepL API接続成功');
      console.log(`   テスト翻訳: "こんにちは" → "${testTranslation}"`);
    } catch (error) {
      console.error('❌ DeepL API接続エラー:', error);
    }
  }
  console.log();

  // 2. 言語検出テスト
  console.log('2️⃣  言語検出テスト');
  const testTexts = [
    { text: 'Hello, this is a test', expected: 'en' },
    { text: 'こんにちは、これはテストです', expected: 'ja' },
    { text: '你好，这是一个测试', expected: 'zh-CN' },
    { text: '안녕하세요, 이것은 테스트입니다', expected: 'ko' },
  ];

  for (const { text, expected } of testTexts) {
    try {
      const detection = await detectLanguage(text);
      const success = detection.language === expected;
      console.log(
        `${success ? '✅' : '❌'} "${text.substring(0, 20)}..." → ${detection.language} (期待値: ${expected}, 信頼度: ${detection.confidence.toFixed(2)})`
      );
    } catch (error) {
      console.error(`❌ 言語検出エラー: ${error}`);
    }
  }
  console.log();

  // 3. 翻訳キューテスト
  console.log('3️⃣  翻訳キューテスト');
  try {
    // 既存のリスティングを取得
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, body')
      .limit(1)
      .single();

    if (listingError || !listing) {
      console.log('⚠️  テスト用のリスティングが見つかりません');
    } else {
      console.log(`📝 テストリスティング: "${listing.title}" (ID: ${listing.id})`);

      // 翻訳キューに追加
      const { error: queueError } = await supabase.from('translation_queue').insert({
        listing_id: listing.id,
        source_locale: 'ja',
        target_locales: ['en', 'zh-CN', 'ko'],
        status: 'pending',
      });

      if (queueError) {
        console.error('❌ キュー追加エラー:', queueError.message);
      } else {
        console.log('✅ 翻訳キューに追加成功');

        // キューの状態を確認
        const { count } = await supabase
          .from('translation_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        console.log(`📊 キュー内の保留中アイテム数: ${count}`);
      }
    }
  } catch (error) {
    console.error('❌ 翻訳キューテストエラー:', error);
  }
  console.log();

  // 4. RPC関数テスト
  console.log('4️⃣  RPC関数テスト');
  try {
    // get_pending_translations のテスト
    const { data: pendingItems, error: rpcError } = await supabase.rpc('get_pending_translations', { p_limit: 5 });

    if (rpcError) {
      console.error('❌ RPC関数エラー:', rpcError.message);
    } else {
      console.log(`✅ get_pending_translations 成功 (${pendingItems?.length || 0} アイテム)`);

      if (pendingItems && pendingItems.length > 0) {
        const item = pendingItems[0];
        console.log(
          `   最初のアイテム: ${item.listing_title} (${item.source_locale} → ${item.target_locales.join(', ')})`
        );
      }
    }
  } catch (error) {
    console.error('❌ RPC関数テストエラー:', error);
  }
  console.log();

  // 5. 翻訳処理エンドポイントテスト (ローカル)
  console.log('5️⃣  翻訳処理エンドポイントテスト');
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.log('⚠️  WEBHOOK_SECRET が設定されていないため、エンドポイントテストをスキップ');
  } else {
    try {
      const response = await fetch('http://localhost:3000/api/translation/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${webhookSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ check_queue_first: true }),
      });

      if (!response.ok) {
        console.error(`❌ エンドポイントエラー: ${response.status} ${response.statusText}`);
      } else {
        const result = await response.json();
        console.log('✅ エンドポイント呼び出し成功');
        console.log(`   処理: ${result.processed}, 残り: ${result.remaining}`);
      }
    } catch (error) {
      console.log('⚠️  ローカルサーバーが起動していない可能性があります');
      console.log('   `npm run dev` でサーバーを起動してください');
    }
  }

  console.log('\n✨ テスト完了');
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('未処理のエラー:', error);
  process.exit(1);
});

// テスト実行
runTests().catch((error) => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
