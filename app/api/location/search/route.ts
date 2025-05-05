import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { StationWithLines } from '@/app/types/location';
import { Database, JoinedStation } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');
    const stationId = searchParams.get('stationId');

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    switch (type) {
      case 'station': {
        let query = supabase
          .from('tokyo_station_groups')
          .select(`
            id,
            name_kanji,
            name_kana,
            municipality_id,
            lines:tokyo_station_line_relations(
              line:tokyo_lines(
                line_code,
                line_ja,
                operator_ja
              )
            )
          `);

        // 特定の駅IDが指定されている場合
        if (stationId) {
          query = query.eq('id', stationId);
        } 
        // キーワード検索の場合
        else if (keyword) {
          query = query.ilike('name_kanji', `%${keyword}%`);
        }
        // どちらも指定がない場合はエラー
        else {
          return NextResponse.json(
            { error: 'Either stationId or keyword is required' },
            { status: 400 }
          );
        }

        const { data, error } = await query
          .order('name_kanji')
          .limit(10);

        if (error) throw error;

        // 駅の路線情報を整形
        const formattedData = (data as unknown as JoinedStation[]).map(station => {
          console.log('Processing station:', station.name_kanji);
          console.log('Raw lines data:', station.lines);
          
          // 路線情報を適切にフォーマット
          let formattedLines = null;
          if (station.lines && Array.isArray(station.lines)) {
            formattedLines = station.lines
              .map(lineRelation => {
                if (!lineRelation || !lineRelation.line) return null;
                
                // 直接必要な情報だけを取り出し、フラットな構造に
                return {
                  line_code: lineRelation.line.line_code,
                  line_ja: lineRelation.line.line_ja,
                  operator_ja: lineRelation.line.operator_ja
                };
              })
              .filter(Boolean);
          }
          
          return {
            ...station,
            lines: formattedLines
          };
        }) as StationWithLines[];

        return NextResponse.json(formattedData);
      }

      case 'line': {
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required for line search' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('tokyo_lines')
          .select('line_code, line_ja, operator_ja')
          .ilike('line_ja', `%${keyword}%`)
          .order('line_ja')
          .limit(10);

        if (error) throw error;
        return NextResponse.json(data);
      }

      case 'municipality': {
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required for municipality search' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('tokyo_municipalities')
          .select('id, name, hurigana')
          .ilike('name', `%${keyword}%`)
          .order('name')
          .limit(10);

        if (error) throw error;
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
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