'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Filters from '@/components/search/Filters';
import ListingGrid from '@/components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";
import { Database } from '@/types/supabase';
import { SearchFilters } from './SearchFilters';
import { NearbySearchButton } from '@/components/search/NearbySearchButton';

type Listing = {
  id: string;
  title: string;
  body?: string;
  price?: number | null;
  category: string;
  user_id: string;
  created_at?: string | null;
  municipality?: {
    name: string;
  } | null;
  station?: {
    name_kanji: string;
    lines?: {
      line_ja: string;
    }[] | null;
  } | null;
  rep_image_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  
  // 表示用に追加されるフィールド
  description?: string;
  location?: string;
  imageUrl?: string;
};

type ListingWithDistance = Listing & {
  distance_meters?: number;
};

interface ListingFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  stationId?: string;
  lineCode?: string;
  municipalityId?: string;
  lat?: string;
  lng?: string;
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
      
      // 通常の検索パラメータを設定
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
      
      // 通常のリスティングAPIを呼び出す (検索機能)
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
      
      // 位置情報による並び替えが必要かチェック
      const hasLocationSort = Boolean(filters?.lat && filters?.lng);
      
      let formattedListings = [];
      
      if (hasLocationSort) {
        // 位置情報からの距離を計算して並び替え
        const latNum = parseFloat(filters?.lat || "0");
        const lngNum = parseFloat(filters?.lng || "0");
        
        formattedListings = data.map((listing: Listing) => {
          // 位置情報がある場合のみ距離を計算
          let distance = Number.MAX_VALUE;
          let distanceText = '';
          
          if (listing.lat && listing.lng) {
            // ハーバーサイン公式で距離を計算（メートル単位）
            const R = 6371000; // 地球の半径（メートル）
            const dLat = (listing.lat - latNum) * Math.PI / 180;
            const dLng = (listing.lng - lngNum) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(latNum * Math.PI / 180) * Math.cos(listing.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = R * c;
            
            distanceText = `約${Math.round(distance / 100) / 10}km`;
          }
          
          return {
            ...listing,
            description: listing.body,
            location: distanceText 
              ? `${listing.municipality?.name || ''}（${distanceText}）` 
              : listing.municipality?.name || '位置情報なし',
            imageUrl: listing.rep_image_url || 'https://placehold.co/600x400',
            distance_meters: distance // 並び替えに使用
          };
        });
        
        // 距離順に並び替え（位置情報がないものは最後に）
        formattedListings.sort((a: ListingWithDistance, b: ListingWithDistance) => {
          const distanceA = a.distance_meters || Number.MAX_VALUE;
          const distanceB = b.distance_meters || Number.MAX_VALUE;
          return distanceA - distanceB;
        });
      } else {
        // 通常の表示
        formattedListings = data.map((listing: Listing) => ({
          ...listing,
          description: listing.body,
          location: listing.municipality?.name || '位置情報なし',
          imageUrl: listing.rep_image_url || 'https://placehold.co/600x400'
        }));
      }

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
      lat: searchParams.get('lat') || undefined,
      lng: searchParams.get('lng') || undefined,
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
        <div className="flex gap-4">
          <NearbySearchButton />
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
          {searchParams.has('lat') && searchParams.has('lng') && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              <p className="text-sm">現在地から近い順に表示しています</p>
            </div>
          )}
        </aside>
        
        <main>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <ListingGrid listings={listings as any} viewMode={viewMode} />
          )}
        </main>
      </div>
    </div>
  );
} 
