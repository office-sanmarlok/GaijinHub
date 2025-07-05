'use client';

import { Building, Map, MapPin, Search, Train, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationItem, PrefectureResponse, StationGroupResponse, LineResponse, MunicipalityResponse } from '@/types/location';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

export interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onLocationSelect?: (locations: LocationSelection[]) => void;
  defaultValues?: Partial<SearchParams>;
  showLocationSearch?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  showLanguageFilter?: boolean;
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
  language?: string;
}

export interface LocationSelection {
  type: 'station' | 'line' | 'municipality' | 'prefecture';
  id: string;
  name: string;
  data: Record<string, unknown>;
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

function LocationSearchComponent({
  locationType,
  onLocationSelect,
  placeholder,
}: {
  locationType: 'station' | 'line' | 'municipality' | 'prefecture';
  onLocationSelect: (location: LocationSelection) => void;
  placeholder: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('search');

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

  const searchLocation = useCallback(
    async (term: string) => {
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
            endpoint = '/api/location/prefectures';
            break;
        }

        logger.debug(`Fetching ${locationType} from:`, endpoint);
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        logger.debug(`${locationType} response:`, data);

        let filteredResults = [];

        if (locationType === 'prefecture') {
          // 都道府県APIは {prefectures: [...]} 形式
          const prefectures = data.prefectures || [];
          filteredResults = prefectures.filter(
            (pref: PrefectureResponse) =>
              pref.name?.includes(term) || pref.name_hiragana?.includes(term) || pref.name_romaji?.includes(term)
          );
        } else if (locationType === 'station') {
          // 駅グループAPIは {data: [...], count: ...} 形式
          filteredResults = data.data || [];
        } else {
          // その他のAPIは直接配列形式
          filteredResults = data || [];
        }

        logger.debug(`${locationType} filtered results:`, filteredResults);
        setResults(filteredResults);
        setShowDropdown(true);
      } catch (error) {
        logger.error('Location search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [locationType]
  );

  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearch, searchLocation]);

  const locale = useLocale();

  const getDisplayName = (item: LocationItem) => {
    switch (locationType) {
      case 'station': {
        const station = item as StationGroupResponse;
        const stationName = locale !== 'ja' && station.station_name_r ? station.station_name_r : station.station_name;
        const muniName = locale !== 'ja' && station.municipality_name_romaji ? station.municipality_name_romaji : station.muni_name;
        const prefName = locale !== 'ja' && station.prefecture_name_romaji ? station.prefecture_name_romaji : station.pref_name;
        return `${stationName} (${muniName || ''}, ${prefName || ''})`;
      }
      case 'line': {
        const line = item as LineResponse;
        const lineName = locale !== 'ja' && line.line_romaji ? line.line_romaji : line.line_ja;
        return `${lineName} (${line.operator_ja || ''})`;
      }
      case 'municipality': {
        const muni = item as MunicipalityResponse;
        const muniName = locale !== 'ja' && muni.romaji ? muni.romaji : muni.name;
        const prefName = locale !== 'ja' && muni.prefecture_name_romaji ? muni.prefecture_name_romaji : muni.prefecture_name;
        return `${muniName} (${prefName || ''})`;
      }
      case 'prefecture': {
        const pref = item as PrefectureResponse;
        const prefName = locale !== 'ja' && pref.name_romaji ? pref.name_romaji : pref.name;
        return prefName || '';
      }
      default:
        return '';
    }
  };

  const handleItemSelect = (item: LocationItem) => {
    logger.debug(`Selected ${locationType}:`, item);

    // 各タイプに対応する正しいIDフィールドを使用
    let itemId = '';
    switch (locationType) {
      case 'station': {
        const station = item as StationGroupResponse;
        itemId = station.station_g_cd || '';
        break;
      }
      case 'line': {
        const line = item as LineResponse;
        itemId = line.line_code || line.line_id || '';
        break;
      }
      case 'municipality': {
        const muni = item as MunicipalityResponse;
        itemId = muni.id || muni.muni_id || '';
        break;
      }
      case 'prefecture': {
        const pref = item as PrefectureResponse;
        itemId = pref.id || pref.pref_id || '';
        break;
      }
      default:
        itemId = '';
    }

    const locationSelection: LocationSelection = {
      type: locationType,
      id: itemId,
      name: getDisplayName(item),
      data: { ...item },
    };

    logger.debug('Created location selection:', locationSelection);

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
    const LOCATION_TYPES = [
      { value: 'station', icon: Train },
      { value: 'line', icon: MapPin },
      { value: 'municipality', icon: Building },
      { value: 'prefecture', icon: Map },
    ];
    const IconComponent = LOCATION_TYPES.find((t) => t.value === locationType)?.icon || MapPin;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{getIcon()}</div>
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
            <div className="p-4 text-center text-sm text-gray-500">{t('searching')}</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemSelect(item)}
                  className="w-full px-3 py-2 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                >
                  <div>
                    <div>{getDisplayName(item)}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            searchTerm && <div className="p-4 text-center text-sm text-gray-500">{t('noResults')}</div>
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
  showLanguageFilter = true,
  compact = false,
  locationOnlyMode = false,
  hideSearchButton = false,
  allowedLocationTypes = ['station', 'line', 'municipality', 'prefecture'],
  className,
  buttonClassName,
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultValues.query || '');
  const [category, setCategory] = useState(defaultValues.category || 'all');
  const [selectedLocations, setSelectedLocations] = useState<LocationSelection[]>(defaultValues.locations || []);
  const [locationType, setLocationType] = useState<'station' | 'line' | 'municipality' | 'prefecture'>('station');
  const [minPrice, setMinPrice] = useState<number | undefined>(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(defaultValues.maxPrice);
  const [language, setLanguage] = useState(defaultValues.language || 'all');
  const t = useTranslations('search');

  // 使用可能なロケーションタイプをフィルタリング
  const LOCATION_TYPES = [
    { value: 'station' as const, label: t('station'), icon: Train },
    { value: 'line' as const, label: t('line'), icon: MapPin },
    { value: 'municipality' as const, label: t('municipality'), icon: Building },
    { value: 'prefecture' as const, label: t('prefecture'), icon: Map },
  ];

  const CATEGORIES = [
    { value: 'all', label: t('allCategories') },
    { value: 'Housing', label: t('housing') },
    { value: 'Jobs', label: t('jobs') },
    { value: 'Items for Sale', label: t('itemsForSale') },
    { value: 'Services', label: t('services') },
  ];

  const LANGUAGES = [
    { value: 'all', label: t('allLanguages') },
    { value: 'ja', label: '日本語' },
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'ko', label: '한국어' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'pt', label: 'Português' },
    { value: 'id', label: 'Bahasa Indonesia' },
  ];

  const availableLocationTypes = LOCATION_TYPES.filter((type) => allowedLocationTypes.includes(type.value));

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
      station_g_cds: selectedLocations.filter((loc) => loc.type === 'station').map((loc) => loc.id),
      language: language === 'all' ? undefined : language,
    };

    onSearch(newSearchParams);
  };

  const handleReset = () => {
    setQuery('');
    setCategory('all');
    setSelectedLocations([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setLanguage('all');
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
      const isDuplicate = selectedLocations.some((loc) => loc.id === location.id);
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
    const newLocations = selectedLocations.filter((loc) => loc.id !== locationId);
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

  const getLocationPlaceholder = () => {
    switch (locationType) {
      case 'station':
        return t('stationPlaceholder');
      case 'line':
        return t('linePlaceholder');
      case 'municipality':
        return t('municipalityPlaceholder');
      case 'prefecture':
        return t('prefecturePlaceholder');
      default:
        return '';
    }
  };

  // 位置検索のみモード
  if (locationOnlyMode) {
    return (
      <div className={cn('space-y-4', className)}>
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
                className={cn('flex items-center gap-1', locationType === type.value && 'bg-white/30', buttonClassName)}
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
          placeholder={getLocationPlaceholder()}
        />

        {/* 選択された位置情報 */}
        {selectedLocations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">{t('selectedLocations')}:</div>
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
      <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
        <div className="flex-1">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('keywordsPlaceholder')}
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
          <label className="text-sm font-medium">{t('keywords')}</label>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('keywordsPlaceholder')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* カテゴリ選択 */}
        {showCategoryFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('category')}</label>
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

        {/* 言語選択 */}
        {showLanguageFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('language')}</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 位置検索 */}
        {showLocationSearch && (
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('location')}</label>

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
                      'flex items-center gap-1',
                      locationType === type.value && 'bg-white/30',
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
              placeholder={getLocationPlaceholder()}
            />

            {/* 選択された位置情報 */}
            {selectedLocations.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">{t('selectedLocations')}:</div>
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
          <label className="text-sm font-medium">{t('priceRange')}</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('minPrice')}
              min="0"
            />
            <Input
              type="number"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('maxPrice')}
              min="0"
            />
          </div>
        </div>
      )}

      {/* ボタン */}
      {!hideSearchButton && (
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className={cn('flex-1', buttonClassName)}>
            <Search className="h-4 w-4 mr-2" />
            {t('searchButton')}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className={cn(buttonClassName)}>
            {t('resetButton')}
          </Button>
        </div>
      )}
    </form>
  );
}
