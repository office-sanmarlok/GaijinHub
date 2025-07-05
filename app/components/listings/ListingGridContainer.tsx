'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Listing } from '@/types/listing';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { ListingGrid } from './ListingGrid';

interface ListingGridContainerProps {
  initialListings?: Listing[];
  searchParams?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    locationIds?: string[];
    language?: string;
  };
  emptyMessage?: string;
}

export function ListingGridContainer({ 
  initialListings = [], 
  searchParams,
  emptyMessage 
}: ListingGridContainerProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const supabase = createClient();

  const fetchListings = useCallback(async () => {
    if (searchParams) {
      // Search mode - fetch based on params
      setLoading(true);
      try {
        // Implementation depends on your search API
        // This is a placeholder
        // TODO: Implement proper search logic based on searchParams
        // For now, just fetch all listings
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data to match Listing type
        // This is a placeholder - actual implementation would use proper RPC
        setListings([]);
      } catch (err) {
        logger.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  }, [searchParams, supabase]);

  useEffect(() => {
    if (!initialListings.length && searchParams) {
      fetchListings();
    }
  }, [fetchListings, initialListings.length, searchParams]);

  const handleRefresh = () => {
    fetchListings();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={handleRefresh} 
          className="text-blue-600 hover:underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <ListingGrid 
      listings={listings} 
      loading={loading}
      emptyMessage={emptyMessage || t('listings.noResults')}
    />
  );
}