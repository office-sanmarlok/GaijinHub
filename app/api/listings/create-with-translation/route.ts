import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { detectLanguage, translateText } from '@/lib/translation';
import { locales, type Locale } from '@/i18n/config';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }

    // Detect language if not provided
    const detectedLanguage = listing.original_language || await detectLanguage(listing.title + ' ' + listing.body);
    
    if (detectedLanguage !== listing.original_language) {
      await supabase
        .from('listings')
        .update({ original_language: detectedLanguage })
        .eq('id', listing.id);
    }

    // Translate to all other languages
    const targetLocales = locales.filter(locale => locale !== detectedLanguage);
    const translations = [];

    for (const targetLocale of targetLocales) {
      try {
        const [translatedTitle, translatedBody] = await Promise.all([
          translateText(listing.title, detectedLanguage as Locale, targetLocale),
          translateText(listing.body, detectedLanguage as Locale, targetLocale),
        ]);

        translations.push({
          listing_id: listing.id,
          locale: targetLocale,
          title: translatedTitle,
          body: translatedBody,
          is_auto_translated: true,
        });
      } catch (error) {
        logger.error(`Failed to translate to ${targetLocale}:`, error);
      }
    }

    // Insert all translations
    if (translations.length > 0) {
      const { error: translationError } = await supabase
        .from('listing_translations')
        .insert(translations);

      if (translationError) {
        logger.error('Failed to save translations:', translationError);
      }
    }

    return NextResponse.json({
      listing,
      translationsCreated: translations.length,
    });
  } catch (error) {
    logger.error('Error creating listing with translations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}