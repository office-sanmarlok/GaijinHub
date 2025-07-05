'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/providers/supabase-provider';
import type { Database } from '@/types/supabase';
import type { Listing } from '@/types/listing';
import { logger } from '@/lib/utils/logger';


export default function FavoritesPage() {
  const { user, isLoading: isUserLoading } = useSupabase();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login page if user is not logged in
    if (!isUserLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }

    const fetchFavorites = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const supabase = createClient();

        // お気に入りと関連リスティングをジョインクエリで取得
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            listing_id,
            listings:listing_id (
              id, 
              title,
              body,
              price,
              category,
              rep_image_url,
              created_at,
              user_id,
              has_location,
              is_city_only,
              muni_id,
              station_id,
              lat,
              lng
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // レスポンスデータの形式を整える
        const formattedListings: Listing[] = data
          .filter((item) => item.listings) // リスティングが存在するもののみフィルタリング
          .map((item) => {
            const listing = item.listings as Database['public']['Tables']['listings']['Row'];
            return {
              id: listing.id,
              title: listing.title,
              body: listing.body,
              category: listing.category,
              price: listing.price,
              currency: 'JPY',
              rep_image_url: listing.rep_image_url || undefined,
              created_at: listing.created_at || new Date().toISOString(),
              user_id: listing.user_id,
              location: {
                has_location: listing.has_location || false,
                is_city_only: listing.is_city_only || false,
                muni_name: '',
                pref_name: '',
              },
              images: listing.rep_image_url ? [{
                url: listing.rep_image_url,
                alt: listing.title,
                is_primary: true
              }] : [],
              is_favorited: true,
            };
          });

        setListings(formattedListings);
      } catch (err) {
        logger.error('Error fetching favorites:', err);
        setError('Failed to load favorites');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
    }
  }, [user, isUserLoading, router, locale]);

  if (isUserLoading || (isLoading && user)) {
    return (
      <div className="container-responsive py-20">
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-responsive py-20">
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive py-20">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.favorites')}</h1>

      {listings.length === 0 ? (
        <Card className="p-6">
          <p className="text-center">{t('listings.noFavorites')}</p>
        </Card>
      ) : (
        <ListingGrid listings={listings} defaultView="grid" />
      )}
    </div>
  );
}
