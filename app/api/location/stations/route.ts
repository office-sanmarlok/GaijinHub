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
 * 駅一覧を取得するAPI
 * クエリパラメータ:
 * - lineId: 路線IDでフィルタリング（オプション）
 * - prefectureId: 都道府県IDでフィルタリング（オプション）
 * - municipalityId: 市区町村IDでフィルタリング（オプション）
 * - keyword: 名前でのあいまい検索（オプション）
 * - limit: 取得件数制限（デフォルト: 100）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('lineId');
    const prefectureId = searchParams.get('prefectureId');
    const municipalityId = searchParams.get('municipalityId');
    const keyword = searchParams.get('keyword');
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('stations')
      .select(`
        station_cd,
        station_name,
        station_name_h,
        station_name_r,
        line_cd,
        pref_id,
        muni_id,
        line:lines(
          line_name,
          company:companies(
            company_name
          )
        ),
        municipality:municipalities(
          muni_name
        ),
        prefecture:prefectures(
          pref_name
        )
      `)
      .eq('e_status', 0); // 有効な駅のみ

    // 路線フィルター
    if (lineId) {
      query = query.eq('line_cd', lineId);
    }

    // 都道府県フィルター
    if (prefectureId) {
      query = query.eq('pref_id', prefectureId);
    }

    // 市区町村フィルター
    if (municipalityId) {
      query = query.eq('muni_id', municipalityId);
    }

    // キーワード検索
    if (keyword) {
      query = query.or(
        `station_name.ilike.%${keyword}%,station_name_h.ilike.%${keyword}%,station_name_r.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.order('station_name').limit(limit);

    if (error) {
      console.error('駅取得エラー:', error);
      return NextResponse.json({ error: '駅の取得に失敗しました', details: error.message }, { status: 500 });
    }

    const formattedData = data?.map((station) => ({
      id: station.station_cd,
      name: station.station_name,
      name_hiragana: station.station_name_h,
      name_romaji: station.station_name_r,
      line_id: station.line_cd,
      line_name: station.line?.line_name,
      company_name: station.line?.company?.company_name,
      prefecture_id: station.pref_id,
      prefecture_name: station.prefecture?.pref_name,
      municipality_id: station.muni_id,
      municipality_name: station.municipality?.muni_name,
    }));

    return NextResponse.json({
      stations: formattedData,
      total: formattedData?.length || 0,
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
