'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Filters from '@/app/components/search/Filters';
import ListingGrid from '@/app/components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";
import { Database } from '@/types/supabase';
import { SearchFilters } from './SearchFilters';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  description?: string;
  location?: string;
  imageUrl?: string;
  body?: string;
  municipality?: {
    name: string;
  } | null;
  station?: {
    name_kanji: string;
    lines?: {
      line_ja: string;
    }[] | null;
  } | null;
};

interface ListingFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  stationId?: string;
  lineCode?: string;
  municipalityId?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchListings = async (filters?: ListingFilters) => {
    try {
      setLoading(true);
      
      // URLSearchParamsを作成
      const queryParams = new URLSearchParams();
      
      if (filters?.q) {
        queryParams.append('q', filters.q);
      }
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      if (filters?.minPrice) {
        queryParams.append('minPrice', filters.minPrice.toString());
      }
      if (filters?.maxPrice) {
        queryParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters?.stationId) {
        queryParams.append('stationId', filters.stationId);
      }
      if (filters?.lineCode) {
        queryParams.append('lineCode', filters.lineCode);
      }
      if (filters?.municipalityId) {
        queryParams.append('municipalityId', filters.municipalityId);
      }
      
      // ページネーション
      const page = searchParams.get('page') || '1';
      queryParams.append('page', page);
      
      const apiUrl = `/api/listings?${queryParams.toString()}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(
          errorData?.message || 
          `API request error: ${response.status} ${response.statusText}`
        );
      }
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (!responseData.data) {
        throw new Error('API返却データが不正な形式です');
      }
      
      const { data, count: totalCount } = responseData;
      
      const formattedListings = data.map((listing: Listing) => ({
        ...listing,
        description: listing.body,
        location: listing.municipality?.name || '位置情報なし',
        imageUrl: listing.image_url || 'https://placehold.co/600x400',
      }));

      setListings(formattedListings);
      setCount(totalCount || 0);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filters: ListingFilters = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0', 10) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0', 10) : undefined,
      stationId: searchParams.get('stationId') || undefined,
      lineCode: searchParams.get('lineCode') || undefined,
      municipalityId: searchParams.get('municipalityId') || undefined,
    };
    fetchListings(filters);
  }, [searchParams]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">検索結果 ({count}件)</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside>
          <SearchFilters initialFilters={{
            q: searchParams.get('q') || undefined,
            category: searchParams.get('category') || undefined,
            minPrice: searchParams.get('minPrice') || undefined,
            maxPrice: searchParams.get('maxPrice') || undefined,
            stationId: searchParams.get('stationId') || undefined,
            lineCode: searchParams.get('lineCode') || undefined,
            municipalityId: searchParams.get('municipalityId') || undefined,
          }} />
        </aside>
        <main>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <ListingGrid listings={listings} viewMode={viewMode} />
          )}
        </main>
      </div>
    </div>
  );
} 