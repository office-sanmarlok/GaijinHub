import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 多言語の投稿データ
const listings = [
  // 英語の投稿
  {
    title: 'Spacious 2BR Apartment in Shibuya',
    body: 'Beautiful modern apartment with great city views. Walking distance to Shibuya station. Perfect for professionals or small families.',
    price: 250000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131130'
  },
  {
    title: 'Cozy Studio near Tokyo Tower',
    body: 'Compact but efficient studio apartment with all amenities. Great location for exploring Tokyo.',
    price: 120000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131032'
  },
  // 中国語（簡体字）の投稿
  {
    title: '新宿区高级公寓出租',
    body: '位于新宿中心地带的豪华公寓，交通便利，周边设施齐全。适合商务人士或小家庭居住。',
    price: 300000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131041'
  },
  {
    title: '池袋温馨一居室',
    body: '靠近池袋站的舒适一居室，购物方便，生活便利。非常适合留学生或年轻上班族。',
    price: 95000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131164'
  },
  // 韓国語の投稿
  {
    title: '롯폰기 럭셔리 맨션',
    body: '롯폰기 중심가에 위치한 고급 맨션입니다. 최신 시설과 편의시설을 갖추고 있습니다.',
    price: 350000,
    category: 'house',
    pref_id: '13',
    muni_id: '131032'
  },
  {
    title: '나카노 원룸 아파트',
    body: '나카노역에서 도보 5분 거리의 깨끗한 원룸입니다. 학생과 직장인에게 적합합니다.',
    price: 80000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131148'
  },
  // ポルトガル語の投稿
  {
    title: 'Casa Familiar em Setagaya',
    body: 'Casa espaçosa com jardim em área residencial tranquila. Perfeita para famílias com crianças.',
    price: 280000,
    category: 'house',
    pref_id: '13',
    muni_id: '131121'
  },
  {
    title: 'Apartamento Moderno em Meguro',
    body: 'Apartamento recém-renovado com design contemporâneo. Excelente localização.',
    price: 180000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131105'
  },
  // ベトナム語の投稿
  {
    title: 'Căn hộ cao cấp tại Minato',
    body: 'Căn hộ hiện đại với view đẹp, gần ga tàu và trung tâm mua sắm.',
    price: 220000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131032'
  },
  {
    title: 'Phòng trọ giá rẻ ở Adachi',
    body: 'Phòng trọ sạch sẽ, giá cả phải chăng. Thích hợp cho sinh viên.',
    price: 65000,
    category: 'room',
    pref_id: '13',
    muni_id: '131211'
  }
];

async function createListingsWithTranslation() {
  try {
    // サービスロールキーで認証
    const userId = '06929056-74ce-4f49-ad1a-6f0998b002c9'; // 既存のユーザーID

    for (const listingData of listings) {
      console.log(`\nCreating: ${listingData.title}`);
      
      // create-with-translationエンドポイントと同じロジックを直接実行
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          ...listingData,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create listing:', error);
        continue;
      }

      console.log(`✓ Created listing with ID: ${listing.id}`);

      // 言語を検出
      try {
        // DeepL APIを使って翻訳（環境変数が必要）
        console.log('  Detecting language and translating...');
        
        // detectLanguageとtranslateTextを直接インポートできないので、
        // スクリプト内で実装
        const { detectLanguage, translateText } = await import('../app/lib/translation');
        const { locales } = await import('../i18n/config');
        
        const detectedLanguage = await detectLanguage(listing.title + ' ' + listing.body);
        console.log(`  Detected language: ${detectedLanguage}`);
        
        // original_languageを更新
        await supabase
          .from('listings')
          .update({ original_language: detectedLanguage })
          .eq('id', listing.id);

        // 他の言語に翻訳
        const targetLocales = locales.filter(locale => locale !== detectedLanguage);
        const translations = [];

        for (const targetLocale of targetLocales) {
          try {
            const [translatedTitle, translatedBody] = await Promise.all([
              translateText(listing.title, detectedLanguage as any, targetLocale),
              translateText(listing.body, detectedLanguage as any, targetLocale),
            ]);

            translations.push({
              listing_id: listing.id,
              locale: targetLocale,
              title: translatedTitle,
              body: translatedBody,
              is_auto_translated: true,
            });
            console.log(`  ✓ Translated to ${targetLocale}`);
          } catch (error) {
            console.error(`  ✗ Failed to translate to ${targetLocale}:`, error);
          }
        }

        // 翻訳を保存
        if (translations.length > 0) {
          const { error: translationError } = await supabase
            .from('listing_translations')
            .insert(translations);

          if (translationError) {
            console.error('Failed to save translations:', translationError);
          } else {
            console.log(`  ✓ Saved ${translations.length} translations`);
          }
        }
      } catch (error) {
        console.error('Translation error:', error);
      }

      // APIレート制限を避けるため少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== All listings created! ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

createListingsWithTranslation();