'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { LocationSelector, LocationSelection } from '../location/LocationSelector';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Building, 
  Train, 
  Map as MapIcon, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface LocationData {
  hasLocation: boolean;
  isCityOnly: boolean;
  prefectureId?: string;
  prefectureName?: string;
  municipalityId?: string;
  municipalityName?: string;
  stationCode?: string;
  stationName?: string;
  lineCode?: string;
  lineName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  userProvidedLocation?: string;
}

interface LocationSelectionFormProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
  required?: boolean;
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    prefecture?: string;
    city?: string;
    town?: string;
  };
}

export function LocationSelectionForm({ 
  value, 
  onChange, 
  required = false 
}: LocationSelectionFormProps) {
  const [activeTab, setActiveTab] = useState<string>('hierarchy');
  const [addressQuery, setAddressQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    prefectureId: value.prefectureId,
    prefectureName: value.prefectureName,
    municipalityId: value.municipalityId,
    municipalityName: value.municipalityName,
    lineCode: value.lineCode,
    lineName: value.lineName,
    stationCode: value.stationCode,
    stationName: value.stationName,
  });

  // 住所検索機能
  const searchAddress = async () => {
    if (!addressQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Nominatim API (OpenStreetMap)を使用した住所検索
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery + ' Japan')}&limit=5&addressdetails=1`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('住所検索エラー:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // GPS位置取得機能
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('このブラウザでは位置情報がサポートされていません。');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 逆ジオコーディングで住所を取得
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const result = await response.json();
          
          // 最寄り駅を検索
          await findNearestStation(latitude, longitude, result.display_name);
          
          setLocationStatus('success');
        } catch (error) {
          console.error('逆ジオコーディングエラー:', error);
          setLocationStatus('error');
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        setLocationStatus('error');
        setIsGeolocating(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('位置情報の利用が拒否されました。');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('位置情報が利用できません。');
            break;
          case error.TIMEOUT:
            alert('位置情報の取得がタイムアウトしました。');
            break;
          default:
            alert('位置情報の取得に失敗しました。');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // 最寄り駅検索
  const findNearestStation = async (lat: number, lng: number, address: string) => {
    try {
      const response = await fetch(
        `/api/location/stations/near?lat=${lat}&lng=${lng}&limit=3`
      );
      
      if (response.ok) {
        const stations = await response.json();
        if (stations.length > 0) {
          const nearestStation = stations[0];
          
          // 駅情報で位置データを更新
          onChange({
            ...value,
            hasLocation: true,
            lat,
            lng,
            address,
            stationCode: nearestStation.station_cd,
            stationName: nearestStation.station_name,
            // その他の駅情報も更新
          });
        }
      }
    } catch (error) {
      console.error('最寄り駅検索エラー:', error);
    }
  };

  // 住所選択ハンドラー
  const selectAddress = (result: GeocodeResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    onChange({
      ...value,
      hasLocation: true,
      lat,
      lng,
      address: result.display_name,
      userProvidedLocation: result.display_name,
    });

    // 最寄り駅も検索
    findNearestStation(lat, lng, result.display_name);
    setSearchResults([]);
    setLocationStatus('success');
  };

  // 階層選択ハンドラー
  const handleHierarchyChange = (selection: LocationSelection) => {
    setLocationSelection(selection);
    onChange({
      ...value,
      hasLocation: true,
      prefectureId: selection.prefectureId,
      prefectureName: selection.prefectureName,
      municipalityId: selection.municipalityId,
      municipalityName: selection.municipalityName,
      lineCode: selection.lineCode,
      lineName: selection.lineName,
      stationCode: selection.stationCode,
      stationName: selection.stationName,
    });
  };

  // 位置情報有無の切り替え
  const handleLocationToggle = (hasLocation: boolean) => {
    if (!hasLocation) {
      onChange({
        hasLocation: false,
        isCityOnly: false,
      });
      setLocationSelection({});
      setLocationStatus('idle');
    } else {
      onChange({
        ...value,
        hasLocation: true,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          位置情報設定
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 位置情報の有無切り替え */}
        <div className="flex items-center space-x-2">
          <Switch
            id="has-location"
            checked={value.hasLocation}
            onCheckedChange={handleLocationToggle}
          />
          <Label htmlFor="has-location">位置情報を含める</Label>
        </div>

        {value.hasLocation && (
          <>
            {/* 公開レベル設定 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="city-only"
                checked={value.isCityOnly}
                onCheckedChange={(checked) => onChange({ ...value, isCityOnly: checked })}
              />
              <Label htmlFor="city-only">市区町村のみ公開（駅名は非公開）</Label>
            </div>

            {/* 位置選択タブ */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  地域選択
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  住所検索
                </TabsTrigger>
                <TabsTrigger value="gps" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  GPS検索
                </TabsTrigger>
              </TabsList>

              {/* 地域階層選択 */}
              <TabsContent value="hierarchy" className="space-y-4">
                <LocationSelector
                  value={locationSelection}
                  onChange={handleHierarchyChange}
                  showStations={true}
                  showLines={true}
                  showMunicipalities={true}
                />
              </TabsContent>

              {/* 住所検索 */}
              <TabsContent value="address" className="space-y-4">
                <div className="space-y-2">
                  <Label>住所を入力</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="住所、施設名、駅名などを入力"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
                    />
                    <Button 
                      onClick={searchAddress} 
                      disabled={isSearching || !addressQuery.trim()}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 検索結果 */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>検索結果</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start h-auto p-3"
                          onClick={() => selectAddress(result)}
                        >
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{result.display_name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* GPS検索 */}
              <TabsContent value="gps" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <Navigation className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium mb-2">現在地から位置を取得</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      GPS機能を使って現在地を取得し、最寄り駅を自動検索します。
                    </p>
                    <Button 
                      onClick={getCurrentLocation}
                      disabled={isGeolocating}
                      className="w-full"
                    >
                      {isGeolocating ? (
                        <>取得中...</>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          現在地を取得
                        </>
                      )}
                    </Button>
                  </div>

                  {/* ステータス表示 */}
                  {locationStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">位置情報を取得しました</span>
                    </div>
                  )}
                  {locationStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">位置情報の取得に失敗しました</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* 選択状況の表示 */}
            {(value.prefectureName || value.municipalityName || value.stationName || value.address) && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">選択された位置情報</Label>
                <div className="flex flex-wrap gap-2">
                  {value.prefectureName && (
                    <Badge variant="secondary">📍 {value.prefectureName}</Badge>
                  )}
                  {value.municipalityName && (
                    <Badge variant="secondary">🏢 {value.municipalityName}</Badge>
                  )}
                  {value.lineName && (
                    <Badge variant="secondary">🚃 {value.lineName}</Badge>
                  )}
                  {value.stationName && !value.isCityOnly && (
                    <Badge variant="secondary">🚉 {value.stationName}</Badge>
                  )}
                  {value.address && (
                    <Badge variant="outline" className="text-xs">
                      📍 {value.address.substring(0, 50)}...
                    </Badge>
                  )}
                </div>
                {value.isCityOnly && value.stationName && (
                  <p className="text-sm text-muted-foreground">
                    ※ 駅情報「{value.stationName}」は公開時に非表示になります
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 