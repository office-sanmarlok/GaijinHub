'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '@/app/providers/theme-provider';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const { language } = useTheme();

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
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-6">
          {language === 'ja' 
            ? '日本の外国人コミュニティをつなぐ' 
            : "Connect with Japan's Foreign Community"}
        </h1>
        <p className="text-xl mb-8">
          {language === 'ja'
            ? '住まい、仕事、売買、サービスなど、在日外国人に特化した情報をお届けします。'
            : 'Find apartments, jobs, items for sale, and services specifically catered to expats and international residents all across Japan.'}
        </p>

        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder={language === 'ja' ? '検索キーワード' : 'What are you looking for?'}
              className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{language === 'ja' ? 'カテゴリー' : 'Category'}</option>
              <option value="housing">{language === 'ja' ? '住まい' : 'Housing'}</option>
              <option value="jobs">{language === 'ja' ? '仕事' : 'Jobs'}</option>
              <option value="items">{language === 'ja' ? '売ります・買います' : 'Items for Sale'}</option>
              <option value="services">{language === 'ja' ? 'サービス' : 'Services'}</option>
            </select>
            <select
              className="px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">{language === 'ja' ? '地域' : 'Location'}</option>
              <option value="tokyo">東京</option>
              <option value="osaka">大阪</option>
              <option value="kyoto">京都</option>
            </select>
            <button className="px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
              {language === 'ja' ? '検索' : 'Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 