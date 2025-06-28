import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    console.log('Toggle favorite for user:', user.id, 'listing:', listing_id);

    // まず既存のお気に入りを確認
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('user_id', user.id)
      .single();

    console.log('Existing favorite check:', { existingFavorite, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking favorite:', checkError);
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
    }

    // お気に入りが存在する場合は削除、なければ追加
    if (existingFavorite) {
      console.log('Removing existing favorite:', existingFavorite.id);
      const { error: deleteError } = await supabase.from('favorites').delete().eq('id', existingFavorite.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
      }

      return NextResponse.json({ isFavorite: false, action: 'removed' });
    }
    console.log('Adding new favorite for user:', user.id, 'listing:', listing_id);
    const { error: insertError } = await supabase.from('favorites').insert({ listing_id, user_id: user.id });

    if (insertError) {
      console.error('Error adding favorite:', insertError);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ isFavorite: true, action: 'added' });
  } catch (error) {
    console.error('Error in favorite toggle API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
