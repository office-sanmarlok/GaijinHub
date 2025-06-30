import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectLanguage, translateText } from '@/lib/translation';
import { locales, type Locale } from '@/i18n/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    console.log('Listing data:', {
      id: listing.id,
      title: listing.title,
      original_language: listing.original_language
    });

    // Check ownership
    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Detect language if not set
    let sourceLanguage = listing.original_language;
    if (!sourceLanguage) {
      console.log('Detecting language for:', listing.title);
      sourceLanguage = await detectLanguage(listing.title + ' ' + listing.body);
      console.log('Detected language:', sourceLanguage);
      
      // Update the listing with detected language
      await supabase
        .from('listings')
        .update({ original_language: sourceLanguage })
        .eq('id', id);
    }

    // Get target languages
    const targetLocales = locales.filter(locale => locale !== sourceLanguage);
    console.log('All locales:', locales);
    console.log('Source language:', sourceLanguage);
    console.log('Target locales:', targetLocales);
    
    // Check existing translations
    const { data: existingTranslations } = await supabase
      .from('listing_translations')
      .select('locale')
      .eq('listing_id', id);
    
    const existingLocales = existingTranslations?.map(t => t.locale) || [];
    console.log('Existing translations:', existingLocales);
    const newTargetLocales = targetLocales.filter(locale => !existingLocales.includes(locale));
    console.log('New target locales:', newTargetLocales);
    
    // Translate to all new languages
    const translations = [];
    const errors = [];

    for (const targetLocale of newTargetLocales) {
      try {
        console.log(`Translating to ${targetLocale}...`);
        const [translatedTitle, translatedBody] = await Promise.all([
          translateText(listing.title, sourceLanguage as Locale, targetLocale),
          translateText(listing.body, sourceLanguage as Locale, targetLocale),
        ]);

        translations.push({
          listing_id: id,
          locale: targetLocale,
          title: translatedTitle,
          body: translatedBody,
          is_auto_translated: true,
        });
      } catch (error) {
        console.error(`Failed to translate to ${targetLocale}:`, error);
        errors.push({ locale: targetLocale, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Insert all successful translations
    let insertedCount = 0;
    if (translations.length > 0) {
      const { data: insertedData, error: translationError } = await supabase
        .from('listing_translations')
        .insert(translations)
        .select();

      if (translationError) {
        console.error('Failed to save translations:', translationError);
        return NextResponse.json({ 
          error: 'Failed to save translations',
          details: translationError 
        }, { status: 500 });
      }
      
      insertedCount = insertedData?.length || 0;
    }

    return NextResponse.json({
      success: true,
      listing_id: id,
      source_language: sourceLanguage,
      translatedCount: insertedCount,
      skippedCount: existingLocales.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully translated to ${insertedCount} languages`,
    });
  } catch (error) {
    console.error('Error in real-time translation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}