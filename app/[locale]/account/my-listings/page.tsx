'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/providers/supabase-provider';
import type { Database } from '@/types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  imageUrl?: string;
};

export default function MyListingsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading } = useSupabase();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const supabase = createClient();
  const t = useTranslations();

  const fetchMyListings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedListings = data.map((listing) => ({
        ...listing,
        imageUrl: listing.rep_image_url || '/images/no-image-placeholder.svg',
      }));

      setListings(formattedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to retrieve listings');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }

    if (user) {
      fetchMyListings();
    }
  }, [user, isLoading, router, locale, fetchMyListings]);

  const handleDeleteClick = (id: string) => {
    setListingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;

    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingToDelete);

      if (error) throw error;

      // Update listing list after deletion
      setListings(listings.filter((listing) => listing.id !== listingToDelete));
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete');
    }
  };

  if (isLoading || (loading && !error)) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center py-12">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.myListings')}</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="mb-4">{t('listings.noListings')}</p>
          <Link href={`/${locale}/listings/new`}>
            <Button>{t('listings.createNewListing')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 relative">
              <div className="w-full md:w-32 h-32 flex-shrink-0 relative">
                <Image
                  src={listing.imageUrl || ''}
                  alt={listing.title || t('listings.listingImage')}
                  fill
                  sizes="(max-width: 768px) 100vw, 128px"
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-medium mb-2">{listing.title}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  {t('listings.price')}: ¥{listing.price?.toLocaleString() || t('listings.notSpecified')}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {t('listings.postedOn')}: {new Date(listing.created_at).toLocaleDateString(locale)}
                </p>
                <div className="flex gap-2 mt-2">
                  <Link href={`/${locale}/listings/${listing.id}`}>
                    <Button variant="outline" size="sm">
                      {t('listings.viewDetails')}
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(listing.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> {t('listings.delete')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('listings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('listings.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('listings.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
