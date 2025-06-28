'use client';

import { CalendarDays, MapPin } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SortToggleProps {
  onLocationSearch?: () => void;
}

// セッションストレージへの変更を通知するカスタムイベント発行関数
const notifyStorageChange = () => {
  // 通常のstorageイベント
  window.dispatchEvent(new Event('storage'));

  // カスタムイベント（より確実に検知するため）
  window.dispatchEvent(
    new CustomEvent('sortTypeChanged', {
      detail: { time: new Date().getTime() },
    })
  );

  // 一定時間後に再度通知（非同期処理の完了を待つため）
  setTimeout(() => {
    window.dispatchEvent(new Event('storage'));
  }, 100);
};

export function SortToggle({ onLocationSearch }: SortToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('listings');
  const [value, setValue] = useState<string>('new');
  const [loading, setLoading] = useState(false);

  // セッションストレージに保存された並び順を初期化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sortType = sessionStorage.getItem('sortType');
    if (sortType === 'near') {
      setValue('near');
    } else {
      setValue('new');
    }
  }, []);

  const handleValueChange = async (newValue: string) => {
    if (!newValue) return;

    // 同じ値が選択された場合は何もしない
    if (newValue === value) return;

    if (newValue === 'near') {
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

            // 位置情報をセッションストレージに保存
            sessionStorage.setItem('userLat', lat.toString());
            sessionStorage.setItem('userLng', lng.toString());
            sessionStorage.setItem('sortType', 'near');

            // カスタムイベントを発行してセッションストレージの変更を通知
            notifyStorageChange();

            // 値を更新
            setValue('near');

            // カスタムハンドラがあれば呼び出す
            if (onLocationSearch) {
              onLocationSearch();
            }

            // パラメータを構築（位置情報は含めない）
            const params = new URLSearchParams(searchParams.toString());

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
    } else if (newValue === 'new') {
      // 「新しい順」の場合はセッションストレージから削除
      sessionStorage.removeItem('userLat');
      sessionStorage.removeItem('userLng');
      sessionStorage.setItem('sortType', 'new');

      // カスタムイベントを発行してセッションストレージの変更を通知
      notifyStorageChange();

      // 値を更新
      setValue('new');

      // 検索ページへ遷移
      const params = new URLSearchParams(searchParams.toString());
      router.push(`/${locale}/listings/search?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-sm text-gray-500 mb-1">{t('sortBy')}</p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={handleValueChange}
        variant="outline"
        className="justify-start"
      >
        <ToggleGroupItem value="new" disabled={loading} className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>{t('sortNewest')}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="near" disabled={loading} className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {loading ? t('gettingLocation') : t('sortNearest')}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
