'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return (
    <footer className="bg-gray-50 py-responsive-lg">
      <div className="container-responsive">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href={`/${locale}`} className="text-xl font-bold text-gray-600">
              🌏 {tCommon('appName')}
            </Link>
            <p className="mt-4 text-gray-600 text-responsive-sm">
              Connecting the foreign community in Japan with the services, items, and opportunities they need.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-600 text-responsive-base">{t('help')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/about`} className="text-gray-600 hover:text-gray-800 text-responsive-sm inline-block py-1">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-600 hover:text-gray-800 text-responsive-sm inline-block py-1">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-600 hover:text-gray-800 text-responsive-sm inline-block py-1">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-gray-600 hover:text-gray-800 text-responsive-sm inline-block py-1">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs md:text-sm text-center md:text-left">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
