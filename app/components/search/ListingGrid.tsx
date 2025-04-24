'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Database } from '@/types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  description?: string;
  location?: string;
  imageUrl?: string;
};

interface ListingGridProps {
  listings: Listing[];
  viewMode: 'grid' | 'list';
}

export default function ListingGrid({ listings, viewMode }: ListingGridProps) {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-6'
      }
    >
      {listings.map((listing) => (
        <Link key={listing.id} href={`/listings/${listing.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div
              className={`${
                viewMode === 'list' ? 'flex gap-6' : ''
              } h-full`}
            >
              <div
                className={`relative ${
                  viewMode === 'list' ? 'w-48 flex-shrink-0' : 'pt-[60%]'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.imageUrl || 'https://placehold.co/600x400'}
                  alt={listing.title}
                  className={`${
                    viewMode === 'list'
                      ? 'h-full w-full object-cover'
                      : 'absolute inset-0 w-full h-full object-cover'
                  }`}
                />
              </div>

              <div className="flex-1">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                  <p className="text-sm text-gray-500">{listing.category}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="line-clamp-2 text-gray-600">
                      {listing.body}
                    </p>
                    {listing.price && (
                      <p className="font-bold">¥{listing.price.toLocaleString()}</p>
                    )}
                    {listing.city && (
                      <p className="text-sm text-gray-500">{listing.city}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 