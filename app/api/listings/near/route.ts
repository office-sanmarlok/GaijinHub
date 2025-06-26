import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

// エラーレスポンスのヘルパー関数
function errorResponse(message: string, details: any, status = 500) {
  console.error(`API Error: ${message}`, details);
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status }
  );
}

// Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 位置情報から近い順にリスティングを取得するAPI
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const category = searchParams.get('category');
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const maxDistance = Number.parseInt(searchParams.get('maxDistance') || '10000', 10); // デフォルト10km
    const prefectureId = searchParams.get('prefectureId'); // 都道府県フィルター
    const municipalityId = searchParams.get('municipalityId'); // 市区町村フィルター

    if (!lat || !lng) {
      return errorResponse('位置情報（lat, lng）が必要です', { lat, lng }, 400);
    }

    console.log('近距離検索パラメータ:', {
      lat,
      lng,
      category,
      limit,
      offset,
      maxDistance,
      prefectureId,
      municipalityId,
    });

    // 認証済みユーザー用のクライアント
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession();

    try {
      // search_listings_by_distance関数を使用して距離検索を実行
      const { data, error } = await supabase.rpc('search_listings_by_distance', {
        p_lat: Number.parseFloat(lat),
        p_lon: Number.parseFloat(lng),
        p_radius_meters: maxDistance,
        p_pref_id: prefectureId || null,
        p_muni_id: municipalityId ? Number.parseInt(municipalityId) : null,
        p_items_per_page: limit + offset, // offsetを考慮して多めに取得
        p_page_number: 1,
      });

      if (error) {
        return errorResponse(
          'リスティング検索エラー',
          {
            message: error.message,
            details: error.details,
          },
          500
        );
      }

      if (!data || !Array.isArray(data)) {
        return errorResponse('無効なレスポンス形式', { data }, 500);
      }

      // カテゴリフィルタ（DBサイドでフィルタできるように後で改善可能）
      let filteredData = data;
      if (category) {
        filteredData = data.filter((listing) => listing.category === category);
      }

      // オフセットとリミットを適用
      const paginatedData = filteredData.slice(offset, offset + limit);

      // データを適切な形式に変換
      const formattedListings = paginatedData.map((listing) => ({
        id: listing.id,
        title: listing.title,
        body: listing.body,
        price: listing.price,
        category: listing.category,
        user_id: listing.user_id,
        created_at: listing.created_at,
        rep_image_url: listing.rep_image_url,
        lat: listing.lat,
        lng: listing.lng,
        distance_meters: listing.distance_meters,
        municipality_name: listing.muni_name,
        station_name: listing.station_name,
        prefecture_name: listing.pref_name,
        line_name: listing.line_name,
        listing_id: listing.id,
        has_location: listing.has_location,
        is_city_only: listing.is_city_only,
      }));

      console.log(`検索結果: ${formattedListings.length}件見つかりました`);

      // お気に入り情報の付加（認証済みユーザーのみ）
      let listingsWithFavorites = formattedListings;
      if (session) {
        const userId = session.user.id;

        // ユーザーのお気に入り情報を取得
        const { data: favorites } = await supabaseAuth.from('favorites').select('listing_id').eq('user_id', userId);

        const favoriteIds = favorites?.map((fav) => fav.listing_id) || [];

        // リスティングにお気に入り情報を追加
        listingsWithFavorites = formattedListings.map((listing) => ({
          ...listing,
          is_favorite: favoriteIds.includes(listing.listing_id),
        }));
      }

      return NextResponse.json({
        listings: listingsWithFavorites,
        total: filteredData.length, // カテゴリフィルタ後の総数
      });
    } catch (queryError: any) {
      return errorResponse(
        'データベースクエリエラー',
        {
          message: queryError.message,
          stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined,
        },
        500
      );
    }
  } catch (error: any) {
    return errorResponse(
      'サーバーエラー',
      {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      500
    );
  }
}
