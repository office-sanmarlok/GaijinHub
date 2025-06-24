'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid, List } from 'lucide-react';
import SearchForm from '@/components/common/SearchForm';
import { ListingCard } from '@/components/listings/ListingCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type {
  SearchParams as FormSearchParams,
  LocationSelection,
} from '@/components/common/SearchForm';
import { ListingCardData } from '@/types/listing';

interface SearchResponse {
  listings: ListingCardData[];
  location_info: {
    location_type: string | null;
    location_names: string[];
  };
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
    total_count: number;
  };
  message?: string;
}

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(searchParams.toString());
      
      const currentPage = parseInt(params.get('page') || '1');
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/listings/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      setSearchResponse(data);
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
    console.log('=== HANDLE SEARCH DEBUG ===');
    console.log('Search params received:', params);
    
    const newSearchParams = new URLSearchParams();
    
    if (params.query) newSearchParams.set('q', params.query);
    if (params.category) newSearchParams.set('category', params.category);

    if (params.locations && params.locations.length > 0) {
      const station_cds = params.locations.filter(l => l.type === 'station').map(l => l.id);
      const line_ids = params.locations.filter(l => l.type === 'line').map(l => l.id);
      const muni_ids = params.locations.filter(l => l.type === 'municipality').map(l => l.id);
      const pref_ids = params.locations.filter(l => l.type === 'prefecture').map(l => l.id);

      console.log('Location filtering results:', {
        station_cds,
        line_ids,
        muni_ids,
        pref_ids
      });

      if (station_cds.length > 0) newSearchParams.set('station_g_cds', station_cds.join(','));
      if (line_ids.length > 0) newSearchParams.set('line_ids', line_ids.join(','));
      if (muni_ids.length > 0) newSearchParams.set('muni_ids', muni_ids.join(','));
      if (pref_ids.length > 0) newSearchParams.set('pref_ids', pref_ids.join(','));
    }

    if (params.minPrice) newSearchParams.set('min_price', params.minPrice.toString());
    if (params.maxPrice) newSearchParams.set('max_price', params.maxPrice.toString());
    
    newSearchParams.delete('page');
    
    const finalUrl = `/listings?${newSearchParams.toString()}`;
    console.log('Final search URL:', finalUrl);
    
    router.push(finalUrl);
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

  const renderSearchTags = () => {
    const tags = [];
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');

    if (q) {
      tags.push(`キーワード: "${q}"`);
    }
    if (category) {
      tags.push(category);
    }
    if (
      searchResponse?.location_info.location_type &&
      searchResponse.location_info.location_names.length > 0
    ) {
      const { location_type, location_names } = searchResponse.location_info;
      const icon =
        location_type === 'station'
          ? '🚉'
          : location_type === 'line'
          ? '🚆'
          : location_type === 'municipality'
          ? '🏙️'
          : '';
      tags.push(`${icon} ${location_names.join(', ')}`.trim());
    }

    let priceText = '';
    if (minPrice && maxPrice) {
      priceText = `価格: ¥${Number(minPrice).toLocaleString()} - ¥${Number(
        maxPrice
      ).toLocaleString()}`;
    } else if (minPrice) {
      priceText = `価格: ¥${Number(minPrice).toLocaleString()}〜`;
    } else if (maxPrice) {
      priceText = `価格: 〜¥${Number(maxPrice).toLocaleString()}`;
    }
    if (priceText) {
      tags.push(priceText);
    }

    if (tags.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">検索条件:</p>
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  if (loading && listings.length === 0) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          物件検索 / Listing Search
        </h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={true}
              showCategoryFilter={true}
              showPriceFilter={true}
              defaultValues={{
                query: searchParams.get('q') || undefined,
                category: searchParams.get('category') || undefined,
                minPrice: searchParams.has('min_price')
                  ? Number(searchParams.get('min_price'))
                  : undefined,
                maxPrice: searchParams.has('max_price')
                  ? Number(searchParams.get('max_price'))
                  : undefined,
                locations: (() => {
                  // URLパラメータから選択された場所情報を復元
                  const locations: LocationSelection[] = [];
                  
                  // 駅（駅グループ）
                  const stationGCds = searchParams.get('station_g_cds')?.split(',').filter(Boolean);
                  if (stationGCds?.length) {
                    stationGCds.forEach(id => {
                      locations.push({
                        type: 'station',
                        id,
                        name: `駅ID: ${id}`, // 実際の駅名は location_info から取得されるので仮の名前
                        data: { station_g_cd: id }
                      });
                    });
                  }
                  
                  // 路線
                  const lineIds = searchParams.get('line_ids')?.split(',').filter(Boolean);
                  if (lineIds?.length) {
                    lineIds.forEach(id => {
                      locations.push({
                        type: 'line',
                        id,
                        name: `路線ID: ${id}`, // 実際の路線名は location_info から取得されるので仮の名前
                        data: { line_code: id }
                      });
                    });
                  }
                  
                  // 市区町村
                  const muniIds = searchParams.get('muni_ids')?.split(',').filter(Boolean);
                  if (muniIds?.length) {
                    muniIds.forEach(id => {
                      locations.push({
                        type: 'municipality',
                        id,
                        name: `市区町村ID: ${id}`, // 実際の市区町村名は location_info から取得されるので仮の名前
                        data: { id }
                      });
                    });
                  }
                  
                  // 都道府県
                  const prefIds = searchParams.get('pref_ids')?.split(',').filter(Boolean);
                  if (prefIds?.length) {
                    prefIds.forEach(id => {
                      locations.push({
                        type: 'prefecture',
                        id,
                        name: `都道府県ID: ${id}`, // 実際の都道府県名は location_info から取得されるので仮の名前
                        data: { id }
                      });
                    });
                  }
                  
                  return locations.length > 0 ? locations : undefined;
                })(),
              }}
            />
          </CardContent>
        </Card>

        {searchResponse && (
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-600">
                {searchResponse.pagination.total_count > 0
                  ? `${searchResponse.pagination.total_count}件の結果`
                  : '結果がありません'}
              </p>
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
             <div className="flex flex-wrap items-center gap-2 p-4 mb-4 bg-white rounded-lg shadow">
               {renderSearchTags()}
             </div>
          </div>
        )}
      </div>

      {listings.length > 0 ? (
        <>
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
            ))}
          </div>

          <div className="mt-8 text-center">
            {!loading && searchResponse?.pagination.has_more && (
              <Button
                onClick={() =>
                  handlePageChange(
                    (searchResponse.pagination.offset /
                      searchResponse.pagination.limit) + 2
                  )
                }
                variant="outline"
              >
                もっと見る
              </Button>
            )}
             {loading && listings.length > 0 && <p className="mt-4">読み込み中...</p>}
          </div>
        </>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">条件に合う物件が見つかりませんでした。</p>
          </div>
        )
      )}
    </div>
  );
} 