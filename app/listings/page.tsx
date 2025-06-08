'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid, List } from 'lucide-react';
import SearchForm from '@/components/common/SearchForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';

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

interface ListingCard {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  currency: string;
  
  location: {
    has_location: boolean;
    is_city_only: boolean;
    station_name?: string;
    muni_name: string;
    pref_name: string;
    distance_meters?: number;
    distance_text?: string;
  };
  
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  primary_image_url?: string;
  
  created_at: string;
  updated_at: string;
  user_id: string;
  view_count: number;
  is_favorited?: boolean;
}

interface SearchResponse {
  success: boolean;
  listings: ListingCard[];
  total: number;
  page_info: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  search_info: {
    query?: string;
    category?: string;
    location_type: string | null;
    location_names: string[];
  };
  message?: string;
}

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // URLパラメータを取得
      const urlParams = new URLSearchParams();
      
      const q = searchParams.get('q');
      const category = searchParams.get('category');
      const station_cds = searchParams.get('station_cds');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const page = searchParams.get('page');

      if (q) urlParams.set('q', q);
      if (category) urlParams.set('category', category);
      if (station_cds) urlParams.set('station_cds', station_cds);
      if (minPrice) urlParams.set('min_price', minPrice);
      if (maxPrice) urlParams.set('max_price', maxPrice);
      
      // ページング
      const currentPage = parseInt(page || '1');
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      urlParams.set('limit', limit.toString());
      urlParams.set('offset', offset.toString());

      console.log('Fetching listings with params:', urlParams.toString());

      const response = await fetch(`/api/listings/search?${urlParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'データの取得に失敗しました');
      }

      setSearchResponse(data);
      setListings(data.listings);

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

  const handleSearch = (params: SearchParams) => {
    const newSearchParams = new URLSearchParams();
    
    if (params.query) newSearchParams.set('q', params.query);
    if (params.category) newSearchParams.set('category', params.category);
    if (params.station) newSearchParams.set('station_cds', params.station.station_cd);
    if (params.minPrice) newSearchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) newSearchParams.set('maxPrice', params.maxPrice.toString());
    
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

  const formatPrice = (price: number | null) => {
    if (!price) return '価格相談';
    return `¥${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Housing': return '🏠';
      case 'Jobs': return '💼';
      case 'Items for Sale': return '🛍️';
      case 'Services': return '🔧';
      default: return '📝';
    }
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
                {searchResponse.total}件の結果 
                {searchResponse.search_info.query && (
                  <span> - &quot;{searchResponse.search_info.query}&quot;</span>
                )}
              </p>
              
              {/* 検索条件の表示 */}
              <div className="flex gap-2">
                {searchResponse.search_info.category && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    {getCategoryIcon(searchResponse.search_info.category)} {searchResponse.search_info.category}
                  </span>
                )}
                {searchResponse.search_info.location_type === 'station' && searchResponse.search_info.location_names.length > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    🚉 {searchResponse.search_info.location_names[0]}
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
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {listings.map((listing) => (
              <Card 
                key={listing.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/listings/${listing.id}`)}
              >
                {/* 画像 */}
                {listing.primary_image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={listing.primary_image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-4">
                  {/* カテゴリとタイトル */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded mb-2">
                      {getCategoryIcon(listing.category)} {listing.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  
                  {/* 価格 */}
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    {formatPrice(listing.price)}
                  </p>
                  
                  {/* 説明 */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.body}
                  </p>
                  
                  {/* 位置情報 */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span>📍</span>
                    <span className="ml-1">
                      {listing.location.station_name && (
                        <span>{listing.location.station_name}駅, </span>
                      )}
                      {listing.location.muni_name}
                      {listing.location.pref_name && `, ${listing.location.pref_name}`}
                    </span>
                  </div>
                  
                  {/* 距離表示 */}
                  {listing.location.distance_text && (
                    <div className="text-sm text-blue-600 mt-1">
                      現在地から {listing.location.distance_text}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ページング */}
          {searchResponse && searchResponse.page_info.total_pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchResponse.page_info.current_page - 1)}
                  disabled={!searchResponse.page_info.has_prev}
                >
                  前のページ
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, searchResponse.page_info.total_pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === searchResponse.page_info.current_page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchResponse.page_info.current_page + 1)}
                  disabled={!searchResponse.page_info.has_next}
                >
                  次のページ
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 