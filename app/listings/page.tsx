'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Filters from '../components/search/Filters';
import ListingGrid from '../components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  description?: string;
  location?: string;
  imageUrl?: string;
};

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async (filters?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  }) => {
    try {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from('listings').select('*');

      if (filters?.q) {
        query = query.or(`title.ilike.%${filters.q}%,body.ilike.%${filters.q}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.location) {
        query = query.ilike('city', `%${filters.location}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedListings = data.map(listing => ({
        ...listing,
        description: listing.body,
        location: listing.city || '場所未設定',
        imageUrl: listing.rep_image_url || 'https://placehold.co/600x400',
      }));

      setListings(formattedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('リスティングの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filters = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
    };
    fetchListings(filters);
  }, [searchParams]);

  const handleFilterChange = (filters: any) => {
    fetchListings(filters);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">リスティング一覧</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Filters onFilterChange={handleFilterChange} />
        </div>
        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <ListingGrid listings={listings} viewMode={viewMode} />
          )}
        </div>
      </div>
    </div>
  );
} 