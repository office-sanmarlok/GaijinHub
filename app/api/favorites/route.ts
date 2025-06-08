import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// バックエンド用の直接Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { listing_id } = await request.json();
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      );
    }

    // トークンがあればユーザーを検証
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          console.error('Invalid token:', error);
        } else {
          userId = user.id;
        }
      } catch (err) {
        console.error('Error verifying token:', err);
      }
    }

    // ユーザーが認証されていない場合
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Toggle favorite for user:', userId, 'listing:', listing_id);

    // まず既存のお気に入りを確認
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('user_id', userId)
      .single();

    console.log('Existing favorite check:', { existingFavorite, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking favorite:', checkError);
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      );
    }

    // お気に入りが存在する場合は削除、なければ追加
    if (existingFavorite) {
      console.log('Removing existing favorite:', existingFavorite.id);
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove favorite' },
          { status: 500 }
        );
      }

      return NextResponse.json({ isFavorite: false, action: 'removed' });
    } else {
      console.log('Adding new favorite for user:', userId, 'listing:', listing_id);
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({ listing_id, user_id: userId });

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return NextResponse.json(
          { error: 'Failed to add favorite' },
          { status: 500 }
        );
      }

      return NextResponse.json({ isFavorite: true, action: 'added' });
    }
  } catch (error) {
    console.error('Error in favorite toggle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
