'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/providers/supabase-provider';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  listingId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

const buttonSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const heartSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function FavoriteButton({
  listingId,
  showCount = false,
  size = 'md',
  variant = 'ghost',
  className,
}: FavoriteButtonProps) {
  const { user, session } = useSupabase();
  const router = useRouter();
  const [favoriteState, setFavoriteState] = useState({
    isFavorite: false,
    count: 0,
    isLoading: true,
  });

  const { isFavorite, count, isLoading } = favoriteState;

  useEffect(() => {
    if (!user) {
      setFavoriteState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchFavoriteInfo = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const [checkResponse, countResponse] = await Promise.all([
          fetch(`/api/favorites/check?listing_id=${listingId}`, {
            headers,
          }),
          showCount
            ? fetch(`/api/favorites/count?listing_id=${listingId}`)
            : Promise.resolve(null),
        ]);

        if (!checkResponse.ok) {
          throw new Error('Failed to check favorite status');
        }

        const { isFavorite } = await checkResponse.json();
        let count = 0;

        if (showCount && countResponse) {
          if (!countResponse.ok) {
            throw new Error('Failed to get favorite count');
          }
          const countData = await countResponse.json();
          count = countData.count;
        }

        setFavoriteState({
          isFavorite,
          count,
          isLoading: false,
        });
      } catch (err) {
        console.error('Error fetching favorite info:', err);
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
    } catch (err) {
      console.error('Error toggling favorite:', err);
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