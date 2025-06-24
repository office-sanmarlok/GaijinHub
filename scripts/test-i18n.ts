import { createClient } from '@supabase/supabase-js';
import { Database } from '../app/types/supabase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function testI18nSystem() {
  console.log('🔍 Testing i18n implementation...\n');

  // 1. Test translation tables
  console.log('1. Checking translation tables...');
  const { data: translations, error: translationError } = await supabase
    .from('listing_translations')
    .select('*')
    .limit(5);

  if (translationError) {
    console.error('❌ Error fetching translations:', translationError);
  } else {
    console.log(`✅ Found ${translations?.length || 0} translations`);
  }

  // 2. Test translation queue
  console.log('\n2. Checking translation queue...');
  const { data: queue, error: queueError } = await supabase
    .from('translation_queue')
    .select('*')
    .limit(5);

  if (queueError) {
    console.error('❌ Error fetching queue:', queueError);
  } else {
    console.log(`✅ Found ${queue?.length || 0} items in queue`);
    if (queue && queue.length > 0) {
      console.log('Queue statuses:', queue.map(q => q.status).join(', '));
    }
  }

  // 3. Test user preferences
  console.log('\n3. Checking user preferences...');
  const { data: preferences, error: prefError } = await supabase
    .from('user_preferences')
    .select('*')
    .limit(5);

  if (prefError) {
    console.error('❌ Error fetching preferences:', prefError);
  } else {
    console.log(`✅ Found ${preferences?.length || 0} user preferences`);
  }

  // 4. Test RPC functions
  console.log('\n4. Testing RPC functions...');
  
  // Test queue count
  const { data: queueCount, error: countError } = await supabase
    .rpc('get_translation_queue_count');

  if (countError) {
    console.error('❌ Error getting queue count:', countError);
  } else {
    console.log(`✅ Queue count: ${queueCount}`);
  }

  // 5. Test original_language field
  console.log('\n5. Checking original_language field...');
  const { data: listings, error: listingError } = await supabase
    .from('listings')
    .select('id, title, original_language')
    .limit(5);

  if (listingError) {
    console.error('❌ Error fetching listings:', listingError);
  } else {
    console.log(`✅ Listings with original_language:`);
    listings?.forEach(l => {
      console.log(`   - ${l.title}: ${l.original_language || 'NULL'}`);
    });
  }

  console.log('\n✅ i18n system test completed!');
}

// Run the test
testI18nSystem().catch(console.error);