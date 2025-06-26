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
 * 特定の鉄道会社の路線一覧を取得するAPI
 */
export async function GET(request: Request, { params }: { params: { companyId: string } }) {
  try {
    const { companyId } = params;
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('lines')
      .select(`
        line_id,
        line_name,
        line_name_h,
        line_name_r,
        company_cd,
        company:companies(
          company_name
        )
      `)
      .eq('company_cd', companyId)
      .eq('e_status', 0); // 有効な路線のみ

    // キーワード検索
    if (keyword) {
      query = query.or(`line_name.ilike.%${keyword}%,line_name_h.ilike.%${keyword}%,line_name_r.ilike.%${keyword}%`);
    }

    const { data, error } = await query.order('line_name').limit(limit);

    if (error) {
      console.error('路線取得エラー:', error);
      return NextResponse.json({ error: '路線の取得に失敗しました', details: error.message }, { status: 500 });
    }

    const formattedData = data?.map((line) => ({
      id: line.line_id,
      name: line.line_name,
      name_hiragana: line.line_name_h,
      name_romaji: line.line_name_r,
      company_id: line.company_cd,
      company_name: line.company?.company_name,
    }));

    return NextResponse.json({
      lines: formattedData,
      company_id: companyId,
      company_name: data?.[0]?.company?.company_name || null,
      total: formattedData?.length || 0,
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
