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

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchLocation = useCallback(async (term: string) => {
    if (!term) return;
    setIsLoading(true);
    try {
      // 駅を検索
      const stationsRes = await fetch(`/api/location/search?type=station&keyword=${encodeURIComponent(term)}`);
      const stationsData = await stationsRes.json();
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
                  // 市区町村のみの場合は駅情報をリセット
                  stationId: checked ? null : value.stationId,
                });
              }}
            />
            <Label htmlFor="city-only">市区町村までの公開</Label>
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
                {value.stationId
                  ? stations.find((station) => station.id === value.stationId)?.name_kanji
                  : value.municipalityId
                  ? municipalities.find((muni) => muni.id === value.municipalityId)?.name
                  : "駅名・市区町村名で検索"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="駅名・市区町村名を入力..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                {isLoading ? (
                  <CommandEmpty>検索中...</CommandEmpty>
                ) : (
                  <>
                    {!value.isCityOnly && (
                      <CommandGroup heading="駅">
                        {stations.map((station) => (
                          <CommandItem
                            key={station.id}
                            value={station.name_kanji}
                            onSelect={() => {
                              onChange({
                                ...value,
                                stationId: station.id,
                                municipalityId: null, // 駅を選択したら市区町村はリセット
                              });
                              setOpen(false);
                            }}
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
                                {station.lines.map(line => line.line_ja).join('、')}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    <CommandGroup heading="市区町村">
                      {municipalities.map((municipality) => (
                        <CommandItem
                          key={municipality.id}
                          value={municipality.name}
                          onSelect={() => {
                            onChange({
                              ...value,
                              municipalityId: municipality.id,
                              stationId: null, // 市区町村を選択したら駅はリセット
                            });
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value.municipalityId === municipality.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {municipality.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
} 