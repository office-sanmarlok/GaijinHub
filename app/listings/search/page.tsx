'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Filters from '@/components/search/Filters';
import ListingGrid from '@/components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";
import { Database } from '@/types/supabase';
import { SearchFilters } from './SearchFilters';
import { SortToggle } from '@/components/search/SortToggle';

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
  const [sortType, setSortType] = useState<string>('new');
  const [forceRefresh, setForceRefresh] = useState(0); // 強制的な再取得のためのカウンター

  const fetchListings = useCallback(async (filters?: ListingFilters) => {
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
      
      // 明示的にソート順を指定
      queryParams.append('sort', sortType);
      
      // APIリクエストの準備
      let apiUrl = `/api/listings?${queryParams.toString()}`;
      
      // 位置情報による並び替えが必要かチェック
      const hasLocationSort = sortType === 'near';
      
      // 位置情報パラメータはAPI呼び出しには含める（URLには表示しない）
      if (hasLocationSort) {
        // セッションストレージから位置情報を取得
        const lat = sessionStorage.getItem('userLat');
        const lng = sessionStorage.getItem('userLng');
        if (lat && lng) {
          // APIリクエストには位置情報を含める
          apiUrl += `&lat=${lat}&lng=${lng}`;
        }
      }
      
      console.log('API URL:', apiUrl);
      console.log('Sort Type:', sortType);
      
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
      
      // フォーマット処理
      let formattedListings = data.map((listing: Listing) => {
        return {
          ...listing,
          description: listing.body,
          location: listing.municipality?.name || '位置情報なし',
          imageUrl: listing.rep_image_url || 'https://placehold.co/600x400'
        };
      });

      setListings(formattedListings);
      setCount(totalCount || 0);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [searchParams, sortType]);

  // セッションストレージのsortTypeを監視
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ソート順の初期設定
    const storedSortType = sessionStorage.getItem('sortType') || 'new';
    if (storedSortType !== sortType) {
      setSortType(storedSortType);
    }

    // セッションストレージの変更を監視
    const handleStorageChange = () => {
      const newSortType = sessionStorage.getItem('sortType') || 'new';
      if (newSortType !== sortType) {
        console.log(`Sort type changed from ${sortType} to ${newSortType}`);
        setSortType(newSortType);
        // 強制的な再取得を行うためのカウンターを更新
        setForceRefresh(prev => prev + 1);
      }
    };

    // カスタムイベントの監視（SortToggleコンポーネントから発行）
    const handleSortTypeChanged = () => {
      console.log('Custom sortTypeChanged event received');
      handleStorageChange();
    };

    // イベントリスナーを追加
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sortTypeChanged', handleSortTypeChanged);

    // 定期的にチェック (カスタムイベントが届かない場合の対策)
    const intervalId = setInterval(() => {
      const newSortType = sessionStorage.getItem('sortType') || 'new';
      if (newSortType !== sortType) {
        console.log(`Sort type changed (by interval) from ${sortType} to ${newSortType}`);
        setSortType(newSortType);
        setForceRefresh(prev => prev + 1);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sortTypeChanged', handleSortTypeChanged);
      clearInterval(intervalId);
    };
  }, [sortType]);

  // 検索パラメータかソート順が変わった時にデータを再取得
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const filters: ListingFilters = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0', 10) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0', 10) : undefined,
      stationId: searchParams.get('stationId') || undefined,
      lineCode: searchParams.get('lineCode') || undefined,
      municipalityId: searchParams.get('municipalityId') || undefined,
    };

    // 明示的にフェッチを実行
    fetchListings(filters);
    
  }, [searchParams, sortType, forceRefresh, fetchListings]);

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
        <div className="flex gap-4 items-center">
          <SortToggle />
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
