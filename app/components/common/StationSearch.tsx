'use client';

import { Loader2, Search, Train, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StationSearchProps {
  onStationSelect: (station: Station | null) => void;
  placeholder?: string;
  debounceMs?: number;
  maxResults?: number;
  disabled?: boolean;
  defaultValue?: string;
  className?: string;
  error?: string;
  showClearButton?: boolean;
}

interface Station {
  station_g_cd: string;
  station_name: string;
  station_name_h: string;
  station_name_r: string;
  lines_info: Array<{
    line_name: string;
    company_name: string;
  }>;
  muni_name: string;
  muni_name_r?: string;
  pref_name: string;
  pref_name_r?: string;
  lat: number;
  lng: number;
  listing_count: number;
}

export default function StationSearch({
  onStationSelect,
  placeholder = '駅名を入力してください / Enter station name',
  debounceMs = 300,
  maxResults = 10,
  disabled = false,
  defaultValue = '',
  className,
  error,
  showClearButton = true,
}: StationSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  const searchRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const locale = useLocale();

  // デバウンス処理
  useEffect(() => {
    if (query.length < 1) {
      setStations([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStations(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, searchStations]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStations = async (searchQuery: string) => {
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setIsLoading(true);
    setSearchError('');

    try {
      const response = await fetch(
        `/api/location/station-groups?keyword=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
        { signal: abortController.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.data) {
        setStations(data.data);
        setIsOpen(data.data.length > 0);
      } else {
        setSearchError('検索に失敗しました');
        setStations([]);
        setIsOpen(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setSearchError('駅名の検索に失敗しました');
        setStations([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    const displayName = locale !== 'ja' && station.station_name_r ? station.station_name_r : station.station_name;
    setQuery(displayName);
    setIsOpen(false);
    onStationSelect(station);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedStation(null);
    setStations([]);
    setIsOpen(false);
    onStationSelect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value) {
      setSelectedStation(null);
      onStationSelect(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Train className="h-4 w-4" />
        </div>

        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => stations.length > 0 && setIsOpen(true)}
          disabled={disabled}
          className={cn('pl-10 pr-12', error && 'border-red-500 focus:border-red-500')}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {showClearButton && query && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {(error || searchError) && <p className="mt-1 text-sm text-red-600">{error || searchError}</p>}

      {/* 検索結果のドロップダウン */}
      {isOpen && stations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {stations.map((station) => (
            <button
              key={station.station_g_cd}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleStationSelect(station)}
            >
              <div className="flex items-center gap-2">
                <Train className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {locale !== 'ja' && station.station_name_r ? station.station_name_r : station.station_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({locale !== 'ja' && station.station_name_r ? station.station_name : station.station_name_h})
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {station.lines_info.map((line, index) => (
                      <span key={index}>
                        {index > 0 && ' • '}
                        {line.line_name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                    <span>
                      {locale !== 'ja' && station.muni_name_r ? station.muni_name_r : station.muni_name}, {locale !== 'ja' && station.pref_name_r ? station.pref_name_r : station.pref_name}
                    </span>
                    {station.listing_count > 0 && <span className="text-blue-600">{station.listing_count}件</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 結果なし表示 */}
      {isOpen && query.length > 0 && stations.length === 0 && !isLoading && !searchError && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>該当する駅が見つかりません</p>
          <p className="text-xs mt-1">別のキーワードで検索してください</p>
        </div>
      )}
    </div>
  );
}
