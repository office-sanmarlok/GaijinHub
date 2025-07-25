import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

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
    muni_id: '131130',
    original_language: 'en'
  },
  {
    title: 'Cozy Studio near Tokyo Tower',
    body: 'Compact but efficient studio apartment with all amenities. Great location for exploring Tokyo.',
    price: 120000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131032',
    original_language: 'en'
  },
  // 中国語（簡体字）の投稿
  {
    title: '新宿区高级公寓出租',
    body: '位于新宿中心地带的豪华公寓，交通便利，周边设施齐全。适合商务人士或小家庭居住。',
    price: 300000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131041',
    original_language: 'zh-CN'
  },
  {
    title: '池袋温馨一居室',
    body: '靠近池袋站的舒适一居室，购物方便，生活便利。非常适合留学生或年轻上班族。',
    price: 95000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131164',
    original_language: 'zh-CN'
  },
  // 韓国語の投稿
  {
    title: '롯폰기 럭셔리 맨션',
    body: '롯폰기 중심가에 위치한 고급 맨션입니다. 최신 시설과 편의시설을 갖추고 있습니다.',
    price: 350000,
    category: 'house',
    pref_id: '13',
    muni_id: '131032',
    original_language: 'ko'
  },
  {
    title: '나카노 원룸 아파트',
    body: '나카노역에서 도보 5분 거리의 깨끗한 원룸입니다. 학생과 직장인에게 적합합니다.',
    price: 80000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131148',
    original_language: 'ko'
  },
  // ポルトガル語の投稿
  {
    title: 'Casa Familiar em Setagaya',
    body: 'Casa espaçosa com jardim em área residencial tranquila. Perfeita para famílias com crianças.',
    price: 280000,
    category: 'house',
    pref_id: '13',
    muni_id: '131121',
    original_language: 'pt'
  },
  {
    title: 'Apartamento Moderno em Meguro',
    body: 'Apartamento recém-renovado com design contemporâneo. Excelente localização.',
    price: 180000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131105',
    original_language: 'pt'
  },
  // ベトナム語の投稿
  {
    title: 'Căn hộ cao cấp tại Minato',
    body: 'Căn hộ hiện đại với view đẹp, gần ga tàu và trung tâm mua sắm.',
    price: 220000,
    category: 'apartment',
    pref_id: '13',
    muni_id: '131032',
    original_language: 'vi'
  },
  {
    title: 'Phòng trọ giá rẻ ở Adachi',
    body: 'Phòng trọ sạch sẽ, giá cả phải chăng. Thích hợp cho sinh viên.',
    price: 65000,
    category: 'room',
    pref_id: '13',
    muni_id: '131211',
    original_language: 'vi'
  }
];

async function processTranslations() {
  const userId = '06929056-74ce-4f49-ad1a-6f0998b002c9'; // 既存のユーザーID

  for (const listingData of listings) {
    console.log(`\nCreating: ${listingData.title}`);
    
    try {
      // 1. リスティングを作成（original_languageはnullにして自動検出させる）
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          user_id: userId,
          title: listingData.title,
          body: listingData.body,
          price: listingData.price,
          category: listingData.category,
          pref_id: listingData.pref_id,
          muni_id: listingData.muni_id,
          original_language: null // 自動検出させる
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create listing:', error);
        continue;
      }

      console.log(`✓ Created listing with ID: ${listing.id}`);

      // 2. translation/processエンドポイントを呼び出す
      console.log('  Triggering translation process...');
      const response = await fetch('http://localhost:3002/api/translation/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('  ✗ Translation process failed:', errorText);
      } else {
        const result = await response.json();
        console.log(`  ✓ Translation process completed`);
      }

      // 少し待ってから次の投稿へ
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error:', error);
    }
  }

  console.log('\n=== All listings created! ===');
}

processTranslations().catch(console.error);