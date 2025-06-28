import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    console.log('Checking favorite status for user:', user.id, 'listing:', listingId);

    // お気に入り状態をチェック
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .single();

    console.log('Favorite check result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite status:', error);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    return NextResponse.json({ isFavorite: !!data });
  } catch (error) {
    console.error('Error in favorite check API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
