'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, MapPin, Train, Building } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface Prefecture {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
  prefecture_id: string;
}

interface Line {
  id: string;
  name: string;
  company_name?: string;
}

interface Station {
  id: string;
  name: string;
  line_name?: string;
}

export interface LocationSelection {
  prefectureId?: string;
  prefectureName?: string;
  municipalityId?: string;
  municipalityName?: string;
  lineCode?: string;
  lineName?: string;
  stationCode?: string;
  stationName?: string;
}

interface LocationSelectorProps {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  allowMultipleStations?: boolean;
  showStations?: boolean;
  showLines?: boolean;
  showMunicipalities?: boolean;
  className?: string;
}

export function LocationSelector({
  value,
  onChange,
  allowMultipleStations = false,
  showStations = true,
  showLines = true,
  showMunicipalities = true,
  className,
}: LocationSelectorProps) {
  // State for data
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  // State for popover visibility
  const [prefectureOpen, setPrefectureOpen] = useState(false);
  const [municipalityOpen, setMunicipalityOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);

  // State for loading
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);

  // Load prefectures on mount
  useEffect(() => {
    const loadPrefectures = async () => {
      try {
        const response = await fetch('/api/location/prefectures');
        const data = await response.json();
        setPrefectures(data.prefectures || []);
      } catch (error) {
        console.error('都道府県の取得に失敗しました:', error);
      }
    };
    loadPrefectures();
  }, []);

  // Load municipalities when prefecture changes
  useEffect(() => {
    if (!value.prefectureId) {
      setMunicipalities([]);
      return;
    }

    const loadMunicipalities = async () => {
      setLoadingMunicipalities(true);
      try {
        const response = await fetch(`/api/location/municipalities/${value.prefectureId}`);
        const data = await response.json();
        setMunicipalities(data.municipalities || data.data || []);
      } catch (error) {
        console.error('市区町村の取得に失敗しました:', error);
      } finally {
        setLoadingMunicipalities(false);
      }
    };
    loadMunicipalities();
  }, [value.prefectureId]);

  // Load lines when prefecture changes
  useEffect(() => {
    if (!value.prefectureId) {
      setLines([]);
      return;
    }

    const loadLines = async () => {
      setLoadingLines(true);
      try {
        const response = await fetch(`/api/location/lines?prefectureId=${value.prefectureId}`);
        const data = await response.json();
        setLines(data.lines || []);
      } catch (error) {
        console.error('路線の取得に失敗しました:', error);
      } finally {
        setLoadingLines(false);
      }
    };
    loadLines();
  }, [value.prefectureId]);

  // Load stations when line changes
  useEffect(() => {
    if (!value.lineCode) {
      setStations([]);
      return;
    }

    const loadStations = async () => {
      setLoadingStations(true);
      try {
        const response = await fetch(`/api/location/stations/${value.lineCode}`);
        const data = await response.json();
        setStations(data.stations || []);
      } catch (error) {
        console.error('駅の取得に失敗しました:', error);
      } finally {
        setLoadingStations(false);
      }
    };
    loadStations();
  }, [value.lineCode]);

  const handlePrefectureSelect = (prefecture: Prefecture) => {
    onChange({
      prefectureId: prefecture.id,
      prefectureName: prefecture.name,
      // Clear other selections
      municipalityId: undefined,
      municipalityName: undefined,
      lineCode: undefined,
      lineName: undefined,
      stationCode: undefined,
      stationName: undefined,
    });
    setPrefectureOpen(false);
  };

  const handleMunicipalitySelect = (municipality: Municipality) => {
    onChange({
      ...value,
      municipalityId: municipality.id,
      municipalityName: municipality.name,
      // Clear station/line selections
      lineCode: undefined,
      lineName: undefined,
      stationCode: undefined,
      stationName: undefined,
    });
    setMunicipalityOpen(false);
  };

  const handleLineSelect = (line: Line) => {
    onChange({
      ...value,
      lineCode: line.id,
      lineName: line.name,
      // Clear station selection
      stationCode: undefined,
      stationName: undefined,
    });
    setLineOpen(false);
  };

  const handleStationSelect = (station: Station) => {
    onChange({
      ...value,
      stationCode: station.id,
      stationName: station.name,
    });
    setStationOpen(false);
  };

  const clearSelection = () => {
    onChange({});
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          地域選択
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 都道府県選択 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">都道府県</label>
          <Popover open={prefectureOpen} onOpenChange={setPrefectureOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={prefectureOpen}
                className="w-full justify-between"
              >
                {value.prefectureName || "都道府県を選択"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="都道府県を検索..." />
                <CommandEmpty>該当する都道府県がありません</CommandEmpty>
                <CommandGroup>
                  {prefectures.map((prefecture) => (
                    <CommandItem
                      key={prefecture.id}
                      value={prefecture.name}
                      onSelect={() => handlePrefectureSelect(prefecture)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.prefectureId === prefecture.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {prefecture.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* 市区町村選択 */}
        {showMunicipalities && value.prefectureId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">市区町村</label>
            <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={municipalityOpen}
                  className="w-full justify-between"
                  disabled={loadingMunicipalities}
                >
                  {loadingMunicipalities ? "読み込み中..." : (value.municipalityName || "市区町村を選択")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="市区町村を検索..." />
                  <CommandEmpty>該当する市区町村がありません</CommandEmpty>
                  <CommandGroup>
                    {municipalities.map((municipality) => (
                      <CommandItem
                        key={municipality.id}
                        value={municipality.name}
                        onSelect={() => handleMunicipalitySelect(municipality)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.municipalityId === municipality.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Building className="mr-2 h-4 w-4" />
                        {municipality.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* 路線選択 */}
        {showLines && value.prefectureId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">路線</label>
            <Popover open={lineOpen} onOpenChange={setLineOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={lineOpen}
                  className="w-full justify-between"
                  disabled={loadingLines}
                >
                  {loadingLines ? "読み込み中..." : (value.lineName || "路線を選択（任意）")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="路線を検索..." />
                  <CommandEmpty>該当する路線がありません</CommandEmpty>
                  <CommandGroup>
                    {lines.map((line) => (
                      <CommandItem
                        key={line.id}
                        value={line.name}
                        onSelect={() => handleLineSelect(line)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.lineCode === line.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Train className="mr-2 h-4 w-4" />
                        {line.name}
                        {line.company_name && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {line.company_name}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* 駅選択 */}
        {showStations && value.lineCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">駅</label>
            <Popover open={stationOpen} onOpenChange={setStationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stationOpen}
                  className="w-full justify-between"
                  disabled={loadingStations}
                >
                  {loadingStations ? "読み込み中..." : (value.stationName || "駅を選択（任意）")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="駅を検索..." />
                  <CommandEmpty>該当する駅がありません</CommandEmpty>
                  <CommandGroup>
                    {stations.map((station) => (
                      <CommandItem
                        key={station.id}
                        value={station.name}
                        onSelect={() => handleStationSelect(station)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.stationCode === station.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Train className="mr-2 h-4 w-4" />
                        {station.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* 選択状況の表示 */}
        {(value.prefectureName || value.municipalityName || value.lineName || value.stationName) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">選択中</label>
            <div className="flex flex-wrap gap-2">
              {value.prefectureName && (
                <Badge variant="secondary">
                  📍 {value.prefectureName}
                </Badge>
              )}
              {value.municipalityName && (
                <Badge variant="secondary">
                  🏢 {value.municipalityName}
                </Badge>
              )}
              {value.lineName && (
                <Badge variant="secondary">
                  🚃 {value.lineName}
                </Badge>
              )}
              {value.stationName && (
                <Badge variant="secondary">
                  🚉 {value.stationName}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              選択をクリア
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 