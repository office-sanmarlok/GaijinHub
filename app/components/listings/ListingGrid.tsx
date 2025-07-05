'use client';

import { Grid, List } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ListingCard } from './ListingCard';
import type { Listing } from '@/types/listing';

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
  emptyMessage?: string;
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
}

export function ListingGrid({ 
  listings, 
  loading = false,
  emptyMessage,
  showViewToggle = true,
  defaultView = 'list'
}: ListingGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const t = useTranslations('listings');

  if (loading && listings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('searching')}</p>
        </div>
      </div>
    );
  }

  if (listings.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{emptyMessage || t('noResults')}</p>
      </div>
    );
  }

  return (
    <div>
      {showViewToggle && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="touch-target"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="touch-target"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div
        className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}
      >
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
        ))}
      </div>

      {loading && listings.length > 0 && (
        <div className="text-center py-4">
          <p className="text-gray-600">{t('loadingMore')}</p>
        </div>
      )}
    </div>
  );
}