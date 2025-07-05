'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Globe, MessageSquare, MapPin, Languages, Train, Users, Search, Clock, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="py-hero">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-responsive-3xl font-bold leading-tight">
              {t('hero.title')}
              <span className="block mt-2 text-gray-600">{t('hero.subtitle')}</span>
            </h1>
            <p className="mt-6 sm:mt-8 text-responsive-lg text-gray-600 leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center justify-center px-responsive-base py-responsive-sm text-responsive-base font-medium bg-black text-white hover:bg-gray-800 transition-colors touch-target"
              >
                {t('hero.cta.primary')}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href={`/${locale}/listings`}
                className="inline-flex items-center justify-center px-responsive-base py-responsive-sm text-responsive-base font-medium border-2 border-black hover:bg-gray-100 transition-colors touch-target"
              >
                {t('hero.cta.secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Multi-language Display */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div>
              <div className="mb-6">
                <Globe className="w-12 h-12" />
              </div>
              <h2 className="text-responsive-2xl font-bold mb-4 sm:mb-6">{t('features.multiLanguage.title')}</h2>
              <p className="text-responsive-lg text-gray-600 mb-6 sm:mb-8">
                {t('features.multiLanguage.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Languages className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-responsive-base">{t('features.multiLanguage.point1.title')}</h3>
                    <p className="text-gray-600 text-responsive-sm">{t('features.multiLanguage.point1.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-responsive-base">{t('features.multiLanguage.point2.title')}</h3>
                    <p className="text-gray-600 text-responsive-sm">{t('features.multiLanguage.point2.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-responsive-base">{t('features.multiLanguage.point3.title')}</h3>
                    <p className="text-gray-600 text-responsive-sm">{t('features.multiLanguage.point3.description')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-responsive-base border border-gray-200">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">{t('features.multiLanguage.example.original')}</p>
                  <p className="font-medium">東京駅から徒歩5分の1LDKマンション</p>
                </div>
                <div className="p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">{t('features.multiLanguage.example.translated')}</p>
                  <p className="font-medium">1LDK apartment, 5 min walk from Tokyo Station</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Cross-lingual Search */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white p-responsive-base border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('features.crossLingual.demo.searchIn')}</span>
                  </div>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                    placeholder="apartment near Tokyo station"
                    readOnly
                  />
                  <div className="space-y-3">
                    <div className="p-4 bg-white border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">東京駅近くの1LDKマンション</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">日本語</span>
                      </div>
                      <p className="text-sm text-gray-600">東京駅から徒歩5分、設備充実...</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">도쿄역 근처 원룸</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">한국어</span>
                      </div>
                      <p className="text-sm text-gray-600">도쿄역에서 도보 3분, 깨끗한...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6">
                <Search className="w-12 h-12" />
              </div>
              <h2 className="text-responsive-2xl font-bold mb-4 sm:mb-6">{t('features.crossLingual.title')}</h2>
              <p className="text-responsive-lg text-gray-600 mb-6 sm:mb-8">
                {t('features.crossLingual.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Globe className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.crossLingual.point1.title')}</h3>
                    <p className="text-gray-600">{t('features.crossLingual.point1.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Languages className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.crossLingual.point2.title')}</h3>
                    <p className="text-gray-600">{t('features.crossLingual.point2.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.crossLingual.point3.title')}</h3>
                    <p className="text-gray-600">{t('features.crossLingual.point3.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Station-based Search */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white p-responsive-base border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('features.stationBased.demo.search')}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white border border-gray-200 flex items-center gap-3">
                      <Train className="w-5 h-5 text-gray-600" />
                      <span>新宿駅</span>
                      <span className="text-sm text-gray-500 ml-auto">JR山手線</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 flex items-center gap-3">
                      <Train className="w-5 h-5 text-gray-600" />
                      <span>渋谷駅</span>
                      <span className="text-sm text-gray-500 ml-auto">JR山手線</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 flex items-center gap-3">
                      <Train className="w-5 h-5 text-gray-600" />
                      <span>東京駅</span>
                      <span className="text-sm text-gray-500 ml-auto">JR中央線</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6">
                <MapPin className="w-12 h-12" />
              </div>
              <h2 className="text-responsive-2xl font-bold mb-4 sm:mb-6">{t('features.stationBased.title')}</h2>
              <p className="text-responsive-lg text-gray-600 mb-6 sm:mb-8">
                {t('features.stationBased.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Train className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.stationBased.point1.title')}</h3>
                    <p className="text-gray-600">{t('features.stationBased.point1.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.stationBased.point2.title')}</h3>
                    <p className="text-gray-600">{t('features.stationBased.point2.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Search className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.stationBased.point3.title')}</h3>
                    <p className="text-gray-600">{t('features.stationBased.point3.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Direct Chat */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div>
              <div className="mb-6">
                <MessageSquare className="w-12 h-12" />
              </div>
              <h2 className="text-responsive-2xl font-bold mb-4 sm:mb-6">{t('features.directChat.title')}</h2>
              <p className="text-responsive-lg text-gray-600 mb-6 sm:mb-8">
                {t('features.directChat.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.directChat.point1.title')}</h3>
                    <p className="text-gray-600">{t('features.directChat.point1.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.directChat.point2.title')}</h3>
                    <p className="text-gray-600">{t('features.directChat.point2.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('features.directChat.point3.title')}</h3>
                    <p className="text-gray-600">{t('features.directChat.point3.description')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-responsive-sm border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('features.directChat.demo.user1')}</p>
                    <div className="mt-1 p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm">{t('features.directChat.demo.message1')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-10 h-10 bg-black rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 text-right">{t('features.directChat.demo.user2')}</p>
                    <div className="mt-1 p-3 bg-black text-white rounded-lg">
                      <p className="text-sm">{t('features.directChat.demo.message2')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-responsive-lg">
        <div className="container-responsive max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-responsive-2xl font-bold">{t('howItWorks.title')}</h2>
            <p className="mt-4 text-responsive-lg text-gray-600">{t('howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {step}
                </div>
                <h3 className="text-responsive-base font-semibold mb-2">
                  {t(`howItWorks.step${step}.title`)}
                </h3>
                <p className="text-gray-600 text-responsive-sm">{t(`howItWorks.step${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-responsive-lg bg-black text-white">
        <div className="container-responsive max-w-7xl mx-auto text-center">
          <h2 className="text-responsive-2xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-responsive-lg mb-6 sm:mb-8 text-gray-300">{t('cta.subtitle')}</p>
          <Link
            href={`/${locale}/signup`}
            className="inline-flex items-center px-responsive-base py-responsive-sm text-responsive-base font-medium bg-white text-black hover:bg-gray-200 transition-colors touch-target"
          >
            {t('cta.button')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}