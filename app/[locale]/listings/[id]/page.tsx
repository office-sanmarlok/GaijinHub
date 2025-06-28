import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ListingDetailClient } from '@/components/listings/ListingDetailClient';
import { createClient } from '@/lib/supabase/server';
import { locales } from '../../../../i18n/config';

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

  // Get listing data for metadata
  const supabase = await createClient();
  const { data: listing } = await supabase.from('listings').select('title, body').eq('id', id).single();

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
    title: `${title} - GaijinHub`,
    description: truncatedDescription,
    alternates: {
      languages: alternateLanguages,
      canonical: `/${locale}/listings/${id}`,
    },
    openGraph: {
      title: `${title} - GaijinHub`,
      description: truncatedDescription,
      type: 'article',
      locale: locale,
      alternateLocale: locales.filter((l) => l !== locale),
      siteName: 'GaijinHub',
      url: `https://gaijin-hub.vercel.app/${locale}/listings/${id}`,
    },
    twitter: {
      card: 'summary',
      title: `${title} - GaijinHub`,
      description: truncatedDescription,
    },
  };
}

async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const supabase = await createClient();

  try {
    // Get listing with all related data using joins
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        images (
          id,
          path,
          order
        ),
        station_groups!station_g_cd (
          station_g_cd,
          station_name,
          station_name_r,
          station_name_h,
          lat,
          lng,
          address
        ),
        municipalities!muni_id (
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
      console.error('Error fetching listing:', listingError);
      return null;
    }

    if (!listing) {
      console.error('Listing not found');
      return null;
    }

    // For now, we'll leave user info as null since we can't access auth.users directly
    // This would need to be handled by a server-side function or RPC

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
      user: undefined, // User info needs to be handled separately
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
    };

    return formattedListing;
  } catch (error) {
    console.error('Unexpected error in getListingDetail:', error);
    return null;
  }
}

export default async function ListingDetailPage({ params }: ListingDetailProps) {
  const resolvedParams = await params;
  const { id, locale } = resolvedParams;
  setRequestLocale(locale);

  const listing = await getListingDetail(id);

  if (!listing) {
    notFound();
  }

  // Check if the user is the owner
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.user_id;

  return <ListingDetailClient listing={listing} isOwner={isOwner} />;
}

// Add generateStaticParams for better performance
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
