import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 都道府県一覧を取得するAPI
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('prefectures')
      .select('pref_id, pref_name, pref_name_h, pref_name_r')
      .order('pref_name');

    if (error) {
      console.error('都道府県取得エラー:', error);
      return NextResponse.json({ error: '都道府県の取得に失敗しました', details: error.message }, { status: 500 });
    }

    const formattedData = data?.map((prefecture) => ({
      id: prefecture.pref_id,
      name: prefecture.pref_name,
      name_hiragana: prefecture.pref_name_h,
      name_romaji: prefecture.pref_name_r,
    }));

    return NextResponse.json({
      prefectures: formattedData,
      total: formattedData?.length || 0,
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
