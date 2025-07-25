import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteAllListings() {
  console.log('Deleting all listings and translations...');
  
  // まず翻訳を削除
  const { error: translationError } = await supabase
    .from('listing_translations')
    .delete()
    .gte('created_at', '2000-01-01'); // 全レコード削除

  if (translationError) {
    console.error('Error deleting translations:', translationError);
  } else {
    console.log('✓ All translations deleted');
  }

  // 次に投稿を削除
  const { error: listingError } = await supabase
    .from('listings')
    .delete()
    .gte('created_at', '2000-01-01'); // 全レコード削除

  if (listingError) {
    console.error('Error deleting listings:', listingError);
  } else {
    console.log('✓ All listings deleted');
  }

  console.log('Done!');
}

deleteAllListings();