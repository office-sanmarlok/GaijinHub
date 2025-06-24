'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchForm from '@/components/common/SearchForm';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';

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
  const locale = useLocale();
  const t = useTranslations();

  const handleSearchForm = (params: SearchParams) => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.set('q', params.query);
    if (params.category) searchParams.set('category', params.category);
    if (params.station) searchParams.set('station_cds', params.station.station_cd);
    if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());

    router.push(`/${locale}/listings?${searchParams.toString()}`);
  };

  return (
    <section className="relative h-screen w-full">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
        }}
      />
      
      {/* コンテンツ */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            GaijinHub
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            {t('hero.title')}
          </p>
          <p className="text-lg md:text-xl mb-8 opacity-80">
            {t('hero.subtitle')}
          </p>
          
          {/* SearchFormコンポーネント */}
          <div className="bg-black/30 backdrop-blur-lg rounded-lg p-6 max-w-3xl mx-auto">
            <SearchForm
              onSearch={handleSearchForm}
              showLocationSearch={true}
              showCategoryFilter={true}
              showPriceFilter={false}
              compact={false}
              className="
                [&_label]:text-white 
                [&_label]:font-medium
                [&_input]:bg-white/10 
                [&_input]:border-white/20 
                [&_input]:text-white 
                [&_input]:placeholder:text-white/60 
                [&_input:focus]:bg-white/20
                [&_button[role=combobox]]:bg-white/10 
                [&_button[role=combobox]]:border-white/20 
                [&_button[role=combobox]]:text-white
              "
              buttonClassName="bg-white/20 border-white/30 text-white hover:bg-white/30"
            />
            
            {/* すべての物件を見るボタン */}
            <div className="mt-4 text-center">
              <Link href={`/${locale}/listings`}>
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  {t('navigation.listings')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 