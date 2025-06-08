'use client';

import { useState } from 'react';
import StationSearch from '@/components/common/StationSearch';

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

export default function TestStationPage() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">駅名検索テスト</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            駅名を検索してください
          </label>
          <StationSearch
            onStationSelect={setSelectedStation}
            placeholder="例: 渋谷、新宿、東京..."
          />
        </div>

        {selectedStation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">選択された駅：</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">駅名:</span> {selectedStation.station_name}</p>
              <p><span className="font-medium">読み方:</span> {selectedStation.station_name_kana}</p>
              <p><span className="font-medium">路線:</span> {selectedStation.line_name}</p>
              <p><span className="font-medium">運営会社:</span> {selectedStation.company_name}</p>
              <p><span className="font-medium">所在地:</span> {selectedStation.muni_name}, {selectedStation.pref_name}</p>
              <p><span className="font-medium">駅コード:</span> {selectedStation.station_cd}</p>
              {selectedStation.lat && selectedStation.lng && (
                <p><span className="font-medium">座標:</span> {selectedStation.lat}, {selectedStation.lng}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">テスト手順:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>検索ボックスに駅名を入力してください</li>
            <li>候補一覧が表示されるまで待ちます</li>
            <li>候補から駅を選択してください</li>
            <li>選択した駅の情報が下に表示されます</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 