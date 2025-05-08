'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Municipality, Station, LocationState } from '@/app/types/location';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface LocationInputProps {
  value: LocationState;
  onChange: (value: LocationState) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchLocation = useCallback(async (term: string) => {
    if (!term) return;
    setIsLoading(true);
    try {
      // 駅名検索
      const stationsRes = await fetch(`/api/location/search?type=station&keyword=${encodeURIComponent(term)}`);
      const stationsData = await stationsRes.json();
      console.log('Station data structure:', stationsData);
      if (stationsData.length > 0) {
        console.log('First station lines:', stationsData[0].lines);
      }
      setStations(stationsData);

      // 市区町村を検索
      const municipalitiesRes = await fetch(`/api/location/search?type=municipality&keyword=${encodeURIComponent(term)}`);
      const municipalitiesData = await municipalitiesRes.json();
      setMunicipalities(municipalitiesData);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 検索語が変更されたら検索を実行
  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch);
    }
  }, [debouncedSearch, searchLocation]);

  // 駅IDが設定されたときに駅情報をロード
  useEffect(() => {
    const loadStationInfo = async () => {
      if (value.stationId && !selectedStation) {
        try {
          const res = await fetch(`/api/location/search?type=station&keyword=${encodeURIComponent('')}&stationId=${value.stationId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setSelectedStation(data[0]);
            }
          }
        } catch (error) {
          console.error('Error loading station info:', error);
        }
      }
    };

    loadStationInfo();
  }, [value.stationId, selectedStation]);

  // 駅が選択されたときの処理
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);

    // 駅を選択したら、常に市区町村IDも設定する
    if (station.municipality_id) {
      onChange({
        ...value,
        hasLocation: true, // 位置情報ありに自動設定
        stationId: station.id,
        municipalityId: station.municipality_id,
      });
    } else {
      // municipality_idがない場合、別の方法から市区町村を取得する必要がある
      console.warn('Selected station does not have municipality_id');
      onChange({
        ...value,
        hasLocation: true,
        stationId: station.id,
        // municipalityIdはnullのまま
      });
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 位置情報の有無を切り替えるスイッチ */}
      <div className="flex items-center space-x-2">
        <Switch
          id="has-location"
          checked={value.hasLocation}
          onCheckedChange={(checked: boolean) => {
            onChange({
              ...value,
              hasLocation: checked,
              // 位置情報なしの場合は他の値をリセット
              municipalityId: checked ? value.municipalityId : null,
              stationId: checked ? value.stationId : null,
              isCityOnly: checked ? value.isCityOnly : false,
            });
            if (!checked) {
              setSelectedStation(null);
            }
          }}
        />
        <Label htmlFor="has-location">位置情報を含める</Label>
      </div>

      {value.hasLocation && (
        <>
          {/* 市区町村のみの公開を切り替えるスイッチ */}
          <div className="flex items-center space-x-2">
            <Switch
              id="city-only"
              checked={value.isCityOnly}
              onCheckedChange={(checked: boolean) => {
                onChange({
                  ...value,
                  isCityOnly: checked,
                  // 駅情報はリセットしない - 表示の仕方だけが変わる
                });
              }}
            />
            <Label htmlFor="city-only">市区町村のみ公開（駅名は非公開）</Label>
          </div>

          {/* 位置情報検索用のコマンドポップオーバー */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedStation ? (
                  <>
                    {selectedStation.name_kanji}
                    {value.isCityOnly && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (公開時は市区町村のみ表示)
                      </span>
                    )}
                  </>
                ) : (
                  "駅名で検索"
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="駅名を入力..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                {isLoading ? (
                  <CommandEmpty>検索中...</CommandEmpty>
                ) : (
                  <CommandGroup heading="駅">
                    {stations.map((station) => (
                      <CommandItem
                        key={station.id}
                        value={station.name_kanji}
                        onSelect={() => handleStationSelect(station)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.stationId === station.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {station.name_kanji}
                        {station.lines && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {Array.isArray(station.lines) && station.lines.length > 0
                              ? station.lines.map(line => {
                                  // 直接line_jaプロパティがある場合
                                  if (typeof line === 'object' && line && 'line_ja' in line) {
                                    return line.line_ja;
                                  }
                                  // lineオブジェクト中にlineプロパティがある場合
                                  else if (typeof line === 'object' && line && line.line && typeof line.line === 'object' && 'line_ja' in line.line) {
                                    return line.line.line_ja;
                                  }
                                  // その他の場合
                                  return '';
                                }).filter(Boolean).join('、')
                              : ''}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>

          {/* 選択された駅に対応する市区町村情報を表示 */}
          {selectedStation && selectedStation.municipality_id && (
            <div className="text-sm text-muted-foreground mt-1">
              所在地: {municipalities.find(m => m.id === selectedStation.municipality_id)?.name || ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}
