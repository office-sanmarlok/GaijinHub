import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3002/api/listings/create-with-translation';

async function createListingWithTranslation(listing: any) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Supabaseの認証トークンが必要
      'Cookie': process.env.AUTH_COOKIE || ''
    },
    body: JSON.stringify(listing)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create listing: ${error}`);
  }

  return response.json();
}

async function main() {
  // 多言語の投稿データ
  const listings = [
    // 英語の投稿
    {
      title: 'Spacious 2BR Apartment in Shibuya',
      body: 'Beautiful modern apartment with great city views. Walking distance to Shibuya station. Perfect for professionals or small families. Features include modern kitchen, two bathrooms, and large balcony.',
      price: 250000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131130',
      original_language: 'en'
    },
    {
      title: 'Cozy Studio near Tokyo Tower',
      body: 'Compact but efficient studio apartment with all amenities. Great location for exploring Tokyo. Suitable for singles or couples. Recently renovated with new appliances.',
      price: 120000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131032',
      original_language: 'en'
    },
    // 中国語（簡体字）の投稿
    {
      title: '新宿区高级公寓出租',
      body: '位于新宿中心地带的豪华公寓，交通便利，周边设施齐全。适合商务人士或小家庭居住。公寓配备现代化家具，24小时保安服务。',
      price: 300000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131041',
      original_language: 'zh-CN'
    },
    {
      title: '池袋温馨一居室',
      body: '靠近池袋站的舒适一居室，购物方便，生活便利。非常适合留学生或年轻上班族。房间明亮整洁，家电齐全。',
      price: 95000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131164',
      original_language: 'zh-CN'
    },
    // 韓国語の投稿
    {
      title: '롯폰기 럭셔리 맨션',
      body: '롯폰기 중심가에 위치한 고급 맨션입니다. 최신 시설과 편의시설을 갖추고 있으며, 외국인 거주자에게 인기가 많습니다. 넓은 거실과 발코니가 있습니다.',
      price: 350000,
      category: 'house',
      pref_id: '13',
      muni_id: '131032',
      original_language: 'ko'
    },
    {
      title: '나카노 원룸 아파트',
      body: '나카노역에서 도보 5분 거리의 깨끗한 원룸입니다. 학생과 직장인에게 적합합니다. 보증금이 저렴하고 즉시 입주 가능합니다.',
      price: 80000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131148',
      original_language: 'ko'
    },
    // ポルトガル語の投稿
    {
      title: 'Casa Familiar em Setagaya',
      body: 'Casa espaçosa com jardim em área residencial tranquila. Perfeita para famílias com crianças. Próxima a escolas e parques. 4 quartos, 2 banheiros e garagem para 2 carros.',
      price: 280000,
      category: 'house',
      pref_id: '13',
      muni_id: '131121',
      original_language: 'pt'
    },
    {
      title: 'Apartamento Moderno em Meguro',
      body: 'Apartamento recém-renovado com design contemporâneo. Excelente localização com fácil acesso ao centro de Tóquio. Cozinha completa e varanda com vista para a cidade.',
      price: 180000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131105',
      original_language: 'pt'
    },
    // ベトナム語の投稿
    {
      title: 'Căn hộ cao cấp tại Minato',
      body: 'Căn hộ hiện đại với view đẹp, gần ga tàu và trung tâm mua sắm. Phù hợp cho người nước ngoài làm việc tại Tokyo. An ninh 24/7, có hồ bơi và phòng gym.',
      price: 220000,
      category: 'apartment',
      pref_id: '13',
      muni_id: '131032',
      original_language: 'vi'
    },
    {
      title: 'Phòng trọ giá rẻ ở Adachi',
      body: 'Phòng trọ sạch sẽ, giá cả phải chăng. Thích hợp cho sinh viên và người mới đến Nhật Bản. Gần chợ và siêu thị, tiện lợi cho sinh hoạt hàng ngày.',
      price: 65000,
      category: 'room',
      pref_id: '13',
      muni_id: '131211',
      original_language: 'vi'
    }
  ];

  console.log('Note: This script requires authentication. Please ensure you have a valid auth cookie.');
  console.log('You can get the cookie by logging in to the app and checking the browser developer tools.');
  console.log('\nSet the AUTH_COOKIE environment variable with your session cookie.');
  
  if (!process.env.AUTH_COOKIE) {
    console.error('\nERROR: AUTH_COOKIE environment variable is not set.');
    console.log('\nTo get your auth cookie:');
    console.log('1. Log in to the app in your browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Application/Storage > Cookies');
    console.log('4. Find the "sb-" prefixed cookies');
    console.log('5. Copy the entire cookie string and set it as AUTH_COOKIE');
    process.exit(1);
  }

  for (const listing of listings) {
    try {
      console.log(`Creating listing: ${listing.title}`);
      const result = await createListingWithTranslation(listing);
      console.log(`✓ Created with ${result.translationsCreated} translations`);
    } catch (error) {
      console.error(`✗ Failed to create listing: ${error}`);
    }
  }
}

main().catch(console.error);