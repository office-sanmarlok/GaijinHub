import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Listing } from '@/types/listing';
import { type Database } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

// search_listings RPCのパラメータの型定義
interface SearchListingsParams {
  p_q?: string;
  p_category?: 'Housing' | 'Jobs' | 'Items for Sale' | 'Services';
  p_pref_ids?: string[];
  p_muni_ids?: string[];
  p_station_g_cds?: string[];
  p_line_ids?: string[];
  p_min_price?: number;
  p_max_price?: number;
  p_user_lat?: number;
  p_user_lng?: number;
  p_max_distance_meters?: number;
  p_sort?: 'newest' | 'oldest' | 'closest' | 'price_asc' | 'price_desc';
  p_limit?: number;
  p_offset?: number;
  p_language?: string;
}

// search_listings RPCが返す行の型定義
type SearchResult = Database['public']['Functions']['search_listings']['Returns'][number] & {
  translation?: {
    title: string;
    body: string;
    is_auto_translated: boolean;
  } | null;
};

// search_listings RPCが返すJSONオブジェクト内のlocationの型
interface LocationInfo {
  station_g_cd?: string;
  station_g_name?: string;
  station_g_name_r?: string;
  station_g_name_h?: string;
  station_cd?: string;
  station_name?: string;
  station_name_r?: string;
  station_name_h?: string;
  pref_id?: string;
  pref_name?: string;
  pref_name_r?: string;
  pref_name_h?: string;
  muni_id?: string;
  muni_name?: string;
  muni_name_r?: string;
  muni_name_h?: string;
  has_location: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams: urlParams } = new URL(request.url);
    const supabase = await createClient();

    // パラメータをRPC関数の形式に整形
    const params: SearchListingsParams = {
      p_q: urlParams.get('q') || undefined,
      p_category: (urlParams.get('category') as SearchListingsParams['p_category']) || undefined,
      p_pref_ids: urlParams.get('pref_ids')?.split(',').filter(Boolean).length
        ? urlParams.get('pref_ids')?.split(',').filter(Boolean)
        : undefined,
      p_muni_ids: urlParams.get('muni_ids')?.split(',').filter(Boolean).length
        ? urlParams.get('muni_ids')?.split(',').filter(Boolean)
        : undefined,
      p_station_g_cds: urlParams.get('station_g_cds')?.split(',').filter(Boolean).length
        ? urlParams.get('station_g_cds')?.split(',').filter(Boolean)
        : undefined,
      p_line_ids: urlParams.get('line_ids')?.split(',').filter(Boolean).length
        ? urlParams.get('line_ids')?.split(',').filter(Boolean)
        : undefined,
      p_min_price: urlParams.get('min_price') ? Number.parseInt(urlParams.get('min_price')!) : undefined,
      p_max_price: urlParams.get('max_price') ? Number.parseInt(urlParams.get('max_price')!) : undefined,
      p_user_lat: urlParams.get('user_lat') ? Number.parseFloat(urlParams.get('user_lat')!) : undefined,
      p_user_lng: urlParams.get('user_lng') ? Number.parseFloat(urlParams.get('user_lng')!) : undefined,
      p_max_distance_meters: urlParams.get('max_distance') ? Number.parseInt(urlParams.get('max_distance')!) : 50000, // デフォルト値を設定
      p_sort: (urlParams.get('sort') as SearchListingsParams['p_sort']) || 'newest',
      p_limit: Math.min(Number.parseInt(urlParams.get('limit') || '20'), 100),
      p_offset: Number.parseInt(urlParams.get('offset') || '0'),
      p_language: urlParams.get('language') || undefined,
    };

    // 'null' or 'undefined' string parametersを実際のundefinedに変換
    if (
      params.p_user_lat !== undefined &&
      (isNaN(params.p_user_lat) || urlParams.get('user_lat') === 'null' || urlParams.get('user_lat') === 'undefined')
    ) {
      params.p_user_lat = undefined;
    }
    if (
      params.p_user_lng !== undefined &&
      (isNaN(params.p_user_lng) || urlParams.get('user_lng') === 'null' || urlParams.get('user_lng') === 'undefined')
    ) {
      params.p_user_lng = undefined;
    }

    // デバッグログ
    logger.debug('=== SEARCH LISTINGS DEBUG ===');
    logger.debug('URL Params received:', Object.fromEntries(urlParams.entries()));
    logger.debug('Calling search_listings with params:', { JSON: JSON.stringify(params, null, 2) });

    // RPCを呼び出す
    const { data, error } = await supabase.rpc('search_listings', params).returns<SearchResult[]>();

    if (error) {
      logger.error('Supabase RPC Error:', error);
      // エラーメッセージから、問題が型の不一致であることを示唆する
      if (error.message.includes('does not match function result type')) {
        return new NextResponse(
          JSON.stringify({
            error:
              'Database function error: The returned data structure does not match the expected type. Please check the `search_listings` function definition.',
            details: error.message,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // locationInfoの決定ロジック
    const locationInfo: { location_type: string | null; location_names: string[] } = {
      location_type: null,
      location_names: [],
    };

    if (params.p_station_g_cds?.length) {
      locationInfo.location_type = 'station';
      const { data: stationGroups, error: stationGroupError } = await supabase
        .from('station_groups')
        .select('station_name')
        .in('station_g_cd', params.p_station_g_cds);
      if (stationGroupError) logger.error('Error fetching station group names:', stationGroupError);
      else locationInfo.location_names = stationGroups.map((sg) => sg.station_name);
    } else if (params.p_line_ids?.length) {
      locationInfo.location_type = 'line';
      const { data: lines, error: lineError } = await supabase
        .from('lines')
        .select('line_name')
        .in('line_id', params.p_line_ids);
      if (lineError) logger.error('Error fetching line names:', lineError);
      else locationInfo.location_names = lines.map((l) => l.line_name);
    } else if (params.p_muni_ids?.length) {
      locationInfo.location_type = 'municipality';
      const { data: munis, error: muniError } = await supabase
        .from('municipalities')
        .select('muni_name')
        .in('muni_id', params.p_muni_ids);
      if (muniError) logger.error('Error fetching municipality names:', muniError);
      else locationInfo.location_names = munis.map((m) => m.muni_name);
    } else if (params.p_pref_ids?.length) {
      locationInfo.location_type = 'prefecture';
      const { data: prefs, error: prefError } = await supabase
        .from('prefectures')
        .select('pref_name')
        .in('pref_id', params.p_pref_ids);
      if (prefError) logger.error('Error fetching prefecture names:', prefError);
      else locationInfo.location_names = prefs.map((p) => p.pref_name);
    }

    // 検索結果を整形
    const listings: Listing[] =
      data?.map((item) => {
        const location = item.location as unknown as LocationInfo; // 型アサーション

        return {
          id: item.id,
          title: item.title,
          body: item.body,
          category: item.category,
          price: item.price,
          currency: 'JPY', // Default currency
          original_language: item.original_language,
          rep_image_url: item.rep_image_url || undefined,
          translation: item.translation || undefined,
          location: {
            has_location: location.has_location,
            is_city_only: !location.station_name, // Approximation
            station_name: location.station_name,
            station_name_r: location.station_name_r,
            station_group_name: location.station_g_name,
            station_group_name_r: location.station_g_name_r,
            muni_name: location.muni_name || '',
            muni_name_r: location.muni_name_r,
            pref_name: location.pref_name || '',
            pref_name_r: location.pref_name_r,
            distance_meters: item.distance_meters,
          },
          images: item.rep_image_url ? [{ url: item.rep_image_url, alt: item.title, is_primary: true }] : [],
          created_at: item.created_at,
          user_id: item.user_id,
        };
      }) || [];
    const totalCount = data?.[0]?.total_count || 0;
    const hasMore = params.p_offset! + (data?.length || 0) < totalCount;

    return NextResponse.json({
      listings,
      location_info: locationInfo,
      pagination: {
        limit: params.p_limit,
        offset: params.p_offset,
        has_more: hasMore,
        total_count: totalCount,
      },
    });
  } catch (error) {
    logger.error('API Route Error:', error);
    return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred.', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
