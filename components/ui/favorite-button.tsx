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

export function FavoriteButton({
  listingId,
  showCount = false,
  size = 'md',
  variant = 'ghost',
  className,
}: FavoriteButtonProps) {
  const { user, session } = useSupabase();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // いいね状態の取得
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        if (!user) {
          setIsFavorite(false);
          return;
        }

        console.log('Checking favorite status for listing:', listingId);
        const headers: HeadersInit = {};
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(
          `/api/favorites/check?listing_id=${listingId}`,
          { headers }
        );
        
        console.log('Favorite check response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Favorite check response data:', data);
          setIsFavorite(data.isFavorite);
        } else {
          console.error('Error response from favorite check:', await response.text());
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [listingId, user, session]);

  // いいね数の取得
  useEffect(() => {
    if (!showCount) return;

    const fetchFavoriteCount = async () => {
      try {
        console.log('Fetching favorite count for listing:', listingId);
        const response = await fetch(
          `/api/favorites/count?listing_id=${listingId}`
        );
        
        console.log('Favorite count response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Favorite count response data:', data);
          setFavoriteCount(data.count);
        } else {
          console.error('Error response from favorite count:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching favorite count:', error);
      }
    };

    fetchFavoriteCount();
  }, [listingId, showCount, isFavorite]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Toggle favorite button clicked for listing:', listingId);
    console.log('Current user:', user ? 'Logged in' : 'Not logged in');
    
    if (!user) {
      console.log('User not logged in, redirecting to login page');
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Sending favorite toggle request for listing:', listingId);
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

      console.log('Favorite toggle response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Favorite toggle response data:', data);
        setIsFavorite(data.isFavorite);
        
        // いいねを追加/削除した後にカウントを更新
        if (showCount) {
          setFavoriteCount(prev => 
            data.action === 'added' ? prev + 1 : Math.max(0, prev - 1)
          );
        }
      } else {
        console.error('Error response from favorite toggle:', await response.text());
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
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
      {showCount && favoriteCount > 0 && (
        <span className="ml-1 text-xs">{favoriteCount}</span>
      )}
    </Button>
  );
} 