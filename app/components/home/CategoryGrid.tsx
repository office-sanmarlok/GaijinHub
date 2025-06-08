'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const categories = [
  { 
    id: 'Housing', 
    name: 'Housing', 
    icon: '🏠',
    description: '住居・アパート・シェアハウス',
    englishDescription: 'Apartments, Houses, Share Houses'
  },
  { 
    id: 'Jobs', 
    name: 'Jobs', 
    icon: '💼',
    description: '求人・アルバイト・転職',
    englishDescription: 'Full-time, Part-time, Career Change'
  },
  { 
    id: 'Items for Sale', 
    name: 'Items for Sale', 
    icon: '🛍️',
    description: '家具・家電・日用品',
    englishDescription: 'Furniture, Electronics, Daily Items'
  },
  { 
    id: 'Services', 
    name: 'Services', 
    icon: '🔧',
    description: 'サービス・レッスン・相談',
    englishDescription: 'Services, Lessons, Consultation'
  }
];

export default function CategoryGrid() {
  const router = useRouter();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/listings?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            カテゴリから探す
          </h2>
          <p className="text-lg text-gray-600">
            Browse by Categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-2 text-sm">
                  {category.description}
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  {category.englishDescription}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category.id);
                  }}
                >
                  探す / Browse
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">
              今すぐ投稿してみませんか？
            </h3>
            <p className="text-gray-600 mb-6">
              Ready to post your listing?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/listings/new')}
              >
                投稿する / Post Listing
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/listings')}
              >
                すべて見る / View All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 