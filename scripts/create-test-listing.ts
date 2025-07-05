import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import type { Database } from '../app/types/supabase';
import { logger } from '@/lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function createTestListing() {
  logger.debug('📝 Creating test listing with i18n...\n');

  // 1. Get a test user (or create one)
  const {
    data: { users },
    error: userError,
  } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    logger.error('❌ No users found. Please create a user first.');
    return;
  }

  const testUser = users[0];
  logger.debug(`✅ Using user: ${testUser.email}`);

  // 2. Create a new listing
  const newListing = {
    user_id: testUser.id,
    title: 'Beautiful apartment in Shibuya',
    body: 'Spacious 2LDK apartment near Shibuya station. Perfect for families or couples. Modern amenities, great view of Tokyo skyline.',
    category: 'Housing',
    price: 180000,
    original_language: 'en',
    has_location: true,
    station_g_cd: '1130205', // Shibuya station group
  };

  const { data: listing, error: listingError } = await supabase.from('listings').insert(newListing).select().single();

  if (listingError || !listing) {
    logger.error('❌ Error creating listing:', listingError);
    return;
  }

  logger.debug(`✅ Created listing: ${listing.id}`);

  // 3. Add to translation queue
  const { error: queueError } = await supabase.from('translation_queue').insert({
    listing_id: listing.id,
    source_locale: 'en',
    target_locales: ['ja', 'zh-CN', 'zh-TW', 'ko'],
    status: 'pending',
  });

  if (queueError) {
    logger.error('❌ Error adding to queue:', queueError);
  } else {
    logger.debug('✅ Added to translation queue');
  }

  // 4. Check queue status
  const { data: queueCount } = await supabase.rpc('get_translation_queue_count');

  logger.debug(`\n📊 Current queue count: ${queueCount}`);
  logger.debug(`\n🔗 View listing at: http://localhost:3000/en/listings/${listing.id}`);

  logger.debug('\n💡 To process translations manually:');
  logger.debug('   curl -X POST http://localhost:3000/api/translation/process \\');
  logger.debug(`   -H "Authorization: Bearer ${process.env.WEBHOOK_SECRET}" \\`);
  logger.debug('   -H "Content-Type: application/json" \\');
  logger.debug('   -d \'{"check_queue_first": false}\'');
}

// Run the script
createTestListing().catch(console.error);
