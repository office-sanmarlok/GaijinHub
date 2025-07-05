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

    // 認証されたユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // ユーザーが認証されていない場合
    if (authError || !user) {
      return NextResponse.json({ isFavorite: false });
    }

    logger.debug('Checking favorite status for user:', { userId: user.id, listingId });

    // お気に入り状態をチェック
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .single();

    logger.debug('Favorite check result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking favorite status:', error);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    return NextResponse.json({ isFavorite: !!data });
  } catch (error) {
    logger.error('Error in favorite check API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
