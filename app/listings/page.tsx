'use client';

import { useState } from 'react';
import Filters from '../components/search/Filters';
import ListingGrid from '../components/search/ListingGrid';
import { LayoutGrid, List } from "lucide-react";

// Dummy data for demonstration
const dummyListings = [
  {
    id: '1',
    title: 'Modern Apartment in Shibuya',
    description: 'Beautiful 1LDK apartment near Shibuya station. Perfect for singles or couples.',
    price: 150000,
    location: 'Shibuya, Tokyo',
    category: 'Housing',
    imageUrl: 'https://placehold.co/600x400',
    createdAt: '2024-03-20',
  },
  {
    id: '2',
    title: 'English Teaching Position',
    description: 'Looking for native English teachers for our language school in Shinjuku.',
    price: 280000,
    location: 'Shinjuku, Tokyo',
    category: 'Jobs',
    imageUrl: 'https://placehold.co/600x400',
    createdAt: '2024-03-19',
  },
  {
    id: '3',
    title: 'Used MacBook Pro 2023',
    description: 'M2 Pro, 16GB RAM, 512GB SSD. Perfect condition with warranty.',
    price: 180000,
    location: 'Minato, Tokyo',
    category: 'Items',
    imageUrl: 'https://placehold.co/600x400',
    createdAt: '2024-03-18',
  },
];

export default function ListingsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState(dummyListings);

  const handleFilterChange = (filters: any) => {
    // In a real application, this would make an API call with the filters
    console.log('Applying filters:', filters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">All Listings</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {listings.length} listings found
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">List</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Filters onFilterChange={handleFilterChange} />
        </div>

        {/* Listings Grid */}
        <div className="flex-1">
          <ListingGrid listings={listings} viewMode={viewMode} />
        </div>
      </div>
    </div>
  );
} 