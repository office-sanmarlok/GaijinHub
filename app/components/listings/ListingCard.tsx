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
  const getLocationText = () => {
    if (!listing.has_location) return null;
    
    // 市区町村のみの場合
    if (listing.is_city_only && listing.municipality) {
      return listing.municipality.muni_name;
    }
    
    // 駅情報がある場合
    if (listing.station) {
      const stationName = listing.station.station_name || listing.station.name_kanji;
      
      // 単一の路線情報がある場合（新API構造）
      if (listing.station.line) {
        return `${stationName} (${listing.station.line.line_name})`;
      }
      
      // 複数路線情報がある場合（互換性のため）
      if (listing.station.lines && listing.station.lines.length > 0) {
        const lineNames = listing.station.lines.map(l => l.line_name || l.line_ja).join('、');
        return `${stationName} (${lineNames})`;
      }
      
      // 路線情報がない場合は駅名のみ
      return stationName;
    }
    
    return null;
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
                  src={listing.image_url || listing.rep_image_url || 'https://placehold.co/600x400'}
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