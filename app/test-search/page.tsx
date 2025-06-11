'use client';

import { useState } from 'react';
import SearchForm from '@/components/common/SearchForm';
import { LocationSelection } from '@/components/common/SearchForm';

interface SearchParams {
  query?: string;
  category?: string;
  locations?: LocationSelection[];
  station_g_cds?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export default function TestSearchPage() {
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = (params: SearchParams) => {
    setLastSearchParams(params);
    console.log('Search params:', params);
    console.log('Station Group IDs:', params.station_g_cds);
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
            {lastSearchParams.locations && lastSearchParams.locations.length > 0 && (
              <div className="space-y-1">
                <p><span className="font-medium">選択された位置情報:</span></p>
                <div className="pl-4 space-y-1">
                  {lastSearchParams.locations.map((loc, index) => (
                    <p key={index}>{loc.type}: {loc.name} (ID: {loc.id})</p>
                  ))}
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
                
                // 位置情報に応じてパラメータをセット
                if (lastSearchParams.station_g_cds && lastSearchParams.station_g_cds.length > 0) {
                  params.set('station_g_cds', lastSearchParams.station_g_cds.join(','));
                } else if (lastSearchParams.locations && lastSearchParams.locations.length > 0) {
                  // 既存のlocationsロジック（必要であれば維持）
                  const stationCds = lastSearchParams.locations.filter(loc => loc.type === 'station').map(loc => loc.id);
                  if (stationCds.length > 0) params.set('station_cds', stationCds.join(','));
                  
                  const lineIds = lastSearchParams.locations.filter(loc => loc.type === 'line').map(loc => loc.id);
                  if (lineIds.length > 0) params.set('line_ids', lineIds.join(','));
                  
                  const muniIds = lastSearchParams.locations.filter(loc => loc.type === 'municipality').map(loc => loc.id);
                  if (muniIds.length > 0) params.set('muni_ids', muniIds.join(','));
                  
                  const prefIds = lastSearchParams.locations.filter(loc => loc.type === 'prefecture').map(loc => loc.id);
                  if (prefIds.length > 0) params.set('pref_ids', prefIds.join(','));
                }

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