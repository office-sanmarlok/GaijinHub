'use client';

import { Languages } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { LanguageBadge } from '@/components/ui/language-badge';
import type { ListingCardData } from '@/types/listing';

interface ListingCardProps {
  listing: ListingCardData;
  viewMode?: 'grid' | 'list';
}

export function ListingCard({ listing, viewMode = 'grid' }: ListingCardProps) {
  const locale = useLocale();
  const t = useTranslations('location');
  const tListings = useTranslations('listings');

  const getLocationText = () => {
    const { location } = listing;

    if (!location.has_location) return t('locationPrivate');

    const isJapanese = locale === 'ja';
    const municipalityName = isJapanese ? location.muni_name || '' : location.muni_name_r || location.muni_name || '';
    const prefectureName = isJapanese ? location.pref_name || '' : location.pref_name_r || location.pref_name || '';
    const baseLocation = isJapanese ? `${prefectureName}${municipalityName}` : `${municipalityName}, ${prefectureName}`;

    if (location.is_city_only) {
      return baseLocation;
    }

    if (location.station_name) {
      const stationName = isJapanese ? location.station_name : location.station_name_r || location.station_name;
      const stationGroupName = isJapanese
        ? location.station_group_name
        : location.station_group_name_r || location.station_group_name;

      let stationText = `${stationName}${t('stationSuffix')}`;
      if (stationGroupName && stationName !== stationGroupName) {
        stationText = `${stationGroupName} (${stationName})${t('stationSuffix')}`;
      }
      return `${stationText}, ${baseLocation}`;
    }

    return baseLocation;
  };

  return (
    <div className="relative group">
      <Link href={`/${locale}/listings/${listing.id}`}>
        <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
          <div className={`${viewMode === 'list' ? 'sm:flex items-center' : ''} h-full p-4`}>
            <div
              className={`${
                viewMode === 'list'
                  ? 'sm:w-40 md:w-48 aspect-[4/3] flex-shrink-0 flex items-center justify-center mb-4 sm:mb-0'
                  : 'aspect-[4/3] relative mx-auto mb-4'
              }`}
            >
              <div className="w-full h-full relative overflow-hidden rounded-md">
                <Image
                  src={listing.rep_image_url || '/images/no-image-placeholder.svg'}
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
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg flex-1">
                    {listing.translation?.title || listing.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {listing.translation?.is_auto_translated && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Languages className="w-3 h-3" />
                        {tListings('autoTranslated')}
                      </Badge>
                    )}
                    {listing.original_language && <LanguageBadge language={listing.original_language} showDefault={true} />}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{listing.category}</p>
              </CardHeader>
              <CardContent className="flex-1 pt-3 px-0">
                <div className="space-y-2">
                  <p className="line-clamp-2 text-gray-600">{listing.translation?.body || listing.body}</p>
                  {listing.price && <p className="font-bold">¥{listing.price.toLocaleString()}</p>}
                  {getLocationText() && <p className="text-sm text-gray-500">{getLocationText()}</p>}
                  <p className="text-sm text-gray-500">
                    {listing.created_at && new Date(listing.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </Link>
      {/* お気に入りボタン */}
      <div className="absolute top-4 right-4 z-10">
        <FavoriteButton listingId={listing.id} size="sm" variant="outline" className="bg-white/80 hover:bg-white" />
      </div>
    </div>
  );
}
