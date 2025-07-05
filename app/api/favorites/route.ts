import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { listing_id } = await request.json();

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // 認証されたユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug('Toggle favorite for user:', { user: user.id, arg2: 'listing:', listing_id: listing_id });

    // まず既存のお気に入りを確認
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('user_id', user.id)
      .single();

    logger.debug('Existing favorite check:', { existingFavorite, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking favorite:', checkError);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    // お気に入りが存在する場合は削除、なければ追加
    if (existingFavorite) {
      logger.debug('Removing existing favorite:', existingFavorite.id);
      const { error: deleteError } = await supabase.from('favorites').delete().eq('id', existingFavorite.id);

      if (deleteError) {
        logger.error('Error removing favorite:', deleteError);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
      }

      return NextResponse.json({ isFavorite: false, action: 'removed' });
    }
    logger.debug('Adding new favorite for user:', { user: user.id, arg2: 'listing:', listing_id: listing_id });
    const { error: insertError } = await supabase.from('favorites').insert({ listing_id, user_id: user.id });

    if (insertError) {
      logger.error('Error adding favorite:', insertError);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ isFavorite: true, action: 'added' });
  } catch (error) {
    logger.error('Error in favorite toggle API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
