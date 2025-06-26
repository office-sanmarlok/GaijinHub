'use client';

import { MapPin } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function NearbySearchButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('listings');

  const searchNearby = async () => {
    setLoading(true);

    try {
      // ユーザーの位置情報取得APIを使用
      if (!navigator.geolocation) {
        toast.error(t('locationErrors.browserNotSupported'));
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // 検索パラメータを構築
          const params = new URLSearchParams(searchParams.toString());
          params.set('lat', lat.toString());
          params.set('lng', lng.toString());

          // 検索ページへ遷移
          router.push(`/${locale}/listings/search?${params.toString()}`);
          setLoading(false);
        },
        (error) => {
          console.error('Location error:', error);

          let errorMessage = t('locationErrors.failedToGetLocation');
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t('locationErrors.permissionDenied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t('locationErrors.positionUnavailable');
              break;
            case error.TIMEOUT:
              errorMessage = t('locationErrors.timeout');
              break;
          }

          toast.error(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error('Error occurred:', error);
      toast.error(t('locationErrors.errorOccurred'));
      setLoading(false);
    }
  };

  return (
    <Button onClick={searchNearby} disabled={loading} variant="outline" className="flex items-center gap-2">
      <MapPin size={16} />
      {loading ? t('gettingLocation') : t('sortByNearbyLocation')}
    </Button>
  );
}
