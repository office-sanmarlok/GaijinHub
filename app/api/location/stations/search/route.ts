import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  // バリデーション
  if (!query || query.length < 1) {
    return NextResponse.json({
      success: false,
      message: '検索キーワードを入力してください',
      stations: [],
      total: 0
    }, { status: 400 });
  }

  if (limit > 50) {
    return NextResponse.json({
      success: false,
      message: '取得件数は50件以下にしてください',
      stations: [],
      total: 0
    }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // 直接テーブルクエリを使用
    const { data, error } = await supabase
      .from('stations')
      .select(`
        station_cd,
        station_name,
        station_name_h,
        station_name_r,
        muni_id,
        pref_id,
        lat,
        lon,
        line:lines(
          line_id,
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
      .or(`station_name.ilike.%${query}%,station_name_h.ilike.%${query}%,station_name_r.ilike.%${query}%`)
      .eq('e_status', '0') // 有効な駅のみ
      .order('station_name')
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        message: 'データベースエラーが発生しました',
        stations: [],
        total: 0
      }, { status: 500 });
    }

    // レスポンス形式に変換
    const formattedStations = (data || []).map((station: any) => ({
      station_cd: station.station_cd,
      station_name: station.station_name,
      station_name_kana: station.station_name_h,
      line_name: station.line?.line_name || 'N/A',
      line_id: station.line?.line_id || 'N/A',
      company_name: station.line?.company?.company_name || 'N/A',
      muni_id: station.muni_id,
      muni_name: station.municipality?.muni_name || 'N/A',
      pref_id: station.pref_id,
      pref_name: station.prefecture?.pref_name || 'N/A',
      lat: station.lat,
      lng: station.lon
    }));

    return NextResponse.json({
      success: true,
      stations: formattedStations,
      total: formattedStations.length
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました',
      stations: [],
      total: 0
    }, { status: 500 });
  }
} 