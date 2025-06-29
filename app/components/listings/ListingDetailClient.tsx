'use client';

import { Building2, Calendar, Clock, MapPin, Train, User } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { LanguageBadge } from '@/components/ui/language-badge';
import { ShareButton } from '@/components/ui/share-button';

interface ListingImage {
  id: string;
  url: string;
  order: number;
}

interface ListingLine {
  company_name: string;
  company_name_r?: string;
  line_name: string;
  line_name_r?: string;
}

interface ListingStation {
  station_name: string;
  station_name_r?: string;
  lines?: ListingLine[];
}

interface ListingMunicipality {
  muni_name: string;
  muni_name_r?: string;
  pref_name?: string;
  pref_name_r?: string;
}

interface ListingUser {
  avatar_url?: string | null;
  display_name?: string;
}

interface ListingDetailClientProps {
  listing: {
    id: string;
    title: string;
    body: string;
    category: string;
    price: number | null;
    created_at: string | null;
    original_language: string | null;
    has_location: boolean | null;
    is_city_only: boolean | null;
    images?: ListingImage[];
    rep_image_url?: string | null;
    station?: ListingStation;
    municipality?: ListingMunicipality;
    user?: ListingUser;
    translation?: {
      title: string;
      body: string;
      is_auto_translated: boolean;
    };
  };
  isOwner: boolean;
}

export function ListingDetailClient({ listing, isOwner }: ListingDetailClientProps) {
  const t = useTranslations('listings');
  const tLocation = useTranslations('location');
  const tCategories = useTranslations('categories');
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  // Debug logging
  console.log('Current locale:', locale);
  console.log('Translation data:', listing.translation);
  console.log('Original language:', listing.original_language);

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'Housing':
        return <Building2 className="w-4 h-4" />;
      case 'Jobs':
        return <User className="w-4 h-4" />;
      case 'Items for Sale':
        return <Building2 className="w-4 h-4" />;
      case 'Services':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  }

  function getCategoryLabel(category: string) {
    // Map database category values to translation keys
    const categoryMap: Record<string, string> = {
      Housing: 'housing',
      Jobs: 'jobs',
      'Items for Sale': 'items',
      Services: 'services',
    };

    const categoryKey = categoryMap[category] || category.toLowerCase();
    return tCategories(categoryKey) || category;
  }

  function formatPrice(price: number | null): string {
    if (!price) return t('negotiable');
    return `¥${price.toLocaleString()}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale);
  }

  // Get localized location names
  const getLocationName = (location: any, field: string): string => {
    if (isJapanese) {
      return String(location[field] || '');
    }
    const romajiField = `${field}_r`;
    return String(location[romajiField] || location[field] || '');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('imageGallery')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.images.map((image) => (
                    <div key={image.id} className="aspect-square relative rounded-lg overflow-hidden">
                      <Image src={image.url} alt={`${listing.title} - ${image.order}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Image */}
          {(!listing.images || listing.images.length === 0) && !listing.rep_image_url && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-400">
                  <p className="text-lg font-medium">{t('noImage')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listing Details */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={listing.user?.avatar_url ?? undefined}
                    alt={listing.user?.display_name ?? 'User avatar'}
                  />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{listing.user?.display_name || 'Anonymous'}</p>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(listing.category)}
                  <span>{getCategoryLabel(listing.category)}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{listing.created_at ? formatDate(listing.created_at) : 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <h1 className="text-3xl font-bold flex-1">{listing.translation?.title || listing.title}</h1>
                {listing.original_language && <LanguageBadge language={listing.original_language} />}
              </div>
              <p className="text-3xl font-bold text-green-600">{formatPrice(listing.price)}</p>
              <div className="prose max-w-none">
                <p>{listing.translation?.body || listing.body}</p>
              </div>
              {listing.translation?.is_auto_translated && (
                <p className="text-sm text-gray-500 italic mt-2">{t('autoTranslated')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Safety Tips */}
          <Card>
            <CardHeader>
              <CardTitle>{t('safetyTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t('safetyTip1')}</li>
                <li>• {t('safetyTip2')}</li>
                <li>• {t('safetyTip3')}</li>
                <li>• {t('safetyTip4')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('locationTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Station info */}
              {listing.has_location && !listing.is_city_only && listing.station && (
                <div className="flex items-center gap-2 text-sm">
                  <Train className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">
                      {getLocationName(listing.station, 'station_name')}
                      {tLocation('stationSuffix')}
                    </div>
                    {listing.station.lines && listing.station.lines.length > 0 && (
                      <div className="text-gray-500">
                        {listing.station.lines.map((line, index) => (
                          <div key={index}>
                            {getLocationName(line, 'company_name')} {getLocationName(line, 'line_name')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Station/line private notice */}
              {listing.has_location && listing.is_city_only && (
                <div className="flex items-center gap-2 text-sm">
                  <Train className="w-4 h-4 text-gray-400" />
                  <div className="text-gray-500">{t('stationLinePrivate')}</div>
                </div>
              )}

              {/* Municipality and prefecture info */}
              {listing.has_location && listing.municipality && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">{getLocationName(listing.municipality, 'muni_name')}</div>
                    {listing.municipality.pref_name && (
                      <div className="text-gray-500">{getLocationName(listing.municipality, 'pref_name')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* No location info */}
              {!listing.has_location && <div className="text-gray-500 text-sm">{tLocation('locationPrivate')}</div>}

              {/* Location not set properly */}
              {listing.has_location && !listing.municipality && !listing.station && (
                <div className="text-gray-500 text-sm">{t('locationNotSet')}</div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contactTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                {t('contactSeller')}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">{t('loginRequired')}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <FavoriteButton listingId={listing.id} variant="outline" className="flex-1" />
            <ShareButton url={`/${locale}/listings/${listing.id}`} title={listing.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
