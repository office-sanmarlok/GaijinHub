'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid, List } from 'lucide-react';
import SearchForm from '@/components/common/SearchForm';
import { ListingCard } from '@/components/listings/ListingCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from '@/types/supabase';
// import { Badge } from '@/components/ui/badge';
import type { SearchParams as FormSearchParams, LocationSelection } from '@/components/common/SearchForm';

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

// APIレスポンスの型定義
// interface ApiListingItem extends Database['public']['Functions']['search_listings_by_distance']['Returns'][number] {}
type ApiListingItem = Database['public']['Functions']['search_listings_by_distance']['Returns'][number];

interface SearchResponse {
  listings: ApiListingItem[];
  location_info: {
    location_type: string | null;
    location_names: string[];
  };
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
  message?: string;
}

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // URLパラメータを取得
      const params = new URLSearchParams(searchParams.toString());
      
      // ページング
      const currentPage = parseInt(params.get('page') || '1');
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      console.log('Fetching listings with params:', params.toString());

      const response = await fetch(`/api/listings/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      console.log('API Response:', data);
      
      setSearchResponse(data);
      // 新しいリスティングをセットする、または既存のリスティングに追加する（無限スクロールの場合）
      setListings(prevListings => offset === 0 ? data.listings : [...prevListings, ...data.listings]);

    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (params: FormSearchParams) => {
    const newSearchParams = new URLSearchParams();
    
    if (params.query) newSearchParams.set('q', params.query);
    if (params.category) newSearchParams.set('category', params.category);

    if (params.locations && params.locations.length > 0) {
      const station_cds = params.locations.filter(l => l.type === 'station').map(l => l.id);
      const line_ids = params.locations.filter(l => l.type === 'line').map(l => l.id);
      const muni_ids = params.locations.filter(l => l.type === 'municipality').map(l => l.id);
      const pref_ids = params.locations.filter(l => l.type === 'prefecture').map(l => l.id);

      if (station_cds.length > 0) newSearchParams.set('station_cds', station_cds.join(','));
      if (line_ids.length > 0) newSearchParams.set('line_ids', line_ids.join(','));
      if (muni_ids.length > 0) newSearchParams.set('muni_ids', muni_ids.join(','));
      if (pref_ids.length > 0) newSearchParams.set('pref_ids', pref_ids.join(','));
    }

    if (params.minPrice) newSearchParams.set('min_price', params.minPrice.toString());
    if (params.maxPrice) newSearchParams.set('max_price', params.maxPrice.toString());
    
    // ページをリセット
    newSearchParams.delete('page');
    
    router.push(`/listings?${newSearchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      newSearchParams.delete('page');
    } else {
      newSearchParams.set('page', page.toString());
    }
    router.push(`/listings?${newSearchParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">検索中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchListings}>再試行</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          物件検索 / Listing Search
        </h1>
        
        {/* 検索フォーム */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={true}
              showCategoryFilter={true}
              showPriceFilter={true}
              defaultValues={{
                query: searchParams.get('q') || undefined,
                category: searchParams.get('category') || undefined
              }}
            />
          </CardContent>
        </Card>

        {/* 検索結果情報 */}
        {searchResponse && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                {listings.length > 0 ? `${listings.length}件以上の結果` : '結果がありません'}
                {searchParams.get('q') && (
                  <span> - &quot;{searchParams.get('q')}&quot;</span>
                )}
              </p>
              
              {/* 検索条件の表示 */}
              <div className="flex gap-2">
                {searchParams.get('category') && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    {searchParams.get('category')}
                  </span>
                )}
                {searchResponse.location_info.location_type && searchResponse.location_info.location_names.length > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    {searchResponse.location_info.location_type === 'station' && '🚉 '}
                    {searchResponse.location_info.location_type === 'line' && '🚆 '}
                    {searchResponse.location_info.location_type === 'municipality' && '🏙️ '}
                    {searchResponse.location_info.location_names.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* 表示切り替え */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 検索結果 */}
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">検索条件に該当する物件が見つかりませんでした</p>
          <Button variant="outline" onClick={() => router.push('/listings')}>
            すべての物件を見る
          </Button>
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing as any} viewMode={viewMode} />
            ))}
          </div>

          {/* ページネーション / もっと見るボタン */}
          <div className="mt-8 text-center">
            {loading && <p>読み込み中...</p>}
            {!loading && searchResponse?.pagination.has_more && (
               <Button 
                 onClick={() => handlePageChange( (searchResponse.pagination.offset / searchResponse.pagination.limit) + 2 )}
                 variant="outline"
               >
                 もっと見る
               </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
} 