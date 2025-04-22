'use client';

import Link from 'next/link';
import { useTheme } from '@/app/providers/theme-provider';

const categories = [
  {
    id: 'housing',
    name: 'Housing',
    nameJa: '住まい',
    icon: '🏠',
    description: 'Find apartments, sharehouse, or short-term stays',
    descriptionJa: 'アパート、シェアハウス、短期滞在先を探す',
    color: 'bg-blue-50',
    textColor: 'text-blue-900',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    nameJa: '仕事',
    icon: '💼',
    description: 'Browse employment opportunities for foreign residents',
    descriptionJa: '外国人向けの求人情報を探す',
    color: 'bg-purple-50',
    textColor: 'text-purple-900',
  },
  {
    id: 'items',
    name: 'Items for Sale',
    nameJa: '売ります・買います',
    icon: '🛍️',
    description: 'Buy and sell used goods in your area',
    descriptionJa: 'あなたの地域で中古品の売買',
    color: 'bg-green-50',
    textColor: 'text-green-900',
  },
  {
    id: 'services',
    name: 'Services',
    nameJa: 'サービス',
    icon: '🔧',
    description: 'Find service providers who speak your language',
    descriptionJa: 'あなたの言語を話すサービス提供者を見つける',
    color: 'bg-orange-50',
    textColor: 'text-orange-900',
  },
  {
    id: 'education',
    name: 'Education',
    nameJa: '教育',
    icon: '📚',
    description: 'Language schools, tutoring, and education resources',
    descriptionJa: '語学学校、家庭教師、教育リソース',
    color: 'bg-red-50',
    textColor: 'text-red-900',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    nameJa: '交通',
    icon: '🚗',
    description: 'Cars, bikes, and transport services',
    descriptionJa: '車、自転車、交通サービス',
    color: 'bg-yellow-50',
    textColor: 'text-yellow-900',
  },
  {
    id: 'community',
    name: 'Community',
    nameJa: 'コミュニティ',
    icon: '👥',
    description: 'Events, meetups, and community activities',
    descriptionJa: 'イベント、交流会、コミュニティ活動',
    color: 'bg-pink-50',
    textColor: 'text-pink-900',
  },
  {
    id: 'food',
    name: 'Food & Dining',
    nameJa: '飲食',
    icon: '🍽️',
    description: 'Restaurants, catering, and food services',
    descriptionJa: 'レストラン、ケータリング、フードサービス',
    color: 'bg-teal-50',
    textColor: 'text-teal-900',
  },
];

const CategoryGrid = () => {
  const { language } = useTheme();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-600">
          {language === 'ja' ? 'カテゴリーから探す' : 'Browse by Category'}
        </h2>
        <p className="text-gray-600 text-center mb-12">
          {language === 'ja' 
            ? '在日外国人コミュニティのために整理されたカテゴリーから、必要な情報を見つけることができます。'
            : 'Find exactly what you need with our organized categories tailored for the foreign community in Japan.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className={`${category.color} p-6 rounded-lg transition-transform hover:scale-105 hover:shadow-md`}
            >
              <div className="flex flex-col h-full">
                <span className="text-4xl mb-4">{category.icon}</span>
                <h3 className={`text-xl font-semibold mb-2 ${category.textColor}`}>
                  {language === 'ja' ? category.nameJa : category.name}
                </h3>
                <p className={`text-sm flex-grow ${category.textColor} opacity-90`}>
                  {language === 'ja' ? category.descriptionJa : category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;