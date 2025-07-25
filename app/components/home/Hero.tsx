'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import SearchForm from '@/components/common/SearchForm';

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
  const tCommon = useTranslations('common');

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
    <section className="relative min-h-[calc(100vh-4rem)] w-full">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
        }}
      />

      {/* コンテンツ */}
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center text-white max-w-4xl mx-auto">
          <div className="mb-6">
            <Image
              src="/GaijinHub-logo-full.svg"
              alt="GaijinHub"
              width={400}
              height={100}
              className="h-16 w-auto md:h-24 mx-auto brightness-0 invert"
              priority
            />
          </div>
          <p className="text-xl md:text-2xl mb-4 opacity-90">{t('hero.title')}</p>
          <p className="text-lg md:text-xl mb-8 opacity-80">{t('hero.subtitle')}</p>

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
          </div>
        </div>
      </div>
    </section>
  );
}
