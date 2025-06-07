'use client';

import { useState } from 'react';
import SearchForm from '@/app/components/common/SearchForm';

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

export default function TestSearchPage() {
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = (params: SearchParams) => {
    setLastSearchParams(params);
    console.log('Search params:', params);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">SearchForm コンポーネントテスト</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* フルバージョン */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">フルバージョン</h2>
          <div className="p-6 border rounded-lg">
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={true}
              showCategoryFilter={true}
              showPriceFilter={true}
              compact={false}
            />
          </div>
        </div>

        {/* コンパクトバージョン */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">コンパクトバージョン</h2>
          <div className="p-6 border rounded-lg">
            <SearchForm
              onSearch={handleSearch}
              compact={true}
            />
          </div>

          <h3 className="text-xl font-semibold">カスタマイズ例</h3>
          
          {/* カテゴリのみ */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">カテゴリのみ</h4>
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={false}
              showCategoryFilter={true}
              showPriceFilter={false}
              compact={false}
            />
          </div>

          {/* 位置検索のみ */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">位置検索のみ</h4>
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={true}
              showCategoryFilter={false}
              showPriceFilter={false}
              compact={false}
            />
          </div>

          {/* 価格フィルタのみ */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">価格フィルタのみ</h4>
            <SearchForm
              onSearch={handleSearch}
              showLocationSearch={false}
              showCategoryFilter={false}
              showPriceFilter={true}
              compact={false}
            />
          </div>
        </div>
      </div>

      {/* 検索結果表示 */}
      {lastSearchParams && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">最後の検索パラメータ</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">キーワード:</span> {lastSearchParams.query || '(なし)'}</p>
            <p><span className="font-medium">カテゴリ:</span> {lastSearchParams.category || '(なし)'}</p>
            {lastSearchParams.station && (
              <div className="space-y-1">
                <p><span className="font-medium">選択された駅:</span></p>
                <div className="pl-4 space-y-1">
                  <p>駅名: {lastSearchParams.station.station_name}</p>
                  <p>読み方: {lastSearchParams.station.station_name_kana}</p>
                  <p>路線: {lastSearchParams.station.line_name}</p>
                  <p>会社: {lastSearchParams.station.company_name}</p>
                  <p>所在地: {lastSearchParams.station.muni_name}, {lastSearchParams.station.pref_name}</p>
                </div>
              </div>
            )}
            <p><span className="font-medium">最小価格:</span> {lastSearchParams.minPrice || '(なし)'}</p>
            <p><span className="font-medium">最大価格:</span> {lastSearchParams.maxPrice || '(なし)'}</p>
          </div>
          
          {/* URL生成例 */}
          <div className="mt-4 p-4 bg-white rounded border">
            <h4 className="font-medium mb-2">生成されるURL例:</h4>
            <code className="text-sm text-blue-600">
              {(() => {
                const params = new URLSearchParams();
                if (lastSearchParams.query) params.set('q', lastSearchParams.query);
                if (lastSearchParams.category) params.set('category', lastSearchParams.category);
                if (lastSearchParams.station) params.set('station_cds', lastSearchParams.station.station_cd);
                if (lastSearchParams.minPrice) params.set('minPrice', lastSearchParams.minPrice.toString());
                if (lastSearchParams.maxPrice) params.set('maxPrice', lastSearchParams.maxPrice.toString());
                return `/listings?${params.toString()}`;
              })()}
            </code>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">テスト手順:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>各フォームでキーワード、カテゴリ、駅名、価格を入力</li>
          <li>検索ボタンをクリックまたはEnterキーを押す</li>
          <li>下部に検索パラメータが表示されることを確認</li>
          <li>リセットボタンで内容がクリアされることを確認</li>
          <li>駅名検索で候補が表示されることを確認</li>
        </ol>
      </div>
    </div>
  );
} 