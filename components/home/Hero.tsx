'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.append('q', searchQuery);
    }
    if (category) {
      params.append('category', category);
    }
    if (location) {
      params.append('location', location);
    }

    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="relative h-[600px] flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/tokyo_night.jpg"
          alt="Tokyo night view"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative text-white text-center max-w-4xl px-4 z-10">
        <h1 className="text-5xl font-bold mb-6">
          Connect with Japan&apos;s Foreign Community
        </h1>
        <p className="text-xl mb-8">
          Find apartments, jobs, items for sale, and services specifically catered to expats and international residents all across Japan.
        </p>

        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="What are you looking for?"
              className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" className="text-black">Category</option>
              <option value="Housing" className="text-black">Housing</option>
              <option value="Jobs" className="text-black">Jobs</option>
              <option value="Items for Sale" className="text-black">Items for Sale</option>
              <option value="Services" className="text-black">Services</option>
            </select>
            <input
              type="text"
              placeholder="Location (e.g. Tokyo, Osaka)"
              className="px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/70"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
