import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { detectLanguage, translateText } from '../app/lib/translation';
import { locales, type Locale } from '../i18n/config';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function translateAllListings() {
  try {
    // 既存の投稿を取得
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, body, original_language')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    console.log(`Found ${listings?.length || 0} listings to process`);

    for (const listing of listings || []) {
      console.log(`\n--- Processing: "${listing.title}"`);
      
      // 言語を検出（必要な場合）
      let sourceLanguage = listing.original_language;
      if (!sourceLanguage) {
        console.log('Detecting language...');
        sourceLanguage = await detectLanguage(listing.title + ' ' + listing.body);
        console.log(`Detected language: ${sourceLanguage}`);
        
        // original_languageを更新
        await supabase
          .from('listings')
          .update({ original_language: sourceLanguage })
          .eq('id', listing.id);
      } else {
        console.log(`Original language: ${sourceLanguage}`);
      }

      // 既存の翻訳を確認
      const { data: existingTranslations } = await supabase
        .from('listing_translations')
        .select('locale')
        .eq('listing_id', listing.id);
      
      const existingLocales = existingTranslations?.map(t => t.locale) || [];
      console.log(`Existing translations: ${existingLocales.join(', ') || 'none'}`);

      // 翻訳が必要な言語を特定
      const targetLocales = locales.filter(locale => 
        locale !== sourceLanguage && !existingLocales.includes(locale)
      );
      
      if (targetLocales.length === 0) {
        console.log('All translations already exist, skipping...');
        continue;
      }

      console.log(`Need to translate to: ${targetLocales.join(', ')}`);

      // 各言語に翻訳
      const translations = [];
      for (const targetLocale of targetLocales) {
        try {
          console.log(`  Translating to ${targetLocale}...`);
          const [translatedTitle, translatedBody] = await Promise.all([
            translateText(listing.title, sourceLanguage as Locale, targetLocale),
            translateText(listing.body, sourceLanguage as Locale, targetLocale),
          ]);

          translations.push({
            listing_id: listing.id,
            locale: targetLocale,
            title: translatedTitle,
            body: translatedBody,
            is_auto_translated: true,
          });
          console.log(`  ✓ ${targetLocale}: ${translatedTitle}`);
        } catch (error) {
          console.error(`  ✗ Failed to translate to ${targetLocale}:`, error);
        }
      }

      // 翻訳を保存
      if (translations.length > 0) {
        const { error: insertError } = await supabase
          .from('listing_translations')
          .insert(translations);

        if (insertError) {
          console.error('Failed to save translations:', insertError);
        } else {
          console.log(`✓ Saved ${translations.length} translations`);
        }
      }
    }

    console.log('\n=== Translation process completed! ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

translateAllListings();