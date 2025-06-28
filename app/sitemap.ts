import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { locales } from '../i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gaijin-hub.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages for each locale
  const staticRoutes = ['', '/listings', '/login', '/signup', '/account', '/account/favorites', '/account/my-listings'];

  const staticPages: MetadataRoute.Sitemap = [];

  // Generate static pages for each locale
  for (const locale of locales) {
    for (const route of staticRoutes) {
      staticPages.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${route}`])),
        },
      });
    }
  }

  // Dynamic pages (listings)
  try {
    const { data: listings } = await supabase
      .from('listings')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    const dynamicPages: MetadataRoute.Sitemap = [];

    if (listings) {
      for (const listing of listings) {
        for (const locale of locales) {
          dynamicPages.push({
            url: `${baseUrl}/${locale}/listings/${listing.id}`,
            lastModified: listing.created_at ? new Date(listing.created_at) : new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
            alternates: {
              languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}/listings/${listing.id}`])),
            },
          });
        }
      }
    }

    return [...staticPages, ...dynamicPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
