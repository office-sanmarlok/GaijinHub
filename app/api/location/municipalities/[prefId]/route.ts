import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 特定の都道府県内の市区町村一覧を取得するAPI
 */
export async function GET(
  request: Request,
  { params }: { params: { prefId: string } }
) {
  try {
    const { prefId } = params;
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('municipalities')
      .select(`
        muni_id,
        muni_name,
        muni_name_h,
        muni_name_r,
        pref_id,
        prefecture:prefectures(
          pref_name
        )
      `)
      .eq('pref_id', prefId);

    // キーワード検索
    if (keyword) {
      query = query.or(`muni_name.ilike.%${keyword}%,muni_name_h.ilike.%${keyword}%,muni_name_r.ilike.%${keyword}%`);
    }

    const { data, error } = await query
      .order('muni_name')
      .limit(limit);

    if (error) {
      console.error('市区町村取得エラー:', error);
      return NextResponse.json(
        { error: '市区町村の取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    const formattedData = data?.map(municipality => ({
      id: municipality.muni_id,
      name: municipality.muni_name,
      name_hiragana: municipality.muni_name_h,
      name_romaji: municipality.muni_name_r,
      prefecture_id: municipality.pref_id,
      prefecture_name: municipality.prefecture?.pref_name
    }));

    return NextResponse.json({
      municipalities: formattedData,
      prefecture_id: prefId,
      total: formattedData?.length || 0
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 