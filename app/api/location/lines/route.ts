import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 路線一覧を取得するAPI
 * クエリパラメータ:
 * - companyId: 鉄道会社IDでフィルタリング（オプション）
 * - prefectureId: 都道府県IDでフィルタリング（オプション）
 * - keyword: 名前でのあいまい検索（オプション）
 * - limit: 取得件数制限（デフォルト: 100）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const prefectureId = searchParams.get('prefectureId');
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
      .eq('e_status', '0'); // 有効な路線のみ

    // 鉄道会社フィルター
    if (companyId) {
      query = query.eq('company_cd', companyId);
    }

    // キーワード検索
    if (keyword) {
      query = query.or(`line_name.ilike.%${keyword}%,line_name_h.ilike.%${keyword}%,line_name_r.ilike.%${keyword}%`);
    }

    // 都道府県フィルター（その都道府県内に駅がある路線のみ）
    if (prefectureId) {
      const { data: stationsInPref } = await supabase
        .from('stations')
        .select('line_cd')
        .eq('pref_id', prefectureId)
        .eq('e_status', '0');

      if (stationsInPref && stationsInPref.length > 0) {
        const lineIds = [...new Set(stationsInPref.map((s) => s.line_cd))];
        query = query.in('line_id', lineIds);
      } else {
        // 該当する駅がない場合は空の結果を返す
        return NextResponse.json({
          lines: [],
          total: 0,
        });
      }
    }

    const { data, error } = await query.order('line_name').limit(limit);

    if (error) {
      logger.error('路線取得エラー:', error);
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
      total: formattedData?.length || 0,
    });
  } catch (error) {
    logger.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
