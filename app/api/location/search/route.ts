import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// 認証が不要な匿名クライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');
    const stationId = searchParams.get('stationId');
    const prefectureId = searchParams.get('prefectureId'); // 都道府県フィルター（オプション）

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'station': {
        let query = supabase
          .from('stations')
          .select(`
            station_cd,
            station_name,
            station_name_h,
            station_name_r,
            muni_id,
            pref_id,
            lines(
              line_id,
              line_name,
              line_name_h,
              line_name_r,
              companies(
                company_name
              )
            ),
            municipalities(
              muni_name
            ),
            prefectures(
              pref_name
            )
          `);

        // 特定の駅IDが指定されている場合
        if (stationId) {
          query = query.eq('station_cd', stationId);
        } 
        // キーワード検索の場合
        else if (keyword) {
          query = query.or(`station_name.ilike.%${keyword}%,station_name_h.ilike.%${keyword}%,station_name_r.ilike.%${keyword}%`);
        }
        // どちらも持っていない場合はエラー
        else {
          return NextResponse.json(
            { error: 'Either stationId or keyword is required' },
            { status: 400 }
          );
        }

        // 都道府県フィルターが指定されている場合
        if (prefectureId) {
          query = query.eq('pref_id', prefectureId);
        }

        const { data, error } = await query
          .eq('e_status', '0') // 有効な駅のみ
          .order('station_name')
          .limit(10);

        if (error) throw error;

        // 駅と路線情報を整形
        const formattedData = data?.map(station => ({
          id: station.station_cd || '',
          name_kanji: station.station_name || '',
          name_kana: station.station_name_h || '',
          name_romaji: station.station_name_r || '',
          municipality_id: station.muni_id || '',
          prefecture_id: station.pref_id || '',
          municipality_name: station.municipalities?.muni_name || '',
          prefecture_name: station.prefectures?.pref_name || '',
          lines: station.lines ? [{
            line_code: station.lines.line_id || '',
            line_ja: station.lines.line_name || '',
            line_kana: station.lines.line_name_h || '',
            line_romaji: station.lines.line_name_r || '',
            operator_ja: station.lines.companies?.company_name || ''
          }] : []
        }));

        return NextResponse.json(formattedData);
      }

      case 'line': {
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required for line search' },
            { status: 400 }
          );
        }

        let query = supabase
          .from('lines')
          .select(`
            line_id,
            line_name,
            line_name_h,
            line_name_r,
            companies(
              company_name
            )
          `)
          .or(`line_name.ilike.%${keyword}%,line_name_h.ilike.%${keyword}%,line_name_r.ilike.%${keyword}%`);

        // 都道府県フィルターが指定されている場合、その都道府県内の駅がある路線のみを取得
        if (prefectureId) {
          const { data: stationsInPref } = await supabase
            .from('stations')
            .select('line_cd')
            .eq('pref_id', prefectureId)
            .eq('e_status', '0');
          
          if (stationsInPref && stationsInPref.length > 0) {
            const lineIds = [...new Set(stationsInPref.map(s => s.line_cd))];
            query = query.in('line_id', lineIds);
          }
        }

        const { data, error } = await query
          .eq('e_status', '0') // 有効な路線のみ
          .order('line_name')
          .limit(10);

        if (error) throw error;

        const formattedData = data?.map(line => ({
          line_code: line.line_id || '',
          line_ja: line.line_name || '',
          line_kana: line.line_name_h || '',
          line_romaji: line.line_name_r || '',
          operator_ja: line.companies?.company_name || ''
        }));

        return NextResponse.json(formattedData);
      }

      case 'municipality': {
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required for municipality search' },
            { status: 400 }
          );
        }

        let query = supabase
          .from('municipalities')
          .select(`
            muni_id,
            muni_name,
            muni_name_h,
            muni_name_r,
            pref_id,
            prefectures(
              pref_name
            )
          `)
          .or(`muni_name.ilike.%${keyword}%,muni_name_h.ilike.%${keyword}%,muni_name_r.ilike.%${keyword}%`);

        // 都道府県フィルターが指定されている場合
        if (prefectureId) {
          query = query.eq('pref_id', prefectureId);
        }

        const { data, error } = await query
          .order('muni_name')
          .limit(10);

        if (error) throw error;

        const formattedData = data?.map(municipality => ({
          id: municipality.muni_id || '',
          name: municipality.muni_name || '',
          hurigana: municipality.muni_name_h || '',
          romaji: municipality.muni_name_r || '',
          prefecture_id: municipality.pref_id || '',
          prefecture_name: municipality.prefectures?.pref_name || ''
        }));

        return NextResponse.json(formattedData);
      }

      case 'prefecture': {
        let query = supabase
          .from('prefectures')
          .select('pref_id, pref_name, pref_name_h, pref_name_r');

        // キーワード検索がある場合
        if (keyword) {
          query = query.or(`pref_name.ilike.%${keyword}%,pref_name_h.ilike.%${keyword}%,pref_name_r.ilike.%${keyword}%`);
        }

        const { data, error } = await query
          .order('pref_name')
          .limit(50); // 都道府県は最大47+1なので余裕を持って50

        if (error) throw error;

        const formattedData = data?.map(prefecture => ({
          id: prefecture.pref_id || '',
          name: prefecture.pref_name || '',
          hurigana: prefecture.pref_name_h || '',
          romaji: prefecture.pref_name_r || ''
        }));

        return NextResponse.json(formattedData);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid search type. Valid types: station, line, municipality, prefecture' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
