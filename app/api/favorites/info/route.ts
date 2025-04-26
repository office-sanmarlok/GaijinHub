import { createClient, getUser } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');
  const showCount = searchParams.get('show_count') === 'true';
  
  if (!listingId) {
    return NextResponse.json(
      { error: 'Missing listing_id parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    
    // ユーザー情報を安全に取得
    const user = await getUser();
    const userId = user?.id;

    // 並列にデータを取得
    const promises = [];

    // いいね状態の確認クエリ
    let isFavorite = false;
    if (userId) {
      const favoriteStatusPromise = supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .then(({ data, error }) => {
          if (error) throw error;
          isFavorite = data && data.length > 0;
          return isFavorite;
        });
      
      promises.push(favoriteStatusPromise);
    }

    // いいね数カウントクエリ (showCountがtrueの場合のみ)
    let count = 0;
    if (showCount) {
      const countPromise = supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('listing_id', listingId)
        .then(({ count: favoriteCount, error }) => {
          if (error) throw error;
          count = favoriteCount || 0;
          return count;
        });
      
      promises.push(countPromise);
    }

    // 全てのクエリを並列実行
    await Promise.all(promises);

    // 結果を返す
    return NextResponse.json({
      isFavorite,
      count,
    });
  } catch (error) {
    console.error('Error fetching favorite info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite information' },
      { status: 500 }
    );
  }
} 