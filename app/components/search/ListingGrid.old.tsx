'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FavoriteButton } from '@/components/ui/favorite-button';
import type { Listing } from '@/types/listing';

interface ListingGridProps {
  listings: Listing[];
  viewMode: 'grid' | 'list';
}

export default function ListingGrid({ listings, viewMode }: ListingGridProps) {
  return (
    <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'}>
      {listings.map((listing) => (
        <div key={listing.id} className="relative group">
          <Link href={`/listings/${listing.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              <div className={`${viewMode === 'list' ? 'sm:flex items-center' : ''} h-full p-4`}>
                <div
                  className={`${
                    viewMode === 'list'
                      ? 'sm:w-40 md:w-48 aspect-[4/3] flex-shrink-0 flex items-center justify-center mb-4 sm:mb-0'
                      : 'aspect-[4/3] relative mx-auto mb-4'
                  }`}
                >
                  <div className="w-full h-full relative overflow-hidden rounded-md">
                    <Image
                      src={listing.rep_image_url || '/images/no-image-placeholder.svg'}
                      alt={listing.title || '物件画像'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      priority={false}
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'sm:pl-6' : ''}`}>
                  <CardHeader className="pb-0 px-0">
                    <CardTitle className="line-clamp-2 text-lg">{listing.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{listing.category}</p>
                  </CardHeader>
                  <CardContent className="flex-1 pt-3 px-0">
                    <div className="space-y-2">
                      <p className="line-clamp-2 text-gray-600">{listing.body}</p>
                      {listing.price && <p className="font-bold">¥{listing.price.toLocaleString()}</p>}
                      {(listing.location?.station_group_name ||
                        listing.location?.station_name ||
                        (listing.location?.muni_name && listing.location?.pref_name)) && (
                        <p className="text-sm text-gray-500">
                          {listing.location?.station_group_name ||
                            listing.location?.station_name ||
                            (listing.location?.muni_name && listing.location?.pref_name
                              ? `${listing.location.pref_name} ${listing.location.muni_name}`
                              : '')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </Link>
          {/* お気に入りボタン */}
          <div className="absolute top-4 right-4 z-10">
            <FavoriteButton listingId={listing.id} size="sm" variant="outline" className="bg-white/80 hover:bg-white" />
          </div>
        </div>
      ))}
    </div>
  );
}
