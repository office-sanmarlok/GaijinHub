'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StationSearch from './StationSearch';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  defaultValues?: Partial<SearchParams>;
  showLocationSearch?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  compact?: boolean;
  className?: string;
}

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

const CATEGORIES = [
  { value: 'all', label: 'すべてのカテゴリ / All Categories' },
  { value: 'Housing', label: '住居 / Housing' },
  { value: 'Jobs', label: '求人 / Jobs' },
  { value: 'Items for Sale', label: '売ります / Items for Sale' },
  { value: 'Services', label: 'サービス / Services' }
];

export default function SearchForm({
  onSearch,
  defaultValues = {},
  showLocationSearch = true,
  showCategoryFilter = true,
  showPriceFilter = false,
  compact = false,
  className
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultValues.query || '');
  const [category, setCategory] = useState(defaultValues.category || 'all');
  const [station, setStation] = useState<Station | null>(defaultValues.station || null);
  const [minPrice, setMinPrice] = useState<number | undefined>(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(defaultValues.maxPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query: query.trim() || undefined,
      category: category === 'all' ? undefined : category,
      station,
      minPrice,
      maxPrice
    });
  };

  const handleReset = () => {
    setQuery('');
    setCategory('all');
    setStation(null);
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <div className="flex-1">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="キーワードを入力 / Enter keywords"
            className="w-full"
          />
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* キーワード検索 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          キーワード / Keywords
        </label>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="探したいものを入力してください / What are you looking for?"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* カテゴリ選択 */}
        {showCategoryFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              カテゴリ / Category
            </label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 位置検索 */}
        {showLocationSearch && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              最寄り駅 / Nearest Station
            </label>
            <StationSearch
              onStationSelect={setStation}
              placeholder="駅名を入力 / Enter station name"
            />
          </div>
        )}
      </div>

      {/* 価格フィルタ */}
      {showPriceFilter && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            価格帯 / Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="最小価格 / Min price"
              min="0"
            />
            <Input
              type="number"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="最大価格 / Max price"
              min="0"
            />
          </div>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <Search className="h-4 w-4 mr-2" />
          検索 / Search
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          リセット / Reset
        </Button>
      </div>
    </form>
  );
} 