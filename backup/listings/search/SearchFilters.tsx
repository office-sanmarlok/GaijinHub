'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Filters from '@/components/search/Filters';

interface SearchFiltersProps {
  initialFilters: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    stationId?: string;
    lineCode?: string;
    municipalityId?: string;
    prefectureId?: string;
    radius?: string;
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
    prefectureId?: number;
    municipalityId?: number;
    lineCode?: string;
    stationCode?: string;
    radius?: number;
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

    // 価格帯
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

    // 地域フィルター
    if (filters.prefectureId) {
      params.set('prefectureId', filters.prefectureId.toString());
    } else {
      params.delete('prefectureId');
    }

    if (filters.municipalityId) {
      params.set('municipalityId', filters.municipalityId.toString());
    } else {
      params.delete('municipalityId');
    }

    if (filters.lineCode) {
      params.set('lineCode', filters.lineCode);
    } else {
      params.delete('lineCode');
    }

    if (filters.stationCode) {
      params.set('stationCode', filters.stationCode);
    } else {
      params.delete('stationCode');
    }

    // 距離フィルター
    if (filters.radius) {
      params.set('radius', filters.radius.toString());
    } else {
      params.delete('radius');
    }

    // ページをリセット
    params.delete('page');

    router.push(`/listings/search?${params.toString()}`);
  };

  return (
    <div>
      <Filters
        onFilterChange={handleFilterChange}
        initialValues={{
          q: initialFilters.q,
          category: initialFilters.category,
          minPrice: initialFilters.minPrice ? parseInt(initialFilters.minPrice, 10) : undefined,
          maxPrice: initialFilters.maxPrice ? parseInt(initialFilters.maxPrice, 10) : undefined,
          prefectureId: initialFilters.prefectureId ? parseInt(initialFilters.prefectureId, 10) : undefined,
          municipalityId: initialFilters.municipalityId ? parseInt(initialFilters.municipalityId, 10) : undefined,
          lineCode: initialFilters.lineCode,
          stationCode: initialFilters.stationId, // stationId -> stationCode に変更
          radius: initialFilters.radius ? parseInt(initialFilters.radius, 10) : undefined,
        }}
      />
    </div>
  );
} 
