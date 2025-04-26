'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/app/providers/supabase-provider';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  listingId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

// 複合状態の型定義
interface FavoriteState {
  isFavorite: boolean;
  count: number;
  isLoading: boolean;
}

export function FavoriteButton({
  listingId,
  showCount = false,
  size = 'md',
  variant = 'ghost',
  className,
}: FavoriteButtonProps) {
  const { user, session } = useSupabase();
  const router = useRouter();
  
  // 複数の状態を複合状態オブジェクトに統合
  const [favoriteState, setFavoriteState] = useState<FavoriteState>({
    isFavorite: false,
    count: 0,
    isLoading: false
  });
  
  // 状態の分割代入 (コード可読性のため)
  const { isFavorite, count, isLoading } = favoriteState;

  const heartSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  // 統合されたAPIエンドポイントを使用して、いいね状態といいね数を一度に取得
  useEffect(() => {
    const fetchFavoriteInfo = async () => {
      try {
        // ロード状態のみ更新
        setFavoriteState(prev => ({ ...prev, isLoading: true }));
        
        if (!user) {
          if (showCount) {
            // ユーザーがログインしていなくても、いいね数は取得する
            const countResponse = await fetch(`/api/favorites/info?listing_id=${listingId}&show_count=true`);
            if (countResponse.ok) {
              const data = await countResponse.json();
              // 一度の更新で状態変更をまとめる
              setFavoriteState({
                isFavorite: false,
                count: data.count,
                isLoading: false
              });
            } else {
              // エラー時
              setFavoriteState(prev => ({ ...prev, isLoading: false }));
            }
          } else {
            // いいね数不要の場合はシンプルに更新
            setFavoriteState(prev => ({ 
              ...prev, 
              isFavorite: false, 
              isLoading: false 
            }));
          }
          return;
        }

        const headers: HeadersInit = {};
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        // 統合APIを呼び出し
        const response = await fetch(
          `/api/favorites/info?listing_id=${listingId}&show_count=${showCount}`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          // 状態を一度に更新
          setFavoriteState({
            isFavorite: data.isFavorite,
            count: showCount ? data.count : 0,
            isLoading: false
          });
        } else {
          console.error('Error response from favorite info');
          setFavoriteState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error fetching favorite info');
        setFavoriteState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchFavoriteInfo();
  }, [listingId, user, session, showCount]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // ロード状態のみ更新
      setFavoriteState(prev => ({ ...prev, isLoading: true }));
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (response.ok) {
        const data = await response.json();
        // いいね状態、カウント、ロード状態を一度に更新
        setFavoriteState(prev => ({
          isFavorite: data.isFavorite,
          count: showCount 
            ? data.action === 'added' 
              ? prev.count + 1 
              : Math.max(0, prev.count - 1)
            : 0,
          isLoading: false
        }));
      } else {
        console.error('Error response from favorite toggle');
        setFavoriteState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error toggling favorite');
      setFavoriteState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        buttonSizes[size],
        "rounded-full flex items-center justify-center p-0",
        className
      )}
      disabled={isLoading}
      onClick={handleFavoriteToggle}
    >
      <Heart
        className={cn(
          heartSizes[size],
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
      {showCount && count > 0 && (
        <span className="ml-1 text-xs">{count}</span>
      )}
    </Button>
  );
} 