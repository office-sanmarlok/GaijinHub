'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

export function NearbySearchButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchNearby = async () => {
    setLoading(true);

    try {
      // ユーザーの位置情報取得APIを使用
      if (!navigator.geolocation) {
        toast.error('ブラウザが位置情報をサポートしていません');
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
          router.push(`/listings/search?${params.toString()}`);
          setLoading(false);
        },
        (error) => {
          console.error('位置情報取得エラー:', error);

          let errorMessage = '位置情報の取得に失敗しました';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報の使用許可が拒否されました';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が取得できませんでした';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました';
              break;
          }

          toast.error(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('エラーが発生しました', error);
      toast.error('現在地の取得中にエラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={searchNearby}
      disabled={loading}
      variant="outline"
      className="flex items-center gap-2"
    >
      <MapPin size={16} />
      {loading ? '位置情報取得中...' : '現在地から近い順に並び替え'}
    </Button>
  );
}