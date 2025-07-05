import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import type { Database } from '../app/types/supabase';
import { logger } from '@/lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function testI18nSystem() {
  logger.debug('🔍 Testing i18n implementation...\n');

  // 1. Test translation tables
  logger.debug('1. Checking translation tables...');
  const { data: translations, error: translationError } = await supabase
    .from('listing_translations')
    .select('*')
    .limit(5);

  if (translationError) {
    logger.error('❌ Error fetching translations:', translationError);
  } else {
    logger.debug(`✅ Found ${translations?.length || 0} translations`);
  }

  // 2. Test translation queue
  logger.debug('\n2. Checking translation queue...');
  const { data: queue, error: queueError } = await supabase.from('translation_queue').select('*').limit(5);

  if (queueError) {
    logger.error('❌ Error fetching queue:', queueError);
  } else {
    logger.debug(`✅ Found ${queue?.length || 0} items in queue`);
    if (queue && queue.length > 0) {
      logger.debug('Queue statuses:', queue.map((q) => q.status).join(', '));
    }
  }

  // 3. Test user preferences
  logger.debug('\n3. Checking user preferences...');
  const { data: preferences, error: prefError } = await supabase.from('user_preferences').select('*').limit(5);

  if (prefError) {
    logger.error('❌ Error fetching preferences:', prefError);
  } else {
    logger.debug(`✅ Found ${preferences?.length || 0} user preferences`);
  }

  // 4. Test RPC functions
  logger.debug('\n4. Testing RPC functions...');

  // Test queue count
  const { data: queueCount, error: countError } = await supabase.rpc('get_translation_queue_count');

  if (countError) {
    logger.error('❌ Error getting queue count:', countError);
  } else {
    logger.debug(`✅ Queue count: ${queueCount}`);
  }

  // 5. Test original_language field
  logger.debug('\n5. Checking original_language field...');
  const { data: listings, error: listingError } = await supabase
    .from('listings')
    .select('id, title, original_language')
    .limit(5);

  if (listingError) {
    logger.error('❌ Error fetching listings:', listingError);
  } else {
    logger.debug('✅ Listings with original_language:');
    listings?.forEach((l) => {
      logger.debug(`   - ${l.title}: ${l.original_language || 'NULL'}`);
    });
  }

  logger.debug('\n✅ i18n system test completed!');
}

// Run the test
testI18nSystem().catch(console.error);
