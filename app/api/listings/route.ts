import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// 認証なしでパブリックデータにのみアクセスするクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    let query = supabase.from('listings').select('*');

    // 検索フィルターの適用
    if (q) {
      query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (location) {
      query = query.ilike('city', `%${location}%`);
    }
    if (minPrice) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }

    // 作成日時で降順ソート
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('データ取得エラー:', error);
      return new NextResponse('データ取得エラー: ' + error.message, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('サーバーエラー:', error);
    return new NextResponse('サーバーエラー', { status: 500 });
  }
} 