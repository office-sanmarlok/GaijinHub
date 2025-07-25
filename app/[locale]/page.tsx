import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
// import AboutSection from '@/components/home/AboutSection';
// import CategoryGrid from '@/components/home/CategoryGrid';
import Hero from '@/components/home/Hero';
import { locales } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const alternateLanguages: Record<string, string> = {};
  locales.forEach((l) => {
    alternateLanguages[l] = `/${l}`;
  });

  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: {
      languages: alternateLanguages,
      canonical: `/${locale}`,
    },
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      locale: locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: 'website',
      siteName: tCommon('appName'),
      url: `https://gaijin-hub.vercel.app/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('home.title'),
      description: t('home.description'),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero Section */}
      <Hero />

      {/* About Section - Temporarily commented out until i18n is added */}
      {/* <AboutSection /> */}

      {/* Category Grid - Temporarily commented out until i18n is added */}
      {/* <CategoryGrid /> */}
    </main>
  );
}
