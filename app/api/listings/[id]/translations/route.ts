import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type Translation = Database['public']['Tables']['listing_translations']['Row'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get all translations for the listing
    const { data: translations, error } = await supabase
      .from('listing_translations')
      .select('*')
      .eq('listing_id', id)
      .order('locale');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
    }

    // Get original listing data
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, body, original_language')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Format response
    const translationsByLocale: Record<string, Translation> = {};
    translations?.forEach((translation) => {
      translationsByLocale[translation.locale] = translation;
    });

    return NextResponse.json({
      listing_id: id,
      original_language: listing.original_language || 'ja',
      original: {
        title: listing.title,
        body: listing.body,
      },
      translations: translationsByLocale,
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
