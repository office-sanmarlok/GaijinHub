import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '@/lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// サンプルデータのテンプレート
const sampleData = {
  ja: [
    {
      title: "渋谷駅徒歩5分！リノベーション済みワンルーム",
      body: "渋谷駅から徒歩5分の好立地。2023年にフルリノベーション済み。エアコン、洗濯機、冷蔵庫完備。外国人歓迎、英語対応可能な管理会社。",
      category: "Housing",
      price: 95000,
      station_id: "2800215", // 渋谷駅
      muni_id: "13113" // 渋谷区
    },
    {
      title: "浅草で日本文化体験！着物レンタル＆写真撮影",
      body: "浅草寺周辺で本格的な着物体験。プロカメラマンによる撮影付き。英語・中国語・韓国語対応スタッフ在籍。観光の思い出作りに最適です。",
      category: "Services",
      price: 8000,
      station_id: "2800808", // 浅草駅
      muni_id: "13106" // 台東区
    },
    {
      title: "新宿の中心で働こう！IT企業でのエンジニア募集",
      body: "グローバルIT企業でフルスタックエンジニアを募集。ビザサポートあり。英語環境、リモートワーク可。経験者優遇、未経験者も歓迎。",
      category: "Jobs",
      price: 300000,
      station_id: "2800108", // 新宿駅
      muni_id: "13104" // 新宿区
    },
    {
      title: "六本木の高級シェアハウス、国際交流が盛ん",
      body: "六本木ヒルズ近くの高級シェアハウス。20カ国以上の住人が在籍。共用キッチン、ジム、コワーキングスペース完備。月額料金に光熱費込み。",
      category: "Housing",
      price: 120000,
      station_id: "2800912", // 六本木駅
      muni_id: "13103" // 港区
    },
    {
      title: "横浜中華街でレストランスタッフ募集",
      body: "老舗中華料理店でホールスタッフ募集。中国語ネイティブ歓迎。まかない付き、交通費支給。未経験者OK、丁寧に指導します。",
      category: "Jobs",
      price: 1200,
      station_id: "1400206", // 元町・中華街駅
      muni_id: "14104" // 横浜市中区
    }
  ],
  en: [
    {
      title: "Modern Studio in Shibuya - 5min from Station",
      body: "Newly renovated studio apartment in the heart of Shibuya. Fully furnished with AC, washing machine, and refrigerator. English-speaking management available.",
      category: "Housing",
      price: 95000,
      station_id: "2800215",
      muni_id: "13113"
    },
    {
      title: "English Teacher Position at International School",
      body: "Seeking native English speakers for teaching positions. Visa sponsorship provided. Experience preferred but not required. Competitive salary and benefits.",
      category: "Jobs",
      price: 280000,
      station_id: "2800104", // 池袋駅
      muni_id: "13116" // 豊島区
    },
    {
      title: "Language Exchange Meetup Every Friday",
      body: "Join our weekly language exchange in Roppongi. Practice Japanese, English, and other languages. Free entry, drinks available for purchase. All levels welcome!",
      category: "Services",
      price: 0,
      station_id: "2800912",
      muni_id: "13103"
    },
    {
      title: "Cozy Share House near Tokyo Station",
      body: "International share house with residents from 15+ countries. Common areas include kitchen, lounge, and rooftop terrace. Utilities included in rent.",
      category: "Housing",
      price: 85000,
      station_id: "2800101", // 東京駅
      muni_id: "13101" // 千代田区
    },
    {
      title: "Professional Translation Services",
      body: "Certified translators for Japanese-English business documents. Fast turnaround, competitive rates. Legal, technical, and marketing translations available.",
      category: "Services",
      price: 5000,
      station_id: "2800209", // 品川駅
      muni_id: "13109" // 品川区
    }
  ],
  "zh-CN": [
    {
      title: "池袋车站附近的单身公寓",
      body: "距离池袋站步行3分钟。24小时便利店和超市就在附近。房租包含网费。欢迎外国人，可提供中文服务。",
      category: "Housing",
      price: 78000,
      station_id: "2800104",
      muni_id: "13116"
    },
    {
      title: "寻找中文家教",
      body: "为小学生寻找中文家教。每周2次，每次2小时。时薪3000日元。需要有教学经验，地点在世田谷区。",
      category: "Jobs",
      price: 3000,
      station_id: "2800416", // 三軒茶屋駅
      muni_id: "13112" // 世田谷区
    },
    {
      title: "中国食材店招聘收银员",
      body: "新宿的中国食材超市招聘收银员。需要会说中文和基础日语。提供培训，工作环境友好。",
      category: "Jobs",
      price: 1100,
      station_id: "2800108",
      muni_id: "13104"
    },
    {
      title: "上野附近的共享办公空间",
      body: "提供灵活的办公解决方案。高速网络、会议室、打印设备齐全。24小时开放，价格优惠。",
      category: "Services",
      price: 30000,
      station_id: "2800106", // 上野駅
      muni_id: "13106"
    },
    {
      title: "代购服务 - 日本商品直邮中国",
      body: "提供日本化妆品、电器、药品代购服务。正品保证，价格透明。支持支付宝、微信支付。",
      category: "Services",
      price: 500,
      station_id: "2800306", // 銀座駅
      muni_id: "13102" // 中央区
    }
  ],
  ko: [
    {
      title: "신오쿠보 원룸 임대",
      body: "한인타운 중심가 위치. 보증금 저렴, 한국인 부동산 직원이 친절하게 상담해드립니다. 즉시 입주 가능.",
      category: "Housing",
      price: 70000,
      station_id: "2800110", // 新大久保駅
      muni_id: "13104"
    },
    {
      title: "한국 요리사 모집",
      body: "정통 한식당에서 경력 요리사를 모집합니다. 비자 지원 가능. 급여 우대, 기숙사 제공.",
      category: "Jobs",
      price: 250000,
      station_id: "2800218", // 赤坂駅
      muni_id: "13103"
    },
    {
      title: "한국어 과외 선생님 찾습니다",
      body: "비즈니스 한국어를 배우고 싶은 일본인입니다. 주 2회, 시급 2500엔. 신주쿠 근처 카페에서 수업.",
      category: "Services",
      price: 2500,
      station_id: "2800108",
      muni_id: "13104"
    },
    {
      title: "K-POP 댄스 레슨",
      body: "현역 댄서가 가르치는 K-POP 댄스 클래스. 초보자 환영. 시부야 스튜디오에서 매주 토요일 개최.",
      category: "Services",
      price: 3000,
      station_id: "2800215",
      muni_id: "13113"
    },
    {
      title: "한국 화장품 공동구매",
      body: "인기 한국 화장품 공동구매 모집. 정품 보장, 한국에서 직배송. 카톡으로 문의주세요.",
      category: "Services",
      price: 0,
      station_id: "2800711", // 原宿駅
      muni_id: "13113"
    }
  ],
  vi: [
    {
      title: "Cho thuê phòng gần ga Nippori",
      body: "Phòng sạch sẽ, yên tĩnh, gần ga tàu. Có sẵn nội thất cơ bản. Chủ nhà thân thiện, có thể giao tiếp tiếng Việt.",
      category: "Housing",
      price: 65000,
      station_id: "2800905", // 日暮里駅
      muni_id: "13118" // 荒川区
    },
    {
      title: "Tuyển nhân viên nhà hàng Việt Nam",
      body: "Nhà hàng phở tại Takadanobaba cần tuyển nhân viên phục vụ. Làm việc part-time hoặc full-time. Bao cơm trưa.",
      category: "Jobs",
      price: 1050,
      station_id: "2800213", // 高田馬場駅
      muni_id: "13104"
    },
    {
      title: "Dịch vụ chuyển nhà giá rẻ",
      body: "Chuyển nhà nhanh chóng, cẩn thận. Giá cả phải chăng cho sinh viên và người lao động. Liên hệ qua Line hoặc điện thoại.",
      category: "Services",
      price: 15000,
      station_id: "2800104",
      muni_id: "13116"
    },
    {
      title: "Lớp học tiếng Nhật cho người Việt",
      body: "Giáo viên người Việt dạy tiếng Nhật. Lớp nhỏ 5-8 người. Tập trung vào giao tiếp hàng ngày và tiếng Nhật công sở.",
      category: "Services",
      price: 8000,
      station_id: "2800110",
      muni_id: "13104"
    },
    {
      title: "Tìm bạn cùng phòng người Việt",
      body: "Share house ở Kita-ku, tìm bạn cùng phòng. Ưu tiên người Việt Nam. Gần ga tàu, siêu thị, tiện nghi đầy đủ.",
      category: "Housing",
      price: 45000,
      station_id: "2801701", // 赤羽駅
      muni_id: "13117" // 北区
    }
  ],
  pt: [
    {
      title: "Apartamento em Hamamatsucho",
      body: "Apartamento moderno próximo à estação. Ideal para profissionais. Todos os eletrodomésticos incluídos. Proprietário fala português.",
      category: "Housing",
      price: 88000,
      station_id: "2800305", // 浜松町駅
      muni_id: "13103"
    },
    {
      title: "Aulas de Japonês para Brasileiros",
      body: "Professor nativo com experiência no ensino para brasileiros. Aulas particulares ou em grupo. Material didático incluído.",
      category: "Services",
      price: 4000,
      station_id: "2800217", // 五反田駅
      muni_id: "13109"
    },
    {
      title: "Vaga para Engenheiro de Software",
      body: "Empresa internacional busca desenvolvedor. Conhecimento em Java e Python. Inglês fluente necessário. Salário competitivo.",
      category: "Jobs",
      price: 400000,
      station_id: "2800712", // 恵比寿駅
      muni_id: "13113"
    },
    {
      title: "Serviço de Tradução Português-Japonês",
      body: "Tradutor juramentado oferece serviços de tradução. Documentos oficiais, contratos, certificados. Entrega rápida.",
      category: "Services",
      price: 8000,
      station_id: "2800108",
      muni_id: "13104"
    },
    {
      title: "Comunidade Brasileira em Tokyo",
      body: "Grupo de apoio para brasileiros em Tokyo. Eventos mensais, churrascos, ajuda com documentação. Todos bem-vindos!",
      category: "Services",
      price: 0,
      station_id: "2800416",
      muni_id: "13112"
    }
  ],
  id: [
    {
      title: "Kost dekat Stasiun Shinagawa",
      body: "Kamar kost bersih dan nyaman. Dekat stasiun kereta, akses mudah ke mana-mana. Listrik dan air termasuk. Pemilik bisa bahasa Indonesia.",
      category: "Housing",
      price: 60000,
      station_id: "2800209",
      muni_id: "13109"
    },
    {
      title: "Lowongan Kerja Restoran Indonesia",
      body: "Restoran masakan Indonesia di Ueno mencari koki dan pelayan. Gaji bagus, makan siang gratis. Visa sponsorship tersedia.",
      category: "Jobs",
      price: 220000,
      station_id: "2800106",
      muni_id: "13106"
    },
    {
      title: "Les Privat Bahasa Jepang",
      body: "Guru berpengalaman memberikan les bahasa Jepang. Fokus pada percakapan sehari-hari dan persiapan JLPT. Harga terjangkau.",
      category: "Services",
      price: 3500,
      station_id: "2800104",
      muni_id: "13116"
    },
    {
      title: "Jasa Kirim Barang ke Indonesia",
      body: "Kirim barang dari Jepang ke Indonesia. Aman, cepat, dan terpercaya. Harga kompetitif. Bisa kirim makanan dan kosmetik.",
      category: "Services",
      price: 1000,
      station_id: "2800108",
      muni_id: "13104"
    },
    {
      title: "Komunitas Indonesia di Tokyo",
      body: "Bergabunglah dengan komunitas Indonesia. Kegiatan bulanan, arisan, dan bantuan untuk pendatang baru. Info: WhatsApp tersedia.",
      category: "Services",
      price: 0,
      station_id: "2800215",
      muni_id: "13113"
    }
  ]
};

// ランダムな緯度経度を生成（東京周辺）
function getRandomLocation() {
  const baseLat = 35.6762;
  const baseLng = 139.6503;
  const latOffset = (Math.random() - 0.5) * 0.2;
  const lngOffset = (Math.random() - 0.5) * 0.2;
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

async function generateMultilingualListings() {
  console.log('🚀 Starting to generate 50 multilingual listings...\n');

  const languages = Object.keys(sampleData) as Array<keyof typeof sampleData>;
  const createdListings = [];
  let successCount = 0;
  let errorCount = 0;

  // 各言語から順番に投稿を作成
  for (let i = 0; i < 50; i++) {
    const language = languages[i % languages.length];
    const templates = sampleData[language];
    const template = templates[i % templates.length];
    const location = getRandomLocation();

    // ユニークなタイトルにするため番号を追加
    const listing = {
      ...template,
      title: `${template.title} #${i + 1}`,
      lat: location.lat,
      lng: location.lng,
      user_id: 'd8193aad-829c-4a55-9059-d96be83890b9',
      original_language: language,
      has_location: true,
      is_city_only: false
    };

    try {
      console.log(`Creating listing ${i + 1}/50 in ${language}: ${listing.title}`);
      
      const { data, error } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating listing ${i + 1}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Created listing ${i + 1} with ID: ${data.id}`);
        createdListings.push(data);
        successCount++;

        // 翻訳キューに追加
        const targetLocales = languages.filter(lang => lang !== language);
        const { error: queueError } = await supabase
          .from('translation_queue')
          .insert({
            listing_id: data.id,
            source_locale: language,
            target_locales: targetLocales,
            status: 'pending'
          });

        if (queueError) {
          console.error(`⚠️  Failed to add to translation queue:`, queueError.message);
        } else {
          console.log(`📋 Added to translation queue for ${targetLocales.length} languages`);
        }
      }

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Unexpected error for listing ${i + 1}:`, error);
      errorCount++;
    }
  }

  // サマリーを表示
  console.log('\n📊 Generation Summary:');
  console.log(`✅ Successfully created: ${successCount} listings`);
  console.log(`❌ Failed: ${errorCount} listings`);
  console.log('\n📋 Language distribution:');
  
  const languageCounts: Record<string, number> = {};
  createdListings.forEach(listing => {
    languageCounts[listing.original_language] = (languageCounts[listing.original_language] || 0) + 1;
  });
  
  Object.entries(languageCounts).forEach(([lang, count]) => {
    console.log(`  - ${lang}: ${count} listings`);
  });

  console.log('\n🎯 Next steps:');
  console.log('1. Run the translation queue processor to translate all listings');
  console.log('2. Or trigger GitHub Actions workflow for batch translation');
  console.log('3. Test cross-lingual search functionality with these listings');
}

// メイン実行
generateMultilingualListings().catch(console.error);