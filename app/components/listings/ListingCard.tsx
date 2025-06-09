'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { Database } from '@/types/supabase';

// 新しいAPIレスポンス構造に対応
type Listing = Database['public']['Tables']['listings']['Row'] & {
  has_location: boolean;
  is_city_only: boolean;
  image_url?: string;
  // APIで結合されるリレーションデータ
  municipality?: {
    muni_name: string;
    pref_id: string;
    prefecture?: {
      pref_name: string;
    };
  } | null;
  station?: {
    station_name: string;
    station_cd: string;
    name_kanji?: string; // 互換性のため
    line?: {
      line_name: string;
      company?: {
        company_name: string;
      };
    };
    lines?: {
      line_ja?: string; // 互換性のため
      line_name: string;
      company_name?: string;
    }[] | null;
  } | null;
};

interface ListingCardProps {
  listing: Listing;
  viewMode?: 'grid' | 'list';
}

export function ListingCard({ listing, viewMode = 'grid' }: ListingCardProps) {
  // デバッグ用: APIレスポンス構造を確認
  console.log('ListingCard data:', {
    id: listing.id,
    stations: (listing as any).stations,
    municipalities: (listing as any).municipalities,
    location: (listing as any).location,
    has_location: listing.has_location,
    is_city_only: listing.is_city_only
  });

  const getLocationText = () => {
    // APIレスポンスの構造に対応
    const hasLocation = listing.has_location || (listing as any).location?.has_location;
    const isCityOnly = listing.is_city_only || (listing as any).location?.is_city_only;
    
    if (!hasLocation) return '位置情報非公開';
    
    // locationオブジェクトから位置情報を取得（新APIレスポンス構造）
    const locationData = (listing as any).location;
    if (locationData) {
      const municipalityName = locationData.muni_name || '';
      const prefectureName = locationData.pref_name || '';
      const baseLocation = `${municipalityName}${prefectureName ? `、${prefectureName}` : ''}`;
      
      // 市区町村のみの場合
      if (isCityOnly) {
        return `${baseLocation} (駅名・路線非公開)`;
      }
      
      // 駅情報がある場合（フル公開）
      if (locationData.station_name) {
        let stationText = locationData.station_name;
        
        // 路線情報の取得
        const lineName = locationData.line_name;
        const companyName = locationData.company_name;
        
        if (companyName && lineName) {
          stationText += ` (${companyName} ${lineName})`;
        } else if (lineName) {
          stationText += ` (${lineName})`;
        }
        
        return `${stationText}駅、${baseLocation}`;
      }
      
      return `${baseLocation} (駅情報未設定)`;
    }
    
    // 既存の構造での処理（フォールバック）
    const municipalityName = listing.municipality?.muni_name || '';
    const prefectureName = listing.municipality?.prefecture?.pref_name || '';
    const baseLocation = `${municipalityName}${prefectureName ? `、${prefectureName}` : ''}`;
    
    // 市区町村のみの場合
    if (isCityOnly) {
      return `${baseLocation} (駅名・路線非公開)`;
    }
    
    // 駅情報がある場合（フル公開）
    if (listing.station) {
      const stationName = listing.station.station_name || listing.station.name_kanji;
      
      // 路線情報の取得
      let lineInfo = '';
      if (listing.station.line) {
        lineInfo = listing.station.line.line_name;
      } else if (listing.station.lines && listing.station.lines.length > 0) {
        lineInfo = listing.station.lines.map(l => l.line_name || l.line_ja).join('・');
      }
      
      const stationInfo = lineInfo ? `${stationName}駅 (${lineInfo})` : `${stationName}駅`;
      return `${stationInfo}、${baseLocation}`;
    }
    
    // 位置情報があるが駅情報がない場合
    return baseLocation ? `${baseLocation} (駅情報未設定)` : '位置情報設定中';
  };

  return (
    <div className="relative group">
      <Link href={`/listings/${listing.id}`}>
        <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
          <div
            className={`${
              viewMode === 'list' ? 'sm:flex items-center' : ''
            } h-full p-4`}
          >
            <div
              className={`${
                viewMode === 'list' 
                  ? 'sm:w-40 md:w-48 aspect-[4/3] flex-shrink-0 flex items-center justify-center mb-4 sm:mb-0' 
                  : 'aspect-[4/3] relative mx-auto mb-4'
              }`}
            >
              <div className="w-full h-full relative overflow-hidden rounded-md">
                <Image
                  src={listing.image_url || listing.rep_image_url || (listing as any).primary_image_url || '/images/no-image-placeholder.svg'}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={false}
                  loading="lazy"
                />
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'sm:pl-6' : ''}`}>
              <CardHeader className="pb-0 px-0">
                <CardTitle className="line-clamp-2 text-lg">{listing.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{listing.category}</p>
              </CardHeader>
              <CardContent className="flex-1 pt-3 px-0">
                <div className="space-y-2">
                  <p className="line-clamp-2 text-gray-600">
                    {listing.body}
                  </p>
                  {listing.price && (
                    <p className="font-bold">¥{listing.price.toLocaleString()}</p>
                  )}
                  {getLocationText() && (
                    <p className="text-sm text-gray-500">{getLocationText()}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {listing.created_at && new Date(listing.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </Link>
      {/* お気に入りボタン */}
      <div className="absolute top-4 right-4 z-10">
        <FavoriteButton
          listingId={listing.id}
          size="sm"
          variant="outline"
          className="bg-white/80 hover:bg-white"
        />
      </div>
    </div>
  );
} 
