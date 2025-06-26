import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

// Client for accessing only public data without authentication
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 駅IDからlat/lon/point/muni_idを取得する関数
async function getStationLocationData(stationId: string) {
  if (!stationId) return null;

  const { data, error } = await supabase
    .from('stations')
    .select('lat, lon, muni_id')
    .eq('station_cd', stationId)
    .single();

  if (error || !data) {
    console.error('駅の位置情報取得エラー:', error);
    return null;
  }

  return {
    lat: data.lat,
    lng: data.lon,
    muni_id: data.muni_id,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const stationId = searchParams.get('stationId');
    const stationCode = searchParams.get('stationCode'); // 新スキーマ対応
    const lineCode = searchParams.get('lineCode');
    const municipalityId = searchParams.get('municipalityId');
    const prefectureId = searchParams.get('prefectureId'); // 新スキーマ対応
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = 12;
    const offset = (page - 1) * limit;
    const sort = searchParams.get('sort') || 'new'; // ソート順を取得（デフォルトは新着順）
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    console.log('API params:', {
      category,
      q,
      location,
      minPrice,
      maxPrice,
      stationId,
      stationCode,
      lineCode,
      municipalityId,
      prefectureId,
      page,
      limit,
      sort,
      lat,
      lng,
    });

    try {
      // 路線検索の場合は、まず対象の路線を通る駅のIDリストを取得
      let stationCodes: string[] = [];
      if (lineCode) {
        console.log(`Fetching stations for line: ${lineCode}`);
        const { data: stationsForLine, error: stationError } = await supabase
          .from('stations')
          .select('station_cd')
          .eq('line_cd', lineCode);

        if (stationError) {
          console.error('Error fetching stations for line:', stationError);
        } else if (stationsForLine && stationsForLine.length > 0) {
          stationCodes = stationsForLine.map((s) => s.station_cd).filter(Boolean) as string[];
          console.log(`Found ${stationCodes.length} stations for line ${lineCode}`);
        }
      }

      // 駅から市区町村IDを取得（市区町村検索で使用）
      let municipalityFromStation: string | null = null;
      const finalStationCode = stationCode || stationId; // 後方互換性
      if (finalStationCode && !municipalityId) {
        console.log(`Fetching municipality for station: ${finalStationCode}`);
        const { data: stationData, error: stationError } = await supabase
          .from('stations')
          .select('muni_id')
          .eq('station_cd', finalStationCode)
          .single();

        if (stationError) {
          console.error('Error fetching municipality for station:', stationError);
        } else if (stationData) {
          municipalityFromStation = stationData.muni_id;
          console.log(`Station ${finalStationCode} belongs to municipality ${municipalityFromStation}`);
        }
      }

      let query = supabase.from('listings').select(
        `
          *,
          municipality:municipalities!muni_id(
            muni_name,
            pref_id,
            prefecture:prefectures!pref_id(
              pref_name
            )
          ),
          station:stations!station_id(
            station_name,
            station_cd,
            line:lines!line_cd(
              line_name,
              company:companies!company_cd(
                company_name
              )
            )
          )
        `,
        { count: 'exact' }
      );

      // Apply search filters
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

      // 位置情報検索 - 新スキーマ対応
      if (finalStationCode) {
        query = query.eq('station_id', finalStationCode);
      } else if (lineCode && stationCodes.length > 0) {
        // 路線に属する駅のいずれかを持つリスティングを検索
        query = query.in('station_id', stationCodes);
      } else if (municipalityId) {
        // 市区町村IDで直接検索
        query = query.eq('muni_id', municipalityId);
      } else if (prefectureId) {
        // 都道府県IDで検索 - 市区町村経由
        const { data: municipalitiesInPref } = await supabase
          .from('municipalities')
          .select('muni_id')
          .eq('pref_id', prefectureId);

        if (municipalitiesInPref && municipalitiesInPref.length > 0) {
          const muniIds = municipalitiesInPref.map((m) => m.muni_id);
          query = query.in('muni_id', muniIds);
        }
      } else if (municipalityFromStation) {
        // 駅から取得した市区町村IDで検索
        query = query.eq('muni_id', municipalityFromStation);
      }

      console.log('Executing Supabase query...');

      // ページネーション
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (error) {
        console.error('Supabase data fetch error:', error);
        return NextResponse.json(
          {
            error: 'Data fetch error',
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          { status: 500 }
        );
      }

      console.log(`Query successful. Found ${count || 0} listings.`);

      try {
        // 新しいスキーマ構造に対応した整形処理
        const formattedData = data.map((listing) => {
          // stationプロパティの存在を確認
          if (!listing.station) {
            return listing;
          }

          // 新しいスキーマ構造に対応
          return {
            ...listing,
            station: {
              name_kanji: listing.station.station_name, // 互換性のため
              station_name: listing.station.station_name,
              station_cd: listing.station.station_cd,
              lines: listing.station.line
                ? [
                    {
                      line_ja: listing.station.line.line_name, // 互換性のため
                      line_name: listing.station.line.line_name,
                      company_name: listing.station.line.company?.company_name,
                    },
                  ]
                : null,
            },
          };
        });

        // ソート順に応じた処理
        if (sort === 'near' && lat && lng) {
          console.log('距離による並び替えを実行');
          const latNum = Number.parseFloat(lat);
          const lngNum = Number.parseFloat(lng);

          // 位置情報による距離計算を行い、データを整形
          const listingsWithDistance = formattedData
            .filter((listing) => listing.lat !== null && listing.lng !== null)
            .map((listing) => {
              // 距離を計算（メートル単位）
              let distance = Number.MAX_VALUE;

              if (listing.lat && listing.lng) {
                const R = 6371000; // 地球の半径（メートル）
                const dLat = ((listing.lat - latNum) * Math.PI) / 180;
                const dLng = ((listing.lng - lngNum) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((latNum * Math.PI) / 180) *
                    Math.cos((listing.lat * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distance = R * c;
              }

              return {
                ...listing,
                distance_meters: distance,
              };
            });

          // 距離順にソート
          listingsWithDistance.sort((a, b) => a.distance_meters - b.distance_meters);

          // 位置情報のないリスティングを後ろに追加
          const listingsWithoutLocation = formattedData.filter(
            (listing) => listing.lat === null || listing.lng === null
          );

          // 並び替えた結果を返す
          return NextResponse.json({
            data: [...listingsWithDistance, ...listingsWithoutLocation],
            count,
          });
        }

        return NextResponse.json({
          data: formattedData,
          count,
        });
      } catch (formatError) {
        console.error('Error formatting station data:', formatError);
        return NextResponse.json(
          {
            error: 'Error formatting data',
            message: formatError instanceof Error ? formatError.message : 'Unknown format error',
            data: data,
            count,
          },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        {
          error: 'Database query error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
