'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  ToggleGroup,
  ToggleGroupItem
} from '@/components/ui/toggle-group';

interface SortToggleProps {
  onLocationSearch?: () => void;
}

// セッションストレージへの変更を通知するカスタムイベント発行関数
const notifyStorageChange = () => {
  // 通常のstorageイベント
  window.dispatchEvent(new Event('storage'));
  
  // カスタムイベント（より確実に検知するため）
  window.dispatchEvent(new CustomEvent('sortTypeChanged', { 
    detail: { time: new Date().getTime() } 
  }));
  
  // 一定時間後に再度通知（非同期処理の完了を待つため）
  setTimeout(() => {
    window.dispatchEvent(new Event('storage'));
  }, 100);
};

export function SortToggle({ onLocationSearch }: SortToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>("new");
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
          toast.error('ブラウザが位置情報をサポートしていません');
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
      router.push(`/listings/search?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-sm text-gray-500 mb-1">並び順</p>
      <ToggleGroup type="single" value={value} onValueChange={handleValueChange} variant="outline" className="justify-start">
        <ToggleGroupItem value="new" disabled={loading} className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>新着順</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="near" disabled={loading} className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {loading ? '位置情報取得中...' : '近い順'}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
} 