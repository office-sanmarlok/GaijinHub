import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// エラーレスポンスのヘルパー関数
function errorResponse(message: string, details: any, status = 500) {
  console.error(`API Error: ${message}`, details);
  return NextResponse.json({
    error: message,
    details
  }, { status });
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const maxDistance = parseInt(searchParams.get('maxDistance') || '10000', 10); // デフォルト10km
    
    if (!lat || !lng) {
      return errorResponse('位置情報（lat, lng）が必要です', { lat, lng }, 400);
    }
    
    console.log('近距離検索パラメータ:', { lat, lng, category, limit, offset, maxDistance });

    // 認証済みユーザー用のクライアント
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();

    // 直接SQLクエリを構築
    try {
      // POSTGISを使わない単純な距離計算でリスティングを検索
      // これはPostGIS関数が利用できない場合の代替手段
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          body,
          price,
          category,
          user_id,
          created_at,
          rep_image_url,
          lat,
          lng,
          municipality:tokyo_municipalities!municipality_id(name),
          station:tokyo_station_groups!station_id(name_kanji)
        `)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .eq('has_location', true);
        
      // カテゴリフィルタ
      if (category) {
        query = query.eq('category', category);
      }

      // 結果を取得
      const { data, error } = await query.limit(100); // 一旦多めに取得
      
      if (error) {
        return errorResponse('リスティング検索エラー', {
          message: error.message,
          details: error.details
        }, 500);
      }
      
      if (!data || !Array.isArray(data)) {
        return errorResponse('無効なレスポンス形式', { data }, 500);
      }
      
      // JavaScriptでの距離計算
      const listingsWithDistance = data.map(listing => {
        // 型安全のために確認
        const listingLat = typeof listing.lat === 'number' ? listing.lat : 0;
        const listingLng = typeof listing.lng === 'number' ? listing.lng : 0;
        
        // ハーバーサイン公式で距離を計算 (メートル単位)
        const R = 6371000; // 地球の半径（メートル）
        const dLat = (listingLat - latNum) * Math.PI / 180;
        const dLng = (listingLng - lngNum) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latNum * Math.PI / 180) * Math.cos(listingLat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
          ...listing,
          distance_meters: distance,
          municipality_name: listing.municipality?.name || null,
          station_name: listing.station?.name_kanji || null,
          listing_id: listing.id // idをlisting_idとして追加
        };
      })
      // 最大距離でフィルタリング
      .filter(item => item.distance_meters <= maxDistance)
      // 距離順にソート
      .sort((a, b) => a.distance_meters - b.distance_meters)
      // 必要な分だけ抽出
      .slice(offset, offset + limit);
      
      console.log(`検索結果: ${listingsWithDistance.length}件見つかりました`);

      // お気に入り情報の付加（認証済みユーザーのみ）
      let listingsWithFavorites = listingsWithDistance;
      if (session) {
        const userId = session.user.id;
        
        // ユーザーのお気に入り情報を取得
        const { data: favorites } = await supabaseAuth
          .from('favorites')
          .select('listing_id')
          .eq('user_id', userId);
        
        const favoriteIds = favorites?.map(fav => fav.listing_id) || [];
        
        // リスティングにお気に入り情報を追加
        listingsWithFavorites = listingsWithDistance.map(listing => ({
          ...listing,
          is_favorite: favoriteIds.includes(listing.listing_id)
        }));
      }
      
      return NextResponse.json({ 
        listings: listingsWithFavorites,
        total: listingsWithFavorites.length
      });
    } catch (queryError: any) {
      return errorResponse('データベースクエリエラー', {
        message: queryError.message,
        stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined
      }, 500);
    }
  } catch (error: any) {
    return errorResponse('サーバーエラー', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
} 
