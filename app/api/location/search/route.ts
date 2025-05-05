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

    if (!type || !keyword) {
      return NextResponse.json(
        { error: 'Type and keyword are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    switch (type) {
      case 'station': {
        const { data, error } = await supabase
          .from('tokyo_station_groups')
          .select(`
            id,
            name_kanji,
            name_kana,
            lines:tokyo_station_line_relations(
              line:tokyo_lines(
                line_code,
                line_ja,
                operator_ja
              )
            )
          `)
          .ilike('name_kanji', `%${keyword}%`)
          .order('name_kanji')
          .limit(10);

        if (error) throw error;

        // 駅の路線情報を整形
        const formattedData = (data as unknown as JoinedStation[]).map(station => ({
          ...station,
          lines: station.lines
            ? station.lines.map(({ line }) => line)
            : null
        })) as StationWithLines[];

        return NextResponse.json(formattedData);
      }

      case 'line': {
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