import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 駅グループ一覧を取得するAPI
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const keyword = searchParams.get('keyword') || undefined;

    // rpc呼び出しの型引数を削除し、createClientからの型推論に任せる
    const { data, error } = await supabase.rpc('get_station_groups_with_details', {
      p_limit: limit,
      p_offset: offset,
      p_keyword: keyword,
    });

    if (error) {
      console.error('駅グループ取得エラー:', error);
      return NextResponse.json({ error: '駅グループの取得に失敗しました', details: error.message }, { status: 500 });
    }

    // 総件数を取得する別のクエリ (必要であれば実装)
    // 現状はPostgreSQL関数内でLIMIT/OFFSETしているため、総件数は別途取得が必要
    // 仮に、総件数を取得しない設計とするか、別途count関数を呼ぶか、RPC関数内で返すようにする
    // ここでは単純に取得できた件数を返します

    // linesフィールドをlines_infoにマッピング
    const formattedData =
      data?.map((item) => ({
        ...item,
        lines_info: typeof item.lines === 'string' ? JSON.parse(item.lines) : item.lines, // JSONBフィールドの処理
        lines: undefined, // 元のlinesフィールドは削除
      })) || [];

    return NextResponse.json({
      data: formattedData,
      count: formattedData.length, // 取得できた件数を仮の総件数とする
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
