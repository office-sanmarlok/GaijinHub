'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';

// React Leafletを動的にインポート（SSRエラー回避）
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Listing {
  id: string;
  title: string;
  description?: string;
  price?: number | null;
  category: string;
  location?: string;
  imageUrl?: string;
  lat?: number | null;
  lng?: number | null;
  municipality?: {
    name: string;
  } | null;
}

interface MapViewProps {
  listings: Listing[];
  height?: string;
  showControls?: boolean;
  onListingClick?: (listing: Listing) => void;
}

export default function MapView({ 
  listings, 
  height = '500px',
  showControls = true,
  onListingClick 
}: MapViewProps) {
  const [map, setMap] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6762, 139.6503]); // 東京駅
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // リスティングの位置情報から地図の中心とズームを計算
  useEffect(() => {
    const validListings = listings.filter(listing => 
      listing.lat && listing.lng && 
      !isNaN(listing.lat) && !isNaN(listing.lng)
    );

    if (validListings.length > 0) {
      if (validListings.length === 1) {
        // 1件の場合はその位置を中心に
        setMapCenter([validListings[0].lat!, validListings[0].lng!]);
        setZoom(15);
      } else {
        // 複数件の場合は中心点とズームを計算
        const latitudes = validListings.map(l => l.lat!);
        const longitudes = validListings.map(l => l.lng!);
        
        const centerLat = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
        const centerLng = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;
        
        setMapCenter([centerLat, centerLng]);
        
        // 範囲に基づいてズームレベルを調整
        const latRange = Math.max(...latitudes) - Math.min(...latitudes);
        const lngRange = Math.max(...longitudes) - Math.min(...longitudes);
        const maxRange = Math.max(latRange, lngRange);
        
        if (maxRange > 1) setZoom(8);
        else if (maxRange > 0.1) setZoom(10);
        else if (maxRange > 0.01) setZoom(13);
        else setZoom(15);
      }
    }
  }, [listings]);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          if (map) {
            map.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
        }
      );
    }
  };

  // 有効な位置情報を持つリスティングのみフィルター
  const mappableListings = listings.filter(listing => 
    listing.lat && listing.lng && 
    !isNaN(listing.lat) && !isNaN(listing.lng)
  );

  if (!isClient) {
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">地図を読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ height }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            地図表示
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {mappableListings.length}/{listings.length}件
            </Badge>
            {showControls && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={getCurrentLocation}>
                  <Navigation className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {mappableListings.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">位置情報がありません</h3>
              <p className="text-muted-foreground">
                地図に表示できるリスティングがありません。<br />
                位置情報が設定されたリスティングのみ地図に表示されます。
              </p>
            </div>
          </div>
        ) : (
          <div style={{ height: 'calc(100% - 60px)' }}>
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              ref={setMap}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mappableListings.map((listing) => (
                <Marker
                  key={listing.id}
                  position={[listing.lat!, listing.lng!]}
                >
                  <Popup>
                    <div className="w-64">
                      <div className="aspect-video bg-gray-200 mb-2 rounded">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">{listing.location}</span>
                        {listing.price && (
                          <span className="font-bold">¥{listing.price.toLocaleString()}</span>
                        )}
                      </div>
                      {onListingClick && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => onListingClick(listing)}
                        >
                          詳細を見る
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 