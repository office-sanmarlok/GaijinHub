import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Client for accessing only public data without authentication
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    
    console.log('API params:', { 
      category, q, location, minPrice, maxPrice, 
      stationId, lineCode, municipalityId, page, limit 
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
          stationIds = stationsForLine.map(s => s.station_group_id);
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
        // 駅の路線情報を整形
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