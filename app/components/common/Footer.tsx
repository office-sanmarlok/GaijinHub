'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href={`/${locale}`} className="text-xl font-bold text-gray-600">
              🌏 GaijinHub
            </Link>
            <p className="mt-4 text-gray-600">
              Connecting the foreign community in Japan with the services, items, and opportunities they need.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600">{t('help')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/about`} className="text-gray-600 hover:text-gray-800">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-600 hover:text-gray-800">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-600 hover:text-gray-800">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-gray-600 hover:text-gray-800">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 