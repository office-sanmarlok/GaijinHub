'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/providers/supabase-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
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
import { Database } from '@/types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  imageUrl?: string;
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, isLoading } = useSupabase();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMyListings = async () => {
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
        imageUrl: listing.rep_image_url || 'https://placehold.co/600x400',
      }));

      setListings(formattedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to retrieve listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      fetchMyListings();
    }
  }, [user, isLoading]);

  const handleDeleteClick = (id: string) => {
    setListingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingToDelete);
      
      if (error) throw error;
      
      // 削除後にリスト更新
      setListings(listings.filter(listing => listing.id !== listingToDelete));
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
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">My Listings</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="mb-4">No listings found</p>
          <Link href="/listings/new">
            <Button>Create New Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div 
              key={listing.id} 
              className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 relative"
            >
              <div className="w-full md:w-32 h-32 flex-shrink-0">
                <img 
                  src={listing.imageUrl} 
                  alt={listing.title} 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-medium mb-2">{listing.title}</h3>
                <p className="text-sm text-gray-500 mb-1">Price: ¥{listing.price?.toLocaleString() || 'Not specified'}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Posted on: {new Date(listing.created_at).toLocaleDateString('en-US')}
                </p>
                <div className="flex gap-2 mt-2">
                  <Link href={`/listings/${listing.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteClick(listing.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
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
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This listing will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 