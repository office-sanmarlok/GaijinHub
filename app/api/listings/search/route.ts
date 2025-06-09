import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SearchParams {
  // 基本検索
  q?: string;
  category?: 'Housing' | 'Jobs' | 'Items for Sale' | 'Services';
  
  // 位置情報検索（優先順位順）
  station_cds?: string[];
  line_ids?: string[];
  muni_ids?: string[];
  pref_ids?: string[];
  
  // 距離検索
  user_lat?: number;
  user_lng?: number;
  max_distance?: number;
  
  // 価格検索
  min_price?: number;
  max_price?: number;
  
  // ソート・ページング
  sort?: 'created_at' | 'distance' | 'price_asc' | 'price_desc';
  limit?: number;
  offset?: number;
}

interface ListingCard {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  currency: string;
  
  location: {
    has_location: boolean;
    is_city_only: boolean;
    station_name?: string;
    muni_name: string;
    pref_name: string;
    line_name?: string;
    company_name?: string;
    distance_meters?: number;
    distance_text?: string;
  };
  
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  primary_image_url?: string;
  
  created_at: string;
  user_id: string;
  is_favorited?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams: urlParams } = new URL(request.url);
    
    // パラメータ解析
    const params: SearchParams = {
      q: urlParams.get('q') || undefined,
      category: urlParams.get('category') as any || undefined,
      station_cds: urlParams.get('station_cds')?.split(',').filter(Boolean) || [],
      line_ids: urlParams.get('line_ids')?.split(',').filter(Boolean) || [],
      muni_ids: urlParams.get('muni_ids')?.split(',').filter(Boolean) || [],
      pref_ids: urlParams.get('pref_ids')?.split(',').filter(Boolean) || [],
      user_lat: urlParams.get('user_lat') ? parseFloat(urlParams.get('user_lat')!) : undefined,
      user_lng: urlParams.get('user_lng') ? parseFloat(urlParams.get('user_lng')!) : undefined,
      max_distance: urlParams.get('max_distance') ? parseInt(urlParams.get('max_distance')!) : 50000,
      min_price: urlParams.get('min_price') ? parseInt(urlParams.get('min_price')!) : undefined,
      max_price: urlParams.get('max_price') ? parseInt(urlParams.get('max_price')!) : undefined,
      sort: urlParams.get('sort') as any || 'created_at',
      limit: Math.min(parseInt(urlParams.get('limit') || '20'), 100),
      offset: parseInt(urlParams.get('offset') || '0')
    };

    console.log('Search API params:', params);

    const supabase = await createClient();
    
    // デフォルト値の設定
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    let locationInfo: any = { location_type: null, location_names: [] };
    let data: any[] = [];
    let error: any = null;

    // 検索優先順位に基づく関数選択
    if (params.user_lat && params.user_lng) {
      // 距離検索
      console.log('Using distance search:', params);
      const { data: distanceData, error: distanceError } = await supabase.rpc('search_listings_by_distance', {
        p_lat: params.user_lat,
        p_lng: params.user_lng,
        p_max_distance_meters: params.max_distance,
        p_category: params.category,
        p_price_min: params.min_price,
        p_price_max: params.max_price,
        p_limit: limit,
        p_offset: offset,
      });
      data = distanceData || [];
      error = distanceError;
      if (!error && data) {
        data.forEach(item => { (item as any).has_location = true; });
        locationInfo = { location_type: 'distance', location_names: ['現在地周辺'] };
      }
    } else if (params.station_cds && params.station_cds.length > 0) {
      // 駅検索
      console.log('Using station search rpc:', params.station_cds);
      const { data: stationData, error: stationError } = await supabase.rpc('search_listings_by_station', {
        p_station_cds: params.station_cds,
        p_category: params.category,
        p_price_min: params.min_price,
        p_price_max: params.max_price,
        p_limit: limit,
        p_offset: offset,
      });
      data = stationData || [];
      error = stationError;
      if (!error && data) {
        data.forEach(item => { (item as any).has_location = true; });
        locationInfo = { location_type: 'station', location_names: params.station_cds };
      }
    } else if (params.line_ids && params.line_ids.length > 0) {
      // 路線検索
      console.log('Using line search rpc:', params.line_ids);
      const { data: lineData, error: lineError } = await supabase.rpc('search_listings_by_line', {
        p_line_ids: params.line_ids,
        p_category: params.category,
        p_price_min: params.min_price,
        p_price_max: params.max_price,
        p_limit: limit,
        p_offset: offset,
      });
      data = lineData || [];
      error = lineError;
      if (!error && data) {
        data.forEach(item => { (item as any).has_location = true; });
        locationInfo = { location_type: 'line', location_names: params.line_ids };
      }
    } else if (params.muni_ids && params.muni_ids.length > 0) {
       // 市区町村検索
       console.log('Using municipality search rpc:', params.muni_ids);
       const { data: muniData, error: muniError } = await supabase.rpc('search_listings_by_municipality', {
         p_muni_ids: params.muni_ids,
         p_category: params.category,
         p_price_min: params.min_price,
         p_price_max: params.max_price,
         p_limit: limit,
         p_offset: offset,
       });
       data = muniData || [];
       error = muniError;
       if (!error && data) {
        data.forEach(item => { (item as any).has_location = true; });
        locationInfo = { location_type: 'municipality', location_names: params.muni_ids };
       }
    } else if (params.pref_ids && params.pref_ids.length > 0) {
      // 都道府県検索
      console.log('Using prefecture search rpc:', params.pref_ids);
      const { data: prefData, error: prefError } = await supabase.rpc('search_listings_by_prefecture', {
        p_pref_ids: params.pref_ids,
        p_items_per_page: limit,
        p_page_number: Math.floor(offset / limit) + 1,
        // RPC関数側でソートが必要な場合は、p_sort_by, p_sort_order を渡す
      });
      data = prefData || [];
      error = prefError;
       if (!error && data) {
        data.forEach(item => { (item as any).has_location = true; });
        locationInfo = { location_type: 'prefecture', location_names: params.pref_ids };
       }
    } else {
      // 基本検索（キーワード、カテゴリ、価格など）
      console.log('Using basic search');
       let query = supabase
         .from('listings')
         .select(`
           id, title, body, category, price, created_at, user_id,
           rep_image_url, has_location, is_city_only, station_id, muni_id,
           stations (
             station_cd, station_name, line_cd,
             lines (
               line_name, company_cd,
               companies (
                 company_name
               )
             )
           ),
           municipalities (
             muni_id, muni_name, pref_id,
             prefectures (
               pref_name
             )
           )
         `, { count: 'exact' });

      // 基本フィルタ
      if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,body.ilike.%${params.q}%`);
      }
      if (params.category) {
        query = query.eq('category', params.category);
      }
      if (params.min_price) {
        query = query.gte('price', params.min_price);
      }
      if (params.max_price) {
        query = query.lte('price', params.max_price);
      }

      const result = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
       
       data = result.data || [];
       error = result.error;
    }

    if (error) {
      console.error('Search API Error:', error);
      return NextResponse.json({ message: 'An error occurred during search.', error: error.message }, { status: 500 });
    }

    console.log(`Found ${data.length} listings.`);

    // 取得したデータをListingCard形式に変換
    // RPCからの戻り値の型と、selectからの戻り値の型が異なるため、ここで統一的な変換処理が必要
    
    // 現在のユーザーIDを取得（お気に入り状態の確認のため）
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    let favoritesMap = new Map<string, boolean>();
    if (userId && data.length > 0) {
      const listingIds = data.map(l => l.id || l.listing_id).filter(Boolean);
      if (listingIds.length > 0) {
        const { data: favorites, error: favError } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', userId)
          .in('listing_id', listingIds);
        
        if (favError) {
          console.error('Favorites fetch error:', favError);
        } else if (favorites) {
          favorites.forEach(f => favoritesMap.set(f.listing_id, true));
        }
      }
    }
    
    const formattedListings = data.map((item): ListingCard => {
      // RPCからのデータか、直接のテーブルクエリからのデータかを判別して処理
      const isRpcResult = !!item.listing_id;
      
      const id = isRpcResult ? item.listing_id : item.id;
      const title = item.title;
      const body = item.body;
      const category = item.category;
      const price = item.price;
      const createdAt = item.created_at;
      const itemUserId = item.user_id;
      const repImageUrl = item.rep_image_url;

      // Location data (RPCと直接クエリで構造が大きく異なるため、慎重にマッピング)
      let location = {
        has_location: item.has_location ?? false,
        is_city_only: item.is_city_only ?? false,
        station_name: item.station_name || item.primary_station_name || item.stations?.station_name,
        muni_name: item.municipality_name || item.municipalities?.muni_name,
        pref_name: item.prefecture_name || item.municipalities?.prefectures?.pref_name,
        line_name: item.matched_line_name || item.primary_line_name || item.stations?.lines?.line_name,
        company_name: item.stations?.lines?.companies?.company_name, // RPCからは取得不可
        distance_meters: item.distance_meters || item.distance_to_matched_station_meters,
        distance_text: item.distance_meters ? `${(item.distance_meters / 1000).toFixed(1)}km` : undefined,
      };

      return {
        id: id,
        title: title,
        body: body,
        category: category,
        price: price,
        currency: 'JPY',
        location: location,
        images: repImageUrl ? [{ url: repImageUrl, alt: title, is_primary: true }] : [],
        primary_image_url: repImageUrl,
        created_at: createdAt,
        user_id: itemUserId,
        is_favorited: favoritesMap.get(id) || false,
      };
    });

    // ページネーション情報
    // countはRPCからは直接取得できないため、別途クエリが必要になる場合がある。
    // 今回はlimitより1件多く取得して「次へ」の有無を判断する方式などを検討
    const hasMore = data.length === limit; 
    
    console.log('Final location info:', locationInfo);

    return NextResponse.json({
      listings: formattedListings,
      location_info: locationInfo,
      pagination: {
        limit: limit,
        offset: offset,
        has_more: hasMore,
      }
    });

  } catch (error: any) {
    console.error('Unexpected error in search API:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.', error: error.message }, { status: 500 });
  }
}