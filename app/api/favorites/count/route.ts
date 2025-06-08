import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// バックエンド用の直接SupabaseクライアンチE
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      );
    }
    
    console.log('Counting favorites for listing:', listingId);
    
    // お気に入り数をカウンチE
    const { count, error } = await supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('listing_id', listingId);

    console.log('Favorite count result:', { count, error });

    if (error) {
      console.error('Error counting favorites:', error);
      return NextResponse.json(
        { error: 'Failed to count favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in favorites count API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
