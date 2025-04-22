'use client';

import { useState } from 'react';

interface FiltersProps {
  onFilterChange: (filters: any) => void;
}

const Filters = ({ onFilterChange }: FiltersProps) => {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [priceRange, setPriceRange] = useState(1000000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recent');

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      searchKeywords,
      priceRange,
      categories: selectedCategories,
      locations: selectedLocations,
      sortBy,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-6">
        {/* Search Keywords */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Search Keywords
          </label>
          <input
            type="text"
            id="keywords"
            className="w-full px-3 py-2 border rounded-md text-gray-600"
            placeholder="Enter keywords..."
            value={searchKeywords}
            onChange={(e) => setSearchKeywords(e.target.value)}
          />
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            id="sort"
            className="w-full px-3 py-2 border rounded-md text-gray-600"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent" className="text-gray-600">Most Recent</option>
            <option value="price_low" className="text-gray-600">Price: Low to High</option>
            <option value="price_high" className="text-gray-600">Price: High to Low</option>
            <option value="popular" className="text-gray-600">Most Popular</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (¥)
          </label>
          <input
            type="range"
            id="price"
            min="0"
            max="1000000"
            step="10000"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>¥0</span>
            <span>¥{priceRange.toLocaleString()}</span>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
          <div className="space-y-2">
            {['Housing', 'Jobs', 'Items', 'Services'].map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="rounded text-black"
                />
                <span className="ml-2 text-sm text-gray-600">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Locations</h3>
          <div className="space-y-2">
            {['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka'].map((location) => (
              <label key={location} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="rounded text-black"
                />
                <span className="ml-2 text-sm text-gray-600">{location}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filters; 