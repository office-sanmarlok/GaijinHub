import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client for accessing only public data without authentication
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 駅IDからlat/lon/pointを取得する関数
async function getStationLocationData(stationId: string) {
  if (!stationId) return null;
  
  const { data, error } = await supabase
    .from('tokyo_station_groups')
    .select('lat, lon, point')
    .eq('id', stationId)
    .single();
  
  if (error || !data) {
    console.error('駅の位置情報取得エラー:', error);
    return null;
  }
  
  return {
    lat: data.lat,
    lng: data.lon,
    point: data.point
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
    const lineCode = searchParams.get('lineCode');
    const municipalityId = searchParams.get('municipalityId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 12;
    const offset = (page - 1) * limit;
    const sort = searchParams.get('sort') || 'new'; // ソート順を取得（デフォルトは新着順）
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    console.log('API params:', { 
      category, q, location, minPrice, maxPrice, 
      stationId, lineCode, municipalityId, page, limit, sort, lat, lng
    });
    
    try {
      // 路線検索の場合は、まず対象の路線を通る駅のIDリストを取得
      let stationIds: string[] = [];
      if (lineCode) {
        console.log(`Fetching stations for line: ${lineCode}`);
        const { data: stationsForLine, error: stationError } = await supabase
          .from('tokyo_station_line_relations')
          .select('station_group_id')
          .eq('line_code', lineCode);
        
        if (stationError) {
          console.error('Error fetching stations for line:', stationError);
        } else if (stationsForLine && stationsForLine.length > 0) {
          stationIds = stationsForLine.map(s => s.station_group_id).filter(Boolean) as string[];
          console.log(`Found ${stationIds.length} stations for line ${lineCode}`);
        }
      }

      // 駅から市区町村IDを取得（市区町村検索で使用）
      let municipalityFromStation: string | null = null;
      if (stationId && !municipalityId) {
        console.log(`Fetching municipality for station: ${stationId}`);
        const { data: stationData, error: stationError } = await supabase
          .from('tokyo_station_groups')
          .select('municipality_id')
          .eq('id', stationId)
          .single();
        
        if (stationError) {
          console.error('Error fetching municipality for station:', stationError);
        } else if (stationData) {
          municipalityFromStation = stationData.municipality_id;
          console.log(`Station ${stationId} belongs to municipality ${municipalityFromStation}`);
        }
      }

      let query = supabase
        .from('listings')
        .select(`
          *,
          municipality:tokyo_municipalities!municipality_id(
            name
          ),
          station:tokyo_station_groups!station_id(
            name_kanji,
            municipality_id,
            lines:tokyo_station_line_relations(
              line:tokyo_lines(
                line_code,
                line_ja
              )
            )
          )
        `, { count: 'exact' });

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

      // 位置情報検索
      if (stationId) {
        query = query.eq('station_id', stationId);
      } else if (lineCode && stationIds.length > 0) {
        // 路線に属する駅のいずれかを持つリスティングを検索
        query = query.in('station_id', stationIds);
      } else if (municipalityId) {
        // 市区町村IDで直接検索
        query = query.eq('municipality_id', municipalityId);
      } else if (municipalityFromStation) {
        // 駅から取得した市区町村IDで検索
        query = query.eq('municipality_id', municipalityFromStation);
      }

      console.log('Executing Supabase query...');
      
      // ページネーション
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (error) {
        console.error('Supabase data fetch error:', error);
        return NextResponse.json({ 
          error: 'Data fetch error', 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        }, { status: 500 });
      }

      console.log(`Query successful. Found ${count || 0} listings.`);
      
      try {
        // 駅と路線情報を整形
        const formattedData = data.map(listing => {
          // stationプロパティの存在を確認
          if (!listing.station) {
            return listing;
          }
          
          // station.linesプロパティの存在と内容を確認
          const stationLines = listing.station.lines;
          if (!stationLines || !Array.isArray(stationLines) || stationLines.length === 0) {
            return {
              ...listing,
              station: {
                ...listing.station,
                lines: null
              }
            };
          }
          
          // linesを安全に変換
          try {
            return {
              ...listing,
              station: {
                ...listing.station,
                lines: stationLines.map(lineJoin => {
                  if (!lineJoin || !lineJoin.line) {
                    return null;
                  }
                  return lineJoin.line;
                }).filter(Boolean)
              }
            };
          } catch (lineErr) {
            console.error('Error processing station lines:', lineErr, listing.station);
            return {
              ...listing,
              station: {
                ...listing.station,
                lines: null
              }
            };
          }
        });

        // ソート順に応じた処理
        if (sort === 'near' && lat && lng) {
          console.log('距離による並び替えを実行');
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);
          
          // 位置情報による距離計算を行い、データを整形
          const listingsWithDistance = formattedData
            .filter(listing => listing.lat !== null && listing.lng !== null)
            .map(listing => {
              // 距離を計算（メートル単位）
              let distance = Number.MAX_VALUE;
              
              if (listing.lat && listing.lng) {
                const R = 6371000; // 地球の半径（メートル）
                const dLat = (listing.lat - latNum) * Math.PI / 180;
                const dLng = (listing.lng - lngNum) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latNum * Math.PI / 180) * Math.cos(listing.lat * Math.PI / 180) * 
                  Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                distance = R * c;
              }
              
              return {
                ...listing,
                distance_meters: distance
              };
            });
          
          // 距離順にソート
          listingsWithDistance.sort((a, b) => a.distance_meters - b.distance_meters);
          
          // 位置情報のないリスティングを後ろに追加
          const listingsWithoutLocation = formattedData.filter(
            listing => listing.lat === null || listing.lng === null
          );
          
          // 並び替えた結果を返す
          return NextResponse.json({ 
            data: [...listingsWithDistance, ...listingsWithoutLocation],
            count
          });
        }

        return NextResponse.json({ 
          data: formattedData,
          count
        });
      } catch (formatError) {
        console.error('Error formatting station data:', formatError);
        return NextResponse.json({ 
          error: 'Error formatting data', 
          message: formatError instanceof Error ? formatError.message : 'Unknown format error',
          data: data,
          count
        }, { status: 500 });
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({
        error: 'Database query error',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // サーバーサイドでクッキーからセッション情報を取得するクライアント
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies });
    
    // ユーザー認証チェック
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const jsonData = await request.json();
    
    // リクエストデータのバリデーション
    if (!jsonData.title || !jsonData.body || !jsonData.category) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }
    
    // 基本データの準備
    const listingData: any = {
      title: jsonData.title,
      body: jsonData.body,
      category: jsonData.category,
      price: jsonData.price || null,
      user_id: userId,
      has_location: false
    };
    
    // 位置情報の設定
    if (jsonData.station_id) {
      listingData.station_id = jsonData.station_id;
      
      // 駅IDから位置情報を取得して設定
      const locationData = await getStationLocationData(jsonData.station_id);
      if (locationData) {
        listingData.lat = locationData.lat;
        listingData.lng = locationData.lng;
        listingData.point = locationData.point;
        listingData.has_location = true;
      }
    }
    
    if (jsonData.municipality_id) {
      listingData.municipality_id = jsonData.municipality_id;
    }
    
    console.log('リスティング作成データ:', listingData);
    
    // Supabaseにデータを挿入
    const { data, error } = await supabaseAuth
      .from('listings')
      .insert(listingData)
      .select()
      .single();
      
    if (error) {
      console.error('リスティング作成エラー:', error);
      return NextResponse.json({ 
        error: 'リスティング作成に失敗しました', 
        message: error.message 
      }, { status: 500 });
    }
    
    // 画像情報があれば保存
    if (jsonData.images && Array.isArray(jsonData.images) && jsonData.images.length > 0) {
      const imageInserts = jsonData.images.map((image: any, index: number) => ({
        listing_id: data.id,
        path: image.path,
        order: index
      }));
      
      const { error: imageError } = await supabaseAuth
        .from('images')
        .insert(imageInserts);
      
      if (imageError) {
        console.error('画像保存エラー:', imageError);
        // 画像保存エラーはリスティング作成自体を失敗させない
      }
    }
    
    // 代表画像URLの更新
    if (jsonData.images && jsonData.images.length > 0) {
      const repImageUrl = jsonData.images[0].path;
      const { error: updateError } = await supabaseAuth
        .from('listings')
        .update({ rep_image_url: repImageUrl })
        .eq('id', data.id);
      
      if (updateError) {
        console.error('代表画像更新エラー:', updateError);
      }
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({
      error: 'サーバーエラー',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
} 
