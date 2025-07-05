import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    logger.debug('Counting favorites for listing:', listingId);

    // お気に入り数をカウント
    const { count, error } = await supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('listing_id', listingId);

    logger.debug('Favorite count result:', { count, error });

    if (error) {
      logger.error('Error counting favorites:', error);
      return NextResponse.json({ error: 'Failed to count favorites' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    logger.error('Error in favorites count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
