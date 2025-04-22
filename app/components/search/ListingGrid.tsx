import { useState } from 'react';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl: string;
  createdAt: string;
}

interface ListingGridProps {
  listings: Listing[];
  viewMode: 'grid' | 'list';
}

const ListingGrid = ({ listings, viewMode }: ListingGridProps) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No listings found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div
      className={`
        grid gap-6 transition-all duration-300
        ${viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
        }
      `}
    >
      {listings.map((listing) => (
        <div
          key={listing.id}
          className={`
            bg-white rounded-lg shadow-sm overflow-hidden
            transition-all duration-300 hover:shadow-md
            ${viewMode === 'list' 
              ? 'flex gap-4' 
              : 'flex flex-col'
            }
          `}
        >
          <div className={`
            relative overflow-hidden
            ${viewMode === 'list' ? 'w-48 h-32' : 'w-full aspect-video'}
          `}>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-600">{listing.title}</h3>
            <p className="text-gray-600 mb-2">{listing.location}</p>
            <p className="text-black font-medium">¥{listing.price.toLocaleString()}/month</p>
            {viewMode === 'list' && (
              <p className="text-gray-500 mt-2 text-sm line-clamp-2">
                {listing.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListingGrid; 