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
      // 距離検索（一時的に無効化、基本検索を使用）
      console.log('Distance search temporarily disabled, using basic search');
      let query = supabase
        .from('listings')
        .select(`
          id, title, body, category, price, created_at, user_id,
          rep_image_url, has_location, is_city_only, station_id, muni_id
        `, { count: 'exact' });

      // 基本フィルタのみ適用
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
      locationInfo = { location_type: 'distance', location_names: ['現在地周辺'] };
      
    } else if (params.station_cds && params.station_cds.length > 0) {
      // 駅検索（詳細ページと同じ方法で個別クエリを使用）
      console.log('Using station search with separate queries:', params.station_cds);
      let query = supabase
        .from('listings')
        .select(`
          id, title, body, category, price, created_at, user_id,
          rep_image_url, has_location, is_city_only, station_id, muni_id
        `, { count: 'exact' });

      // 駅IDでフィルタ
      query = query.in('station_id', params.station_cds);
      
      // 追加フィルタ
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
      locationInfo = { location_type: 'station', location_names: params.station_cds };
      
    } else if (params.line_ids && params.line_ids.length > 0) {
      // 路線検索（一時的に基本クエリを使用、駅経由）
      console.log('Using line search via stations:', params.line_ids);
      
      // まず路線に含まれる駅を取得
      const stationsResult = await supabase
        .from('stations')
        .select('station_cd')
        .in('line_cd', params.line_ids);
      
      const stationCodes = stationsResult.data?.map(s => s.station_cd) || [];
      
      if (stationCodes.length > 0) {
        let query = supabase
          .from('listings')
          .select(`
            id, title, body, category, price, created_at, user_id,
            rep_image_url, has_location, is_city_only, station_id, muni_id
          `, { count: 'exact' });

        query = query.in('station_id', stationCodes);
        
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
      } else {
        data = [];
        error = null;
      }
      locationInfo = { location_type: 'line', location_names: params.line_ids };
       
     } else if (params.muni_ids && params.muni_ids.length > 0) {
       // 市区町村検索（基本クエリを使用）
       console.log('Using municipality search with basic query:', params.muni_ids);
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

       query = query.in('muni_id', params.muni_ids);
       
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
       locationInfo = { location_type: 'municipality', location_names: params.muni_ids };
       
     } else if (params.pref_ids && params.pref_ids.length > 0) {
       // 都道府県検索（市区町村経由の基本クエリ）
       console.log('Using prefecture search via municipalities:', params.pref_ids);
       
       // まず都道府県に含まれる市区町村を取得
       const muniResult = await supabase
         .from('municipalities')
         .select('muni_id')
         .in('pref_id', params.pref_ids);
       
       const muniIds = muniResult.data?.map(m => m.muni_id) || [];
       
       if (muniIds.length > 0) {
         let query = supabase
           .from('listings')
           .select(`
             id, title, body, category, price, created_at, user_id,
             rep_image_url, has_location, is_city_only, station_id, muni_id
           `, { count: 'exact' });

         query = query.in('muni_id', muniIds);
         
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
       } else {
         data = [];
         error = null;
       }
       locationInfo = { location_type: 'prefecture', location_names: params.pref_ids };
      
    } else {
      // 基本的な検索（詳細ページと同じ方法で個別クエリを使用）
      console.log('Using basic search with separate queries');
      let query = supabase
        .from('listings')
        .select(`
          id, title, body, category, price, created_at, user_id,
          rep_image_url, has_location, is_city_only, station_id, muni_id
        `, { count: 'exact' });

      // フィルタ適用
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

      // ページング
      const result = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
       
       data = result.data || [];
       error = result.error;
       
       // デバッグ: JOINクエリの結果を確認
       console.log('JOIN query result:', JSON.stringify(data.slice(0, 1), null, 2));
    }

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        params: params
      });
      return NextResponse.json({
        success: false,
        message: `データベースエラー: ${error.message}`,
        error_details: {
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        listings: [],
        total: 0,
        page_info: { 
          current_page: Math.floor(offset / limit) + 1, 
          total_pages: 0, 
          has_next: false, 
          has_prev: false 
        },
        search_info: { 
          ...locationInfo, 
          query: params.q, 
          category: params.category 
        }
      }, { status: 500 });
    }

    if (!data || !Array.isArray(data)) {
      console.log('No data returned from search');
      return NextResponse.json({
        success: true,
        listings: [],
        total: 0,
        page_info: { 
          current_page: Math.floor(offset / limit) + 1, 
          total_pages: 0, 
          has_next: false, 
          has_prev: false 
        },
        search_info: { 
          ...locationInfo, 
          query: params.q, 
          category: params.category 
        }
      });
    }

    // JOINクエリの結果を詳細ページと同じ構造でマッピング
    const formattedListings: ListingCard[] = await Promise.all(data.map(async (item: any) => {
      // 駅情報の取得（詳細ページと同じ方法）
      let stationName = '';
      let lineName = '';
      let companyName = '';
      
      if (item.station_id) {
        const { data: stationData } = await supabase
          .from('stations')
          .select(`
            station_cd, station_name, line_cd,
            lines!inner (
              line_name, company_cd,
              companies!inner (
                company_name
              )
            )
          `)
          .eq('station_cd', item.station_id)
          .single();
        
        if (stationData) {
          stationName = stationData.station_name;
          lineName = (stationData.lines as any)?.line_name || '';
          companyName = (stationData.lines as any)?.companies?.company_name || '';
        }
      }
      
      // 市区町村・都道府県情報の取得（詳細ページと同じ方法）
      let muniName = '';
      let prefName = '';
      
      if (item.muni_id) {
        const { data: muniData } = await supabase
          .from('municipalities')
          .select(`
            muni_id, muni_name, pref_id,
            prefectures!inner (
              pref_name
            )
          `)
          .eq('muni_id', item.muni_id)
          .single();
        
        if (muniData) {
          muniName = muniData.muni_name;
          prefName = (muniData.prefectures as any)?.pref_name || '';
        }
      }
      
      // 基本情報
      const listing: ListingCard = {
        id: item.id,
        title: item.title,
        body: item.body ? item.body.substring(0, 150) + (item.body.length > 150 ? '...' : '') : '',
        category: item.category,
        price: item.price,
        currency: 'JPY',
        
        location: {
          has_location: item.has_location || false,
          is_city_only: item.is_city_only || false,
          station_name: stationName || undefined,
          muni_name: muniName,
          pref_name: prefName,
          line_name: lineName || undefined,
          company_name: companyName || undefined,
          distance_meters: item.distance_meters || undefined,
          distance_text: undefined
        },
        
        images: [],
        primary_image_url: item.rep_image_url || undefined,
        
        created_at: item.created_at,
        user_id: item.user_id,
        is_favorited: false
      };

      // 距離テキストの生成
      if (listing.location.distance_meters) {
        listing.location.distance_text = `${(listing.location.distance_meters / 1000).toFixed(1)}km`;
      }

      // 画像情報の設定
      if (item.rep_image_url) {
        listing.images.push({
          url: item.rep_image_url,
          alt: item.title,
          is_primary: true
        });
      }

      return listing;
    }));

    console.log(`Search completed: ${formattedListings.length} listings found`);

    // ページング情報計算
    const totalCount = formattedListings.length; // TODO: 実際の総数を取得
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      listings: formattedListings,
      total: totalCount,
      page_info: {
        current_page: currentPage,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1
      },
      search_info: {
        ...locationInfo,
        query: params.q,
        category: params.category
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      message: `サーバーエラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
      listings: [],
      total: 0,
      page_info: { current_page: 1, total_pages: 0, has_next: false, has_prev: false },
      search_info: { location_type: null, location_names: [], query: undefined, category: undefined }
    }, { status: 500 });
  }
}