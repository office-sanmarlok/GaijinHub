import { createClient } from '@supabase/supabase-js';
import { Database } from '../app/types/supabase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function createTestListing() {
  console.log('📝 Creating test listing with i18n...\n');

  // 1. Get a test user (or create one)
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError || !users || users.length === 0) {
    console.error('❌ No users found. Please create a user first.');
    return;
  }

  const testUser = users[0];
  console.log(`✅ Using user: ${testUser.email}`);

  // 2. Create a new listing
  const newListing = {
    user_id: testUser.id,
    title: 'Beautiful apartment in Shibuya',
    body: 'Spacious 2LDK apartment near Shibuya station. Perfect for families or couples. Modern amenities, great view of Tokyo skyline.',
    category: 'Housing',
    price: 180000,
    original_language: 'en',
    has_location: true,
    station_g_cd: '1130205' // Shibuya station group
  };

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert(newListing)
    .select()
    .single();

  if (listingError || !listing) {
    console.error('❌ Error creating listing:', listingError);
    return;
  }

  console.log(`✅ Created listing: ${listing.id}`);

  // 3. Add to translation queue
  const { error: queueError } = await supabase
    .from('translation_queue')
    .insert({
      listing_id: listing.id,
      source_locale: 'en',
      target_locales: ['ja', 'zh-CN', 'zh-TW', 'ko'],
      status: 'pending'
    });

  if (queueError) {
    console.error('❌ Error adding to queue:', queueError);
  } else {
    console.log('✅ Added to translation queue');
  }

  // 4. Check queue status
  const { data: queueCount } = await supabase
    .rpc('get_translation_queue_count');

  console.log(`\n📊 Current queue count: ${queueCount}`);
  console.log(`\n🔗 View listing at: http://localhost:3000/en/listings/${listing.id}`);
  
  console.log('\n💡 To process translations manually:');
  console.log('   curl -X POST http://localhost:3000/api/translation/process \\');
  console.log(`   -H "Authorization: Bearer ${process.env.WEBHOOK_SECRET}" \\`);
  console.log('   -H "Content-Type: application/json" \\');
  console.log('   -d \'{"check_queue_first": false}\'');
}

// Run the script
createTestListing().catch(console.error);