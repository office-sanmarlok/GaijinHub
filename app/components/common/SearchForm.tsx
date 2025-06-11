'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Check, MapPin, Train, Building, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';

export interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onLocationSelect?: (locations: LocationSelection[]) => void;
  defaultValues?: Partial<SearchParams>;
  showLocationSearch?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  compact?: boolean;
  locationOnlyMode?: boolean;
  hideSearchButton?: boolean;
  allowedLocationTypes?: ('station' | 'line' | 'municipality' | 'prefecture')[];
  className?: string;
  buttonClassName?: string;
}

export interface SearchParams {
  query?: string;
  category?: string;
  locations?: LocationSelection[];
  station_g_cds?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface LocationSelection {
  type: 'station' | 'line' | 'municipality' | 'prefecture';
  id: string;
  name: string;
  data: any;
}

// 後方互換性のため Station 型も保持
export interface Station {
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

const LOCATION_TYPES = [
  { value: 'station', label: '駅名', icon: Train },
  { value: 'line', label: '路線', icon: MapPin },
  { value: 'municipality', label: '市区町村', icon: Building },
  { value: 'prefecture', label: '都道府県', icon: Map }
] as const;

function LocationSearchComponent({ 
  locationType, 
  onLocationSelect, 
  placeholder 
}: {
  locationType: 'station' | 'line' | 'municipality' | 'prefecture';
  onLocationSelect: (location: LocationSelection) => void;
  placeholder: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = useCallback(async (term: string) => {
    if (!term) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      let endpoint = '';
      switch (locationType) {
        case 'station':
          endpoint = `/api/location/station-groups?keyword=${encodeURIComponent(term)}`;
          break;
        case 'line':
          endpoint = `/api/location/search?type=line&keyword=${encodeURIComponent(term)}`;
          break;
        case 'municipality':
          endpoint = `/api/location/search?type=municipality&keyword=${encodeURIComponent(term)}`;
          break;
        case 'prefecture':
          endpoint = `/api/location/prefectures`;
          break;
      }

      console.log(`Fetching ${locationType} from:`, endpoint);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`${locationType} response:`, data);
      
      let filteredResults = [];
      
      if (locationType === 'prefecture') {
        // 都道府県APIは {prefectures: [...]} 形式
        const prefectures = data.prefectures || [];
        filteredResults = prefectures.filter((pref: any) => 
          pref.name?.includes(term) || 
          pref.name_hiragana?.includes(term) ||
          pref.name_romaji?.includes(term)
        );
      } else if (locationType === 'station') {
        // 駅グループAPIは {data: [...], count: ...} 形式
        filteredResults = data.data || [];
      } else {
        // その他のAPIは直接配列形式
        filteredResults = data || [];
      }
      
      console.log(`${locationType} filtered results:`, filteredResults);
      setResults(filteredResults);
      setShowDropdown(true);
    } catch (error) {
      console.error('Location search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [locationType]);

  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearch, searchLocation]);

  const getDisplayName = (item: any) => {
    switch (locationType) {
      case 'station':
        return `${item.station_name} (${item.muni_name || ''}, ${item.pref_name || ''})`;
      case 'line':
        return `${item.line_ja} (${item.operator_ja || ''})`;
      case 'municipality':
        return `${item.name} (${item.prefecture_name || ''})`;
      case 'prefecture':
        return item.name || '';
      default:
        return '';
    }
  };

  const handleItemSelect = (item: any) => {
    console.log(`Selected ${locationType}:`, item);
    
    // 各タイプに対応する正しいIDフィールドを使用
    let itemId = '';
    switch (locationType) {
      case 'station':
        itemId = item.station_g_cd || '';
        break;
      case 'line':
        itemId = item.line_code || item.line_id || '';
        break;
      case 'municipality':
        itemId = item.id || item.muni_id || '';
        break;
      case 'prefecture':
        itemId = item.id || item.pref_id || '';
        break;
      default:
        itemId = '';
    }
    
    const locationSelection: LocationSelection = {
      type: locationType,
      id: itemId,
      name: getDisplayName(item),
      data: item
    };
    
    console.log('Created location selection:', locationSelection);
    
    onLocationSelect(locationSelection);
    setSearchTerm('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  const getIcon = () => {
    const IconComponent = LOCATION_TYPES.find(t => t.value === locationType)?.icon || MapPin;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {getIcon()}
        </div>
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              検索中...
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemSelect(item)}
                  className="w-full px-3 py-2 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                >
                  <div>
                    <div>
                      {getDisplayName(item)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm && (
            <div className="p-4 text-center text-sm text-gray-500">
              検索結果が見つかりません
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchForm({
  onSearch,
  onLocationSelect,
  defaultValues = {},
  showLocationSearch = true,
  showCategoryFilter = true,
  showPriceFilter = false,
  compact = false,
  locationOnlyMode = false,
  hideSearchButton = false,
  allowedLocationTypes = ['station', 'line', 'municipality', 'prefecture'],
  className,
  buttonClassName
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultValues.query || '');
  const [category, setCategory] = useState(defaultValues.category || 'all');
  const [selectedLocations, setSelectedLocations] = useState<LocationSelection[]>(defaultValues.locations || []);
  const [locationType, setLocationType] = useState<'station' | 'line' | 'municipality' | 'prefecture'>('station');
  const [minPrice, setMinPrice] = useState<number | undefined>(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(defaultValues.maxPrice);

  // 使用可能なロケーションタイプをフィルタリング
  const availableLocationTypes = LOCATION_TYPES.filter(type => allowedLocationTypes.includes(type.value));

  // 現在選択されているタイプが許可されていない場合、最初の許可されたタイプに変更
  useEffect(() => {
    if (!allowedLocationTypes.includes(locationType)) {
      setLocationType(allowedLocationTypes[0]);
    }
  }, [allowedLocationTypes, locationType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSearchParams: SearchParams = {
      query: query.trim() || undefined,
      category: category === 'all' ? undefined : category,
      minPrice: minPrice,
      maxPrice: maxPrice,
      locations: selectedLocations.length > 0 ? selectedLocations : undefined,
      station_g_cds: selectedLocations
        .filter(loc => loc.type === 'station')
        .map(loc => loc.id),
    };

    onSearch(newSearchParams);
  };

  const handleReset = () => {
    setQuery('');
    setCategory('all');
    setSelectedLocations([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    if (onLocationSelect) {
      onLocationSelect([]);
    }
  };

  const handleLocationAdd = (location: LocationSelection) => {
    // 異なるタイプの位置情報が既に選択されている場合は置き換える
    const currentType = selectedLocations.length > 0 ? selectedLocations[0].type : null;
    
    if (currentType && currentType !== location.type) {
      // 異なるタイプの場合は全てクリアして新しい選択を追加
      const newLocations = [location];
      setSelectedLocations(newLocations);
      if (onLocationSelect) {
        onLocationSelect(newLocations);
      }
    } else {
      // 同じタイプの場合は重複チェック後追加
      const isDuplicate = selectedLocations.some(loc => loc.id === location.id);
      if (!isDuplicate) {
        const newLocations = [...selectedLocations, location];
        setSelectedLocations(newLocations);
        if (onLocationSelect) {
          onLocationSelect(newLocations);
        }
      }
    }
  };

  const handleLocationRemove = (locationId: string) => {
    const newLocations = selectedLocations.filter(loc => loc.id !== locationId);
    setSelectedLocations(newLocations);
    if (onLocationSelect) {
      onLocationSelect(newLocations);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // 位置情報のタイプが変更された時に選択をクリア
  const handleLocationTypeChange = (newType: 'station' | 'line' | 'municipality' | 'prefecture') => {
    setLocationType(newType);
    setSelectedLocations([]);
    if (onLocationSelect) {
      onLocationSelect([]);
    }
  };

  // 位置検索のみモード
  if (locationOnlyMode) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* 位置タイプ選択 */}
        <div className="flex gap-2 flex-wrap">
          {availableLocationTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                onClick={() => handleLocationTypeChange(type.value)}
                className={cn(
                  "flex items-center gap-1",
                  locationType === type.value && "bg-white/30",
                  buttonClassName
                )}
              >
                <IconComponent className="h-3 w-3" />
                {type.label}
              </Button>
            );
          })}
        </div>

        {/* 位置検索 */}
        <LocationSearchComponent
          locationType={locationType}
          onLocationSelect={handleLocationAdd}
          placeholder={`${availableLocationTypes.find(t => t.value === locationType)?.label}を入力してください`}
        />

        {/* 選択された位置情報 */}
        {selectedLocations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">選択中:</div>
            <div className="flex flex-wrap gap-1">
              {selectedLocations.map((location) => (
                <Badge key={location.id} variant="secondary" className="flex items-center gap-1">
                  {location.name}
                  <button
                    type="button"
                    onClick={() => handleLocationRemove(location.id)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyPress}
      className={cn(
        'p-4 rounded-lg space-y-4',
        compact && 'flex items-center space-x-2 space-y-0 p-2',
        locationOnlyMode && 'space-y-2',
        className
      )}
    >
      {/* キーワード検索 */}
      {!locationOnlyMode && (
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
      )}

      <div className="grid grid-cols-1 gap-4">
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
          <div className="space-y-3">
            <label className="text-sm font-medium">
              エリア / Location
            </label>
            
            {/* 位置タイプ選択 */}
            <div className="flex gap-2 flex-wrap">
              {availableLocationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLocationTypeChange(type.value)}
                    className={cn(
                      "flex items-center gap-1",
                      locationType === type.value && "bg-white/30",
                      buttonClassName
                    )}
                  >
                    <IconComponent className="h-3 w-3" />
                    {type.label}
                  </Button>
                );
              })}
            </div>

            {/* 位置検索 */}
            <LocationSearchComponent
              locationType={locationType}
              onLocationSelect={handleLocationAdd}
              placeholder={`${availableLocationTypes.find(t => t.value === locationType)?.label}を入力してください`}
            />

            {/* 選択された位置情報 */}
            {selectedLocations.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">選択中:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLocations.map((location) => (
                    <Badge key={location.id} variant="secondary" className="flex items-center gap-1">
                      {location.name}
                      <button
                        type="button"
                        onClick={() => handleLocationRemove(location.id)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
      {!hideSearchButton && (
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className={cn("flex-1", buttonClassName)}>
            <Search className="h-4 w-4 mr-2" />
            検索 / Search
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className={cn(buttonClassName)}>
            リセット / Reset
          </Button>
        </div>
      )}
    </form>
  );
} 