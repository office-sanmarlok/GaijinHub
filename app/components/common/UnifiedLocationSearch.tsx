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
import { useDebounce } from '@/lib/hooks/useDebounce';

export interface LocationSelection {
  type: 'station' | 'line' | 'municipality' | 'prefecture';
  data: any;
}

interface UnifiedLocationSearchProps {
  onLocationSelect: (selection: LocationSelection | null) => void;
  placeholder?: string;
  searchTypes?: ('station' | 'line' | 'municipality' | 'prefecture')[];
  className?: string;
  value?: LocationSelection | null;
}

export default function UnifiedLocationSearch({
  onLocationSelect,
  placeholder = "場所を検索してください",
  searchTypes = ['station', 'line', 'municipality', 'prefecture'],
  className,
  value
}: UnifiedLocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchLocation = useCallback(async (term: string) => {
    if (!term) {
      setStations([]);
      setLines([]);
      setMunicipalities([]);
      setPrefectures([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const promises = [];
      
      if (searchTypes.includes('station')) {
        promises.push(
          fetch(`/api/location/search?type=station&keyword=${encodeURIComponent(term)}`)
            .then(res => res.json())
            .then(data => setStations(data || []))
        );
      }
      
      if (searchTypes.includes('line')) {
        promises.push(
          fetch(`/api/location/search?type=line&keyword=${encodeURIComponent(term)}`)
            .then(res => res.json())
            .then(data => setLines(data || []))
        );
      }
      
      if (searchTypes.includes('municipality')) {
        promises.push(
          fetch(`/api/location/search?type=municipality&keyword=${encodeURIComponent(term)}`)
            .then(res => res.json())
            .then(data => setMunicipalities(data || []))
        );
      }
      
      if (searchTypes.includes('prefecture')) {
        promises.push(
          fetch(`/api/location/prefectures`)
            .then(res => res.json())
            .then(data => {
              const filtered = (data || []).filter((pref: any) => 
                pref.pref_name?.includes(term) || pref.pref_name_kana?.includes(term)
              );
              setPrefectures(filtered);
            })
        );
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTypes]);

  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch);
    } else {
      setStations([]);
      setLines([]);
      setMunicipalities([]);
      setPrefectures([]);
    }
  }, [debouncedSearch, searchLocation]);

  const handleSelect = (type: LocationSelection['type'], data: any) => {
    const selection: LocationSelection = { type, data };
    onLocationSelect(selection);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    
    switch (value.type) {
      case 'station':
        return `${value.data.name_kanji || value.data.station_name}駅`;
      case 'line':
        return `${value.data.line_name}線`;
      case 'municipality':
        return value.data.muni_name || value.data.municipality_name;
      case 'prefecture':
        return value.data.pref_name;
      default:
        return placeholder;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {getDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {isLoading ? (
            <CommandEmpty>検索中...</CommandEmpty>
          ) : (
            <>
              {searchTypes.includes('station') && stations.length > 0 && (
                <CommandGroup heading="駅">
                  {stations.map((station) => (
                    <CommandItem
                      key={`station-${station.id || station.station_cd}`}
                      value={station.name_kanji || station.station_name}
                      onSelect={() => handleSelect('station', station)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.type === 'station' && value?.data?.id === station.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {station.name_kanji || station.station_name}駅
                      {station.line_name && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {station.line_name}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchTypes.includes('line') && lines.length > 0 && (
                <CommandGroup heading="路線">
                  {lines.map((line) => (
                    <CommandItem
                      key={`line-${line.id || line.line_cd}`}
                      value={line.line_name}
                      onSelect={() => handleSelect('line', line)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.type === 'line' && value?.data?.id === line.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {line.line_name}線
                      {line.company_name && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {line.company_name}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchTypes.includes('municipality') && municipalities.length > 0 && (
                <CommandGroup heading="市区町村">
                  {municipalities.map((municipality) => (
                    <CommandItem
                      key={`municipality-${municipality.id || municipality.muni_id}`}
                      value={municipality.muni_name || municipality.municipality_name}
                      onSelect={() => handleSelect('municipality', municipality)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.type === 'municipality' && value?.data?.id === municipality.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {municipality.muni_name || municipality.municipality_name}
                      {municipality.pref_name && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {municipality.pref_name}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchTypes.includes('prefecture') && prefectures.length > 0 && (
                <CommandGroup heading="都道府県">
                  {prefectures.map((prefecture) => (
                    <CommandItem
                      key={`prefecture-${prefecture.id || prefecture.pref_id}`}
                      value={prefecture.pref_name}
                      onSelect={() => handleSelect('prefecture', prefecture)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.type === 'prefecture' && value?.data?.id === prefecture.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {prefecture.pref_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading && 
               stations.length === 0 && 
               lines.length === 0 && 
               municipalities.length === 0 && 
               prefectures.length === 0 && 
               searchTerm && (
                <CommandEmpty>検索結果が見つかりません</CommandEmpty>
              )}
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 