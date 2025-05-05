'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Filters from '@/app/components/search/Filters';
import { LocationSearch } from '@/app/components/location/LocationSearch';
import { LocationSearchParams } from '@/app/types/location';

interface SearchFiltersProps {
  initialFilters: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    stationId?: string;
    lineCode?: string;
    municipalityId?: string;
  };
}

export function SearchFilters({ initialFilters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (filters: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // キーワード検索
    if (filters.q) {
      params.set('q', filters.q);
    } else {
      params.delete('q');
    }

    // カテゴリー
    if (filters.category) {
      params.set('category', filters.category);
    } else {
      params.delete('category');
    }

    // 価格範囲
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice.toString());
    } else {
      params.delete('minPrice');
    }
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice.toString());
    } else {
      params.delete('maxPrice');
    }

    // 位置情報パラメータは保持
    router.push(`/listings/search?${params.toString()}`);
  };

  const handleLocationChange = (location: LocationSearchParams) => {
    const params = new URLSearchParams(searchParams.toString());

    // 位置情報
    if (location.stationId) {
      params.set('stationId', location.stationId);
      params.delete('lineCode');
      params.delete('municipalityId');
    } else if (location.lineCode) {
      params.set('lineCode', location.lineCode);
      params.delete('stationId');
      params.delete('municipalityId');
    } else if (location.municipalityId) {
      params.set('municipalityId', location.municipalityId);
      params.delete('stationId');
      params.delete('lineCode');
    } else {
      params.delete('stationId');
      params.delete('lineCode');
      params.delete('municipalityId');
    }

    router.push(`/listings/search?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Filters
        onFilterChange={handleFilterChange}
        initialValues={{
          q: initialFilters.q,
          category: initialFilters.category,
          minPrice: initialFilters.minPrice ? parseInt(initialFilters.minPrice, 10) : undefined,
          maxPrice: initialFilters.maxPrice ? parseInt(initialFilters.maxPrice, 10) : undefined,
        }}
      />
      <LocationSearch
        value={{
          stationId: initialFilters.stationId,
          lineCode: initialFilters.lineCode,
          municipalityId: initialFilters.municipalityId,
        }}
        onChange={handleLocationChange}
      />
    </div>
  );
} 