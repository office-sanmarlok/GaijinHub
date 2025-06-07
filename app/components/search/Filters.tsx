'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { LocationSelector, LocationSelection } from '../location/LocationSelector';

const categories = [
  { id: 'Housing', name: 'Housing' },
  { id: 'Jobs', name: 'Jobs' },
  { id: 'Items for Sale', name: 'Items for Sale' },
  { id: 'Services', name: 'Services' },
] as const;

interface FiltersProps {
  onFilterChange: (filters: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    // 地域フィルター - 新スキーマではstringに変更
    prefectureId?: string;
    municipalityId?: string;
    lineCode?: string;
    stationCode?: string;
    // 距離フィルター
    radius?: number;
  }) => void;
  initialValues?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    prefectureId?: string;
    municipalityId?: string;
    lineCode?: string;
    stationCode?: string;
    radius?: number;
  };
}

export default function Filters({ onFilterChange, initialValues }: FiltersProps) {
  const [searchQuery, setSearchQuery] = useState(initialValues?.q || '');
  const [category, setCategory] = useState(initialValues?.category);
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice?.toString() || '');
  const [radius, setRadius] = useState(initialValues?.radius?.toString() || '10');
  
  // 地域選択の状態
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    prefectureId: initialValues?.prefectureId,
    prefectureName: undefined, // APIから取得される
    municipalityId: initialValues?.municipalityId,
    municipalityName: undefined, // APIから取得される
    lineCode: initialValues?.lineCode,
    lineName: undefined, // APIから取得される
    stationCode: initialValues?.stationCode,
    stationName: undefined, // APIから取得される
  });

  useEffect(() => {
    if (initialValues) {
      setSearchQuery(initialValues.q || '');
      setCategory(initialValues.category);
      setMinPrice(initialValues.minPrice?.toString() || '');
      setMaxPrice(initialValues.maxPrice?.toString() || '');
      setRadius(initialValues.radius?.toString() || '10');
      setLocationSelection({
        prefectureId: initialValues.prefectureId,
        prefectureName: undefined,
        municipalityId: initialValues.municipalityId,
        municipalityName: undefined,
        lineCode: initialValues.lineCode,
        lineName: undefined,
        stationCode: initialValues.stationCode,
        stationName: undefined,
      });
    }
  }, [initialValues]);

  const handleApplyFilters = () => {
    onFilterChange({
      q: searchQuery || undefined,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      prefectureId: locationSelection.prefectureId,
      municipalityId: locationSelection.municipalityId,
      lineCode: locationSelection.lineCode,
      stationCode: locationSelection.stationCode,
      radius: radius ? Number(radius) : undefined,
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategory(undefined);
    setMinPrice('');
    setMaxPrice('');
    setRadius('10');
    setLocationSelection({
      prefectureId: undefined,
      prefectureName: undefined,
      municipalityId: undefined,
      municipalityName: undefined,
      lineCode: undefined,
      lineName: undefined,
      stationCode: undefined,
      stationName: undefined,
    });
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      {/* 基本的な検索フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>基本フィルター</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>キーワード検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="キーワードを入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>カテゴリー</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>価格帯</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="下限"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <Input
                type="number"
                placeholder="上限"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 地域フィルター */}
      <LocationSelector
        value={locationSelection}
        onChange={setLocationSelection}
        showStations={true}
        showLines={true}
        showMunicipalities={true}
      />

      {/* 距離フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            距離フィルター
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>検索半径（km）</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger>
                <SelectValue placeholder="検索半径を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1km</SelectItem>
                <SelectItem value="3">3km</SelectItem>
                <SelectItem value="5">5km</SelectItem>
                <SelectItem value="10">10km</SelectItem>
                <SelectItem value="20">20km</SelectItem>
                <SelectItem value="50">50km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* フィルター実行ボタン */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <Button onClick={handleApplyFilters}>フィルターを適用</Button>
            <Button variant="outline" onClick={handleReset}>
              すべてリセット
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 