import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function translateListings() {
  try {
    // 既存の投稿を取得
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, original_language')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    console.log(`Found ${listings?.length || 0} listings to translate`);

    // 各投稿に対して翻訳APIを呼び出す
    for (const listing of listings || []) {
      console.log(`\nTranslating: "${listing.title}" (${listing.original_language})`);
      
      try {
        const response = await fetch(`http://localhost:3002/api/listings/${listing.id}/translate-now`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to translate listing ${listing.id}:`, errorText);
          continue;
        }

        const result = await response.json();
        console.log(`✓ Successfully translated to ${result.translatedCount} languages`);
        
        // 翻訳結果を確認
        const { data: translations } = await supabase
          .from('listing_translations')
          .select('locale, title')
          .eq('listing_id', listing.id);
        
        if (translations) {
          console.log('Translations created:');
          translations.forEach(t => {
            console.log(`  - ${t.locale}: ${t.title}`);
          });
        }
      } catch (error) {
        console.error(`Error translating listing ${listing.id}:`, error);
      }
    }

    console.log('\nTranslation process completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

translateListings();