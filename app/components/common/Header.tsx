'use client';

import { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            GaijinHub
          </Link>

          {/* Search Section */}
          <div className="flex-1 max-w-3xl mx-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What are you looking for?"
                className="flex-1 px-4 py-2 border rounded-lg bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="px-4 py-2 border rounded-lg bg-background"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                <option value="housing">Housing</option>
                <option value="jobs">Jobs</option>
                <option value="items">Items for Sale</option>
                <option value="services">Services</option>
              </select>
              <select
                className="px-4 py-2 border rounded-lg bg-background"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Location</option>
                <option value="tokyo">Tokyo</option>
                <option value="osaka">Osaka</option>
                <option value="kyoto">Kyoto</option>
              </select>
              <button className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90">
                Search
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-foreground hover:opacity-80">
              Sign In
            </Link>
            <Link
              href="/post"
              className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
            >
              Post
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 