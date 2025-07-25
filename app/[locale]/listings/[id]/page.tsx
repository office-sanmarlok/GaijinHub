import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ListingDetailClient } from '@/components/listings/ListingDetailClient';
import { createClient } from '@/lib/supabase/server';
import { locales } from '../../../../i18n/config';
import { logger } from '@/lib/utils/logger';

interface ListingDetailProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

interface ListingDetail {
  // Basic fields
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  price: number | null;
  currency: string;
  original_language: string | null;
  lat: number | null;
  lng: number | null;
  station_g_cd: string | null;
  muni_id: string | null;
  is_city_only: boolean;
  has_location: boolean;
  rep_image_url: string | null;
  created_at: string;

  // Translation
  translation?: {
    title: string;
    body: string;
    is_auto_translated: boolean;
  };

  // Images
  images: {
    id: string;
    path: string;
    order: number;
    url: string;
  }[];

  // Related data
  station?: {
    station_g_cd: string;
    station_name: string;
    station_name_r?: string;
    station_name_h?: string;
    lines?: Array<{
      line_name: string;
      line_name_r?: string;
      company_name: string;
      company_name_r?: string;
    }>;
  };
  municipality?: {
    muni_id: string;
    muni_name: string;
    muni_name_r?: string;
    muni_name_h?: string;
    pref_name?: string;
    pref_name_r?: string;
    pref_name_h?: string;
  };

  // User info
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };

  // Favorites
  favorite_count?: number;
}

export async function generateMetadata({ params }: ListingDetailProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  try {
    // Get listing data for metadata
    const supabase = await createClient();
    const { data: listing, error } = await supabase.from('listings').select('title, body').eq('id', id).single();
    
    if (error) {
      logger.error('Error fetching listing for metadata:', { error, listingId: id });
    }

    if (!listing) {
      return {
        title: t('listings.title'),
        description: t('listings.description'),
      };
    }

    // Get translations if available
    const { data: translation } = await supabase
      .from('listing_translations')
      .select('title, body')
      .eq('listing_id', id)
      .eq('locale', locale)
      .single();

    const title = translation?.title || listing.title;
    const description = translation?.body || listing.body;
    const truncatedDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description;

    const alternateLanguages: Record<string, string> = {};
    locales.forEach((l) => {
      alternateLanguages[l] = `/${l}/listings/${id}`;
    });

    return {
      title: `${title} - ${tCommon('appName')}`,
      description: truncatedDescription,
      alternates: {
        languages: alternateLanguages,
        canonical: `/${locale}/listings/${id}`,
      },
      openGraph: {
        title: `${title} - ${tCommon('appName')}`,
        description: truncatedDescription,
        type: 'article',
        locale: locale,
        alternateLocale: locales.filter((l) => l !== locale),
        siteName: tCommon('appName'),
        url: `https://gaijin-hub.vercel.app/${locale}/listings/${id}`,
      },
      twitter: {
        card: 'summary',
        title: `${title} - ${tCommon('appName')}`,
        description: truncatedDescription,
      },
    };
  } catch (error) {
    logger.error('Error in generateMetadata:', { error, listingId: id });
    return {
      title: t('listings.title'),
      description: t('listings.description'),
    };
  }
}

async function getListingDetail(id: string, locale: string): Promise<ListingDetail | null> {
  let supabase;
  
  try {
    supabase = await createClient();
  } catch (error) {
    logger.error('Failed to create Supabase client:', error);
    return null;
  }

  try {
    // Get listing with all related data using left joins (nullable foreign keys)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        images (
          id,
          path,
          order
        ),
        station_groups (
          station_g_cd,
          station_name,
          station_name_r,
          station_name_h,
          lat,
          lng,
          address
        ),
        municipalities (
          muni_id,
          muni_name,
          muni_name_r,
          muni_name_h,
          pref_id,
          prefectures (
            pref_id,
            pref_name,
            pref_name_r,
            pref_name_h
          )
        )
      `)
      .eq('id', id)
      .single();

    if (listingError) {
      logger.error('Error fetching listing:', { error: listingError, listingId: id });
      return null;
    }

    if (!listing) {
      logger.error('Listing not found');
      return null;
    }

    // Get user info using RPC function
    let userInfo: ListingDetail['user'] | undefined;
    try {
      const { data: userData, error: userError } = await supabase
        .rpc('get_auth_user', { user_id: listing.user_id })
        .single();
      
      if (!userError && userData && typeof userData === 'object' && 'id' in userData) {
        userInfo = {
          id: userData.id as string,
          display_name: (userData.display_name as string) || undefined,
          avatar_url: undefined // avatar_url not available from get_auth_user
        };
      }
    } catch (error) {
      logger.error('Failed to fetch user info:', error);
    }

    // Get station lines if station exists
    interface StationLine {
      line_id: string;
      line_name?: string | null;
      line_name_r?: string | null;
      line_name_h?: string | null;
      company_cd?: string | null;
      company_name?: string | null;
      company_name_r?: string | null;
      company_name_h?: string | null;
    }
    
    let stationLines: StationLine[] = [];
    if (listing.station_g_cd) {
      const { data: lines } = await supabase
        .from('stations')
        .select(`
          lines!line_cd (
            line_id,
            line_name,
            line_name_r,
            line_name_h,
            company_cd,
            companies!company_cd (
              company_cd,
              company_name,
              company_name_r,
              company_name_h
            )
          )
        `)
        .eq('station_g_cd', listing.station_g_cd)
        .eq('e_status', '0');

      if (lines) {
        stationLines = lines.map((l) => ({
          line_id: l.lines.line_id,
          line_name: l.lines.line_name,
          line_name_r: l.lines.line_name_r,
          line_name_h: l.lines.line_name_h,
          company_cd: l.lines.company_cd,
          company_name: l.lines.companies?.company_name,
          company_name_r: l.lines.companies?.company_name_r,
          company_name_h: l.lines.companies?.company_name_h,
        }));
      }
    }

    // Process images to add public URLs
    const processedImages =
      listing.images?.map((image) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from('listing-images').getPublicUrl(image.path);
        return { ...image, url: publicUrl || '' };
      }) ?? [];

    // Get translation for the current locale
    const { data: translation, error: translationError } = await supabase
      .from('listing_translations')
      .select('title, body, is_auto_translated')
      .eq('listing_id', id)
      .eq('locale', locale)
      .single();

    if (translationError && translationError.code !== 'PGRST116') {
      logger.error('Error fetching translation:', { error: translationError, listingId: id, locale });
    }

    // Format the response
    const formattedListing: ListingDetail = {
      id: listing.id,
      user_id: listing.user_id,
      category: listing.category,
      title: listing.title,
      body: listing.body,
      price: listing.price,
      currency: 'JPY',
      original_language: listing.original_language,
      lat: listing.lat,
      lng: listing.lng,
      station_g_cd: listing.station_g_cd,
      muni_id: listing.muni_id,
      is_city_only: listing.is_city_only || false,
      has_location: listing.has_location || false,
      rep_image_url: listing.rep_image_url,
      created_at: listing.created_at || '',
      images: processedImages,
      user: userInfo,
      station: listing.station_groups
        ? {
            station_g_cd: listing.station_groups.station_g_cd,
            station_name: listing.station_groups.station_name,
            station_name_r: listing.station_groups.station_name_r || undefined,
            station_name_h: listing.station_groups.station_name_h || undefined,
            lines: stationLines.map(line => ({
              line_name: line.line_name || '',
              line_name_r: line.line_name_r || undefined,
              company_name: line.company_name || '',
              company_name_r: line.company_name_r || undefined,
            })),
          }
        : undefined,
      municipality: listing.municipalities
        ? {
            muni_id: listing.municipalities.muni_id,
            muni_name: listing.municipalities.muni_name,
            muni_name_r: listing.municipalities.muni_name_r || undefined,
            muni_name_h: listing.municipalities.muni_name_h || undefined,
            pref_name: listing.municipalities.prefectures?.pref_name || undefined,
            pref_name_r: listing.municipalities.prefectures?.pref_name_r || undefined,
            pref_name_h: listing.municipalities.prefectures?.pref_name_h || undefined,
          }
        : undefined,
      translation: translation ? {
        title: translation.title,
        body: translation.body,
        is_auto_translated: translation.is_auto_translated || false
      } : undefined,
    };

    return formattedListing;
  } catch (error) {
    logger.error('Unexpected error in getListingDetail:', {
      error,
      listingId: id,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

export default async function ListingDetailPage({ params }: ListingDetailProps) {
  const resolvedParams = await params;
  const { id, locale } = resolvedParams;
  setRequestLocale(locale);

  const listing = await getListingDetail(id, locale);

  if (!listing) {
    notFound();
  }

  // Check if the user is the owner
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <ListingDetailClient listing={listing} currentUserId={user?.id} />;
}

// Add generateStaticParams for better performance
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
