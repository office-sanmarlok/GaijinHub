import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createMultilingualListings() {
  try {
    // 取得するユーザー
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    const userId = user.id;

    // 多言語の投稿データ
    const listings = [
      // 英語の投稿
      {
        user_id: userId,
        title: 'Spacious 2BR Apartment in Shibuya',
        description: 'Beautiful modern apartment with great city views. Walking distance to Shibuya station. Perfect for professionals or small families.',
        price: 250000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '渋谷区',
        station_id: null,
        language: 'en'
      },
      {
        user_id: userId,
        title: 'Cozy Studio near Tokyo Tower',
        description: 'Compact but efficient studio apartment with all amenities. Great location for exploring Tokyo. Suitable for singles or couples.',
        price: 120000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '港区',
        station_id: null,
        language: 'en'
      },
      // 中国語（簡体字）の投稿
      {
        user_id: userId,
        title: '新宿区高级公寓出租',
        description: '位于新宿中心地带的豪华公寓，交通便利，周边设施齐全。适合商务人士或小家庭居住。',
        price: 300000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '新宿区',
        station_id: null,
        language: 'zh-CN'
      },
      {
        user_id: userId,
        title: '池袋温馨一居室',
        description: '靠近池袋站的舒适一居室，购物方便，生活便利。非常适合留学生或年轻上班族。',
        price: 95000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '豊島区',
        station_id: null,
        language: 'zh-CN'
      },
      // 韓国語の投稿
      {
        user_id: userId,
        title: '롯폰기 럭셔리 맨션',
        description: '롯폰기 중심가에 위치한 고급 맨션입니다. 최신 시설과 편의시설을 갖추고 있으며, 외국인 거주자에게 인기가 많습니다.',
        price: 350000,
        currency: 'JPY',
        property_type: 'house',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '港区',
        station_id: null,
        language: 'ko'
      },
      {
        user_id: userId,
        title: '나카노 원룸 아파트',
        description: '나카노역에서 도보 5분 거리의 깨끗한 원룸입니다. 학생과 직장인에게 적합합니다.',
        price: 80000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '中野区',
        station_id: null,
        language: 'ko'
      },
      // ポルトガル語の投稿
      {
        user_id: userId,
        title: 'Casa Familiar em Setagaya',
        description: 'Casa espaçosa com jardim em área residencial tranquila. Perfeita para famílias com crianças. Próxima a escolas e parques.',
        price: 280000,
        currency: 'JPY',
        property_type: 'house',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '世田谷区',
        station_id: null,
        language: 'pt'
      },
      {
        user_id: userId,
        title: 'Apartamento Moderno em Meguro',
        description: 'Apartamento recém-renovado com design contemporâneo. Excelente localização com fácil acesso ao centro de Tóquio.',
        price: 180000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '目黒区',
        station_id: null,
        language: 'pt'
      },
      // ベトナム語の投稿
      {
        user_id: userId,
        title: 'Căn hộ cao cấp tại Minato',
        description: 'Căn hộ hiện đại với view đẹp, gần ga tàu và trung tâm mua sắm. Phù hợp cho người nước ngoài làm việc tại Tokyo.',
        price: 220000,
        currency: 'JPY',
        property_type: 'apartment',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '港区',
        station_id: null,
        language: 'vi'
      },
      {
        user_id: userId,
        title: 'Phòng trọ giá rẻ ở Adachi',
        description: 'Phòng trọ sạch sẽ, giá cả phải chăng. Thích hợp cho sinh viên và người mới đến Nhật Bản.',
        price: 65000,
        currency: 'JPY',
        property_type: 'room',
        country: 'Japan',
        prefecture: '東京都',
        municipality: '足立区',
        station_id: null,
        language: 'vi'
      }
    ];

    // 投稿を作成
    for (const listing of listings) {
      const { data, error } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

      if (error) {
        console.error(`Error creating listing: ${error.message}`);
      } else {
        console.log(`Created listing: ${data.title} (${data.language})`);
      }
    }

    console.log('All multilingual listings created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createMultilingualListings();