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
import { Municipality, Station, Line, LocationSearchParams } from '@/types/location';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface LocationSearchProps {
  value: LocationSearchParams;
  onChange: (value: LocationSearchParams) => void;
}

export function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'station' | 'line' | 'municipality'>('station');

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchLocation = useCallback(async (term: string) => {
    if (!term) return;
    setIsLoading(true);
    try {
      let data;
      switch (searchType) {
        case 'station': {
          const res = await fetch(`/api/location/search?type=station&keyword=${encodeURIComponent(term)}`);
          data = await res.json();
          setStations(data);
          break;
        }
        case 'line': {
          const res = await fetch(`/api/location/search?type=line&keyword=${encodeURIComponent(term)}`);
          data = await res.json();
          setLines(data);
          break;
        }
        case 'municipality': {
          const res = await fetch(`/api/location/search?type=municipality&keyword=${encodeURIComponent(term)}`);
          data = await res.json();
          setMunicipalities(data);
          break;
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch);
    }
  }, [debouncedSearch, searchLocation]);

  const getDisplayValue = () => {
    switch (searchType) {
      case 'station':
        return value.stationId
          ? stations.find((s) => s.id === value.stationId)?.name_kanji
          : '駅名で検索';
      case 'line':
        return value.lineCode
          ? lines.find((l) => l.line_code === value.lineCode)?.line_ja
          : '路線名で検索';
      case 'municipality':
        return value.municipalityId
          ? municipalities.find((m) => m.id === value.municipalityId)?.name
          : '市区町村名で検索';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 検索タイプ切り替えボタン */}
      <div className="flex gap-2">
        <Button
          variant={searchType === 'station' ? 'default' : 'outline'}
          onClick={() => setSearchType('station')}
        >
          駅名
        </Button>
        <Button
          variant={searchType === 'line' ? 'default' : 'outline'}
          onClick={() => setSearchType('line')}
        >
          路線
        </Button>
        <Button
          variant={searchType === 'municipality' ? 'default' : 'outline'}
          onClick={() => setSearchType('municipality')}
        >
          市区町村
        </Button>
      </div>

      {/* 検索コマンド */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {getDisplayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={`${searchType === 'station' ? '駅名' : searchType === 'line' ? '路線名' : '市区町村名'}を入力...`}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            {isLoading ? (
              <CommandEmpty>検索中...</CommandEmpty>
            ) : (
              <CommandGroup>
                {searchType === 'station' && stations.map((station) => (
                  <CommandItem
                    key={station.id}
                    value={station.name_kanji}
                    onSelect={() => {
                      onChange({
                        stationId: station.id,
                        lineCode: undefined,
                        municipalityId: undefined,
                      });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.stationId === station.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {station.name_kanji}
                    {station.lines && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {Array.isArray(station.lines) && station.lines.length > 0 
                          ? station.lines.map(line => {
                              if (typeof line === 'object' && line && 'line_ja' in line) {
                                return line.line_ja;
                              }
                              else if (typeof line === 'object' && line && line.line && typeof line.line === 'object' && 'line_ja' in line.line) {
                                return line.line.line_ja;
                              }
                              return '';
                            }).filter(Boolean).join('、')
                          : ''}
                      </span>
                    )}
                  </CommandItem>
                ))}
                {searchType === 'line' && lines.map((line) => (
                  <CommandItem
                    key={line.line_code}
                    value={line.line_ja}
                    onSelect={() => {
                      onChange({
                        stationId: undefined,
                        lineCode: line.line_code,
                        municipalityId: undefined,
                      });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.lineCode === line.line_code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {line.line_ja}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {line.operator_ja}
                    </span>
                  </CommandItem>
                ))}
                {searchType === 'municipality' && municipalities.map((municipality) => (
                  <CommandItem
                    key={municipality.id}
                    value={municipality.name}
                    onSelect={() => {
                      onChange({
                        stationId: undefined,
                        lineCode: undefined,
                        municipalityId: municipality.id,
                      });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.municipalityId === municipality.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {municipality.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
