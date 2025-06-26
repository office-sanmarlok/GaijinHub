'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import ListingGrid from '@/components/search/ListingGrid';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/providers/supabase-provider';
import type { Database } from '@/types/supabase';

// Supabaseの型定義を利用
type Listing = Database['public']['Tables']['listings']['Row'] & {
  imageUrl?: string;
};

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
              user_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // レスポンスデータの形式を整える
        const formattedListings = data
          .filter((item) => item.listings) // リスティングが存在するもののみフィルタリング
          .map((item) => {
            // APIレスポンスの型はany扱いで、必要なプロパティを持つことを確認
            const listing = item.listings as unknown as Database['public']['Tables']['listings']['Row'];
            return {
              ...listing,
              imageUrl: listing.rep_image_url || 'https://placehold.co/600x400',
            };
          });

        setListings(formattedListings);
      } catch (err) {
        console.error('Error fetching favorites:', err);
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
      <div className="container mx-auto py-20 px-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-20 px-4">
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.favorites')}</h1>

      {listings.length === 0 ? (
        <Card className="p-6">
          <p className="text-center">{t('listings.noFavorites')}</p>
        </Card>
      ) : (
        <ListingGrid listings={listings} viewMode="grid" />
      )}
    </div>
  );
}
