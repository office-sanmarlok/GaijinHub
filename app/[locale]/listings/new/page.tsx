'use client';

import { Loader2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ImageUploader, type UploadedImage } from '@/components/common/ImageUploader';
import SearchForm, { type LocationSelection } from '@/components/common/SearchForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { processListingImages } from '@/lib/utils/image-upload';
import { logger } from '@/lib/utils/logger';

const categories = ['Housing', 'Jobs', 'Items for Sale', 'Services'] as const;

export default function NewListingPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [locationShareType, setLocationShareType] = useState<'none' | 'station' | 'municipality'>('none');
  const [selectedLocations, setSelectedLocations] = useState<LocationSelection[]>([]);

  const handleImageChange = (newImages: UploadedImage[]) => {
    setImages(newImages);
    setImageError(null);
  };

  const handleLocationSelect = (locations: LocationSelection[]) => {
    setSelectedLocations(locations);
  };

  // SearchFormのonSearchは使用しないが、必須のため空の関数を提供
  const handleSearchFormSubmit = () => {
    // 何もしない - locationOnlyModeでは検索ボタンも非表示
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setImageError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('newListing.errors.authRequired'));

      // 1. まずテキスト情報でリスティングを作成し、IDを取得
      const baseData = {
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        body: formData.get('body') as string,
        price: formData.get('price') ? Number(formData.get('price')) : null,
      };

      let locationData = {};
      if (locationShareType !== 'none' && selectedLocations.length > 0) {
        const location = selectedLocations[0];
        if (location.type === 'station') {
          locationData = {
            station_id: location.data.station_cd || location.data.id,
            has_location: true,
            is_city_only: locationShareType === 'municipality',
          };
        } else if (location.type === 'municipality') {
          // 現在は駅のみ選択可能なので、このケースは実際には発生しない
          locationData = {
            muni_id: location.data.id || location.data.muni_id,
            station_id: null,
            has_location: true,
            is_city_only: true,
          };
        }
      } else {
        locationData = {
          has_location: false,
          is_city_only: false,
          station_id: null,
        };
      }

      // Set original_language to null so it will be detected later
      const initialListingData = { 
        ...baseData, 
        ...locationData, 
        user_id: user.id,
        original_language: null 
      };

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert(initialListingData)
        .select()
        .single();

      if (listingError) throw listingError;

      const listingId = listing.id;
      if (!listingId) throw new Error(t('newListing.errors.createFailed'));

      // 2. 画像がある場合のみアップロード処理
      if (images.length > 0) {
        const { repImageUrl } = await processListingImages(images, user.id, listingId);

        // listingsテーブルのrep_image_urlを更新
        if (repImageUrl) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ rep_image_url: repImageUrl })
            .eq('id', listingId);

          if (updateError) {
            // エラーはコンソールに出力するが、処理は続行する
            logger.error('Failed to update representative image:', updateError);
          }
        }
      }

      // Debug auth issue first
      try {
        const debugResponse = await fetch(`/api/listings/${listingId}/debug`);
        const debugData = await debugResponse.json();
        logger.debug('Debug info:', debugData);
      } catch (error) {
        logger.error('Debug error:', error);
      }

      // Translate in real-time
      try {
        const response = await fetch(`/api/listings/${listingId}/translate-now`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Failed to translate listing:', { status: response.status, errorText });
        } else {
          const result = await response.json();
          logger.debug(`Successfully translated to ${result.translatedCount} languages`);
        }
      } catch (error) {
        logger.error('Real-time translation error:', error);
      }

      router.push(`/${locale}/listings/${listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newListing.errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t('newListing.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newListing.category')}</label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder={t('newListing.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newListing.titleLabel')}</label>
              <Input name="title" placeholder={t('newListing.titlePlaceholder')} maxLength={100} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newListing.description')}</label>
              <Textarea
                name="body"
                placeholder={t('newListing.descriptionPlaceholder')}
                className="min-h-[200px]"
                maxLength={5000}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newListing.price')}</label>
              <Input name="price" type="number" placeholder={t('newListing.pricePlaceholder')} min={0} />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('newListing.locationSettings')}
                </Label>
                <Select
                  value={locationShareType}
                  onValueChange={(value: 'none' | 'station' | 'municipality') => setLocationShareType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('newListing.selectLocationShare')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('newListing.locationNone')}</SelectItem>
                    <SelectItem value="station">{t('newListing.locationStation')}</SelectItem>
                    <SelectItem value="municipality">{t('newListing.locationMunicipality')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {locationShareType !== 'none' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {locationShareType === 'station' ? t('newListing.nearestStation') : t('newListing.area')}
                  </Label>
                  <SearchForm
                    onSearch={handleSearchFormSubmit}
                    onLocationSelect={handleLocationSelect}
                    locationOnlyMode={true}
                    hideSearchButton={true}
                    allowedLocationTypes={['station']}
                    className="w-full"
                  />
                  {selectedLocations.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {t('newListing.selected')}: {selectedLocations.map((loc) => loc.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newListing.images')}</label>
              <ImageUploader images={images} onChange={handleImageChange} maxImages={5} />
              {imageError && <p className="text-amber-500 text-sm">{imageError}</p>}
              <p className="text-xs text-gray-500">{t('newListing.imageHint')}</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('newListing.posting')}
                </>
              ) : (
                t('newListing.postButton')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}