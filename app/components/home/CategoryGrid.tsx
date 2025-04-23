'use client';

import Link from 'next/link';
import { useTheme } from '@/app/providers/theme-provider';

const categories = [
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    description: 'Find apartments, sharehouse, or short-term stays',
    color: 'bg-blue-50',
    textColor: 'text-blue-900',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    description: 'Browse employment opportunities for foreign residents',
    color: 'bg-purple-50',
    textColor: 'text-purple-900',
  },
  {
    id: 'items',
    name: 'Items for Sale',
    icon: '🛍️',
    description: 'Buy and sell used goods in your area',
    color: 'bg-green-50',
    textColor: 'text-green-900',
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🔧',
    description: 'Find service providers who speak your language',
    color: 'bg-orange-50',
    textColor: 'text-orange-900',
  }
];

const CategoryGrid = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-600">
          Browse by Category
        </h2>
        <p className="text-gray-600 text-center mb-12">
          Find exactly what you need with our organized categories tailored for the foreign community in Japan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/listings?category=${category.id}`}
              className={`${category.color} ${category.textColor} p-6 rounded-lg transition-transform hover:scale-105`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm opacity-90">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;