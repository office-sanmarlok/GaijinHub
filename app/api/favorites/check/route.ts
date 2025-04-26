import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// バックエンド用の直接Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listing_id');
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (!listingId) {
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
      return NextResponse.json({ isFavorite: false });
    }

    console.log('Checking favorite status for user:', userId, 'listing:', listingId);

    // お気に入り状態をチェック
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .single();

    console.log('Favorite check result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite status:', error);
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ isFavorite: !!data });
  } catch (error) {
    console.error('Error in favorite check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 