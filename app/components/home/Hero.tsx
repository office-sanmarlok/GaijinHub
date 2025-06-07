'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchForm from '@/app/components/common/SearchForm';
import { Button } from '@/app/components/ui/button';

interface HeroProps {
  backgroundImage?: string;
}

interface SearchParams {
  query?: string;
  category?: string;
  station?: Station | null;
  minPrice?: number;
  maxPrice?: number;
}

interface Station {
  station_cd: string;
  station_name: string;
  station_name_kana: string;
  line_name: string;
  line_id: string;
  company_name: string;
  muni_id: string;
  muni_name: string;
  pref_id: string;
  pref_name: string;
  lat: number | null;
  lng: number | null;
}

export default function Hero({ backgroundImage = '/images/tokyo_night.jpg' }: HeroProps) {
  const router = useRouter();

  const handleSearchForm = (params: SearchParams) => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.set('q', params.query);
    if (params.category) searchParams.set('category', params.category);
    if (params.station) searchParams.set('station_cds', params.station.station_cd);
    if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());

    router.push(`/listings?${searchParams.toString()}`);
  };

  return (
    <section className="relative h-screen w-full">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>
      
      {/* コンテンツ */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            GaijinHub
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            日本全国の外国人コミュニティ
          </p>
          <p className="text-lg md:text-xl mb-8 opacity-80">
            Connect with Japan&apos;s Foreign Community Nationwide
          </p>
          
          {/* SearchFormコンポーネント */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <SearchForm
              onSearch={handleSearchForm}
              showLocationSearch={true}
              showCategoryFilter={true}
              showPriceFilter={false}
              compact={false}
              className="[&_input]:bg-white/20 [&_input]:border-white/30 [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input:focus]:bg-white/30 [&_button[role=combobox]]:bg-white/20 [&_button[role=combobox]]:border-white/30 [&_button[role=combobox]]:text-white [&_label]:text-white [&_label]:font-medium"
            />
            
            {/* すべての物件を見るボタン */}
            <div className="mt-4 text-center">
              <Link href="/listings">
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  すべての物件を見る / View All Listings
                </Button>
              </Link>
            </div>
          </div>
          
          {/* 特徴説明 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm opacity-80">
            <div>
              <div className="text-2xl mb-2">🌏</div>
              <p>全国対応</p>
              <p>Nationwide Coverage</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🤝</div>
              <p>外国人コミュニティ</p>
              <p>Foreign Community</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🏠</div>
              <p>住居・仕事・売買・サービス</p>
              <p>Housing, Jobs, Items, Services</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 