'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Filters from '../components/search/Filters';
import ListingGrid from '../components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";
import { Database } from '@/types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  description?: string;
  location?: string;
  imageUrl?: string;
};

interface ListingFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async (filters?: ListingFilters) => {
    try {
      setLoading(true);
      
      // Use server-side API that doesn't depend on auth state
      const queryParams = new URLSearchParams();
      
      if (filters?.q) {
        queryParams.append('q', filters.q);
      }
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      if (filters?.minPrice) {
        queryParams.append('minPrice', filters.minPrice.toString());
      }
      if (filters?.maxPrice) {
        queryParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters?.location) {
        queryParams.append('location', filters.location);
      }
      
      const apiUrl = `/api/listings?${queryParams.toString()}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const formattedListings = data.map((listing: Database['public']['Tables']['listings']['Row']) => ({
        ...listing,
        description: listing.body,
        location: listing.city || 'Location not set',
        imageUrl: listing.rep_image_url || 'https://placehold.co/600x400',
      }));

      setListings(formattedListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filters: ListingFilters = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
    };
    fetchListings(filters);
  }, [searchParams]);

  const handleFilterChange = (filters: ListingFilters) => {
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
        <h1 className="text-2xl font-bold">Listings</h1>
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
            <div className="text-center py-8">Loading...</div>
          ) : (
            <ListingGrid listings={listings} viewMode={viewMode} />
          )}
        </div>
      </div>
    </div>
  );
} 