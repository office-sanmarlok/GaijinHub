-- search_listings関数を更新して翻訳データを含めるようにする
CREATE OR REPLACE FUNCTION public.search_listings(
  p_q text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_pref_ids text[] DEFAULT NULL::text[],
  p_muni_ids text[] DEFAULT NULL::text[],
  p_station_g_cds text[] DEFAULT NULL::text[],
  p_line_ids text[] DEFAULT NULL::text[],
  p_min_price numeric DEFAULT NULL::numeric,
  p_max_price numeric DEFAULT NULL::numeric,
  p_user_lat double precision DEFAULT NULL::double precision,
  p_user_lng double precision DEFAULT NULL::double precision,
  p_max_distance_meters integer DEFAULT 50000,
  p_sort text DEFAULT 'newest'::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_language text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  title character varying,
  body text,
  category character varying,
  price numeric,
  original_language character varying,
  rep_image_url text,
  user_id uuid,
  created_at timestamp with time zone,
  location json,
  distance_meters double precision,
  total_count bigint,
  translation json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sql_query text;
  sort_clause text;
  distance_select text;
  distance_where text;
  distance_sort text;
  total_count_query text;
  total_count bigint;
BEGIN
  -- 基本となるSELECT文を構築
  sql_query := '
    SELECT
      l.id,
      l.title::character varying,
      l.body,
      l.category::character varying,
      l.price,
      l.original_language::character varying,
      l.rep_image_url,
      l.user_id,
      l.created_at,
      l.station_g_cd,
      l.has_location,
      l.station_id,
      l.pref_id,
      l.muni_id,
      l.point
    FROM listings l
    WHERE 1=1';

  -- テキスト検索（翻訳も含めて検索）
  IF p_q IS NOT NULL AND trim(p_q) != '' THEN
    IF p_language IS NOT NULL THEN
      sql_query := sql_query || ' AND (
        l.title ILIKE ' || quote_literal('%' || p_q || '%') || '
        OR l.body ILIKE ' || quote_literal('%' || p_q || '%') || '
        OR EXISTS (
          SELECT 1 FROM listing_translations lt
          WHERE lt.listing_id = l.id
          AND lt.locale = ' || quote_literal(p_language) || '
          AND (
            lt.title ILIKE ' || quote_literal('%' || p_q || '%') || '
            OR lt.body ILIKE ' || quote_literal('%' || p_q || '%') || '
          )
        )
      )';
    ELSE
      sql_query := sql_query || ' AND (
        l.title ILIKE ' || quote_literal('%' || p_q || '%') || '
        OR l.body ILIKE ' || quote_literal('%' || p_q || '%') || '
      )';
    END IF;
  END IF;

  -- カテゴリーフィルタ
  IF p_category IS NOT NULL THEN
    sql_query := sql_query || ' AND l.category = ' || quote_literal(p_category);
  END IF;

  -- 言語フィルタを削除（すべての投稿を表示）
  -- IF p_language IS NOT NULL THEN
  --   sql_query := sql_query || ' AND l.original_language = ' || quote_literal(p_language);
  -- END IF;

  -- 場所フィルタ
  IF p_station_g_cds IS NOT NULL AND array_length(p_station_g_cds, 1) > 0 THEN
    sql_query := sql_query || ' AND l.station_g_cd = ANY(' || quote_literal(p_station_g_cds) || ')';
  ELSIF p_line_ids IS NOT NULL AND array_length(p_line_ids, 1) > 0 THEN
    sql_query := sql_query || ' AND EXISTS (
      SELECT 1 FROM stations s
      WHERE s.station_cd = l.station_id
      AND s.line_cd = ANY(' || quote_literal(p_line_ids) || ')
    )';
  ELSIF p_muni_ids IS NOT NULL AND array_length(p_muni_ids, 1) > 0 THEN
    sql_query := sql_query || ' AND l.muni_id = ANY(' || quote_literal(p_muni_ids) || ')';
  ELSIF p_pref_ids IS NOT NULL AND array_length(p_pref_ids, 1) > 0 THEN
    sql_query := sql_query || ' AND l.pref_id = ANY(' || quote_literal(p_pref_ids) || ')';
  END IF;

  -- 価格フィルタ
  IF p_min_price IS NOT NULL THEN
    sql_query := sql_query || ' AND l.price >= ' || p_min_price;
  END IF;
  IF p_max_price IS NOT NULL THEN
    sql_query := sql_query || ' AND l.price <= ' || p_max_price;
  END IF;

  -- 距離フィルタと距離計算の準備
  IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
    distance_select := ', 
      CASE 
        WHEN l.point IS NOT NULL THEN 
          ROUND(ST_DistanceSphere(l.point, ST_MakePoint(' || p_user_lng || ', ' || p_user_lat || ')))
        ELSE NULL
      END as distance_meters';
    
    IF p_max_distance_meters IS NOT NULL THEN
      distance_where := ' AND (l.point IS NULL OR ST_DistanceSphere(l.point, ST_MakePoint(' || p_user_lng || ', ' || p_user_lat || ')) <= ' || p_max_distance_meters || ')';
      sql_query := sql_query || distance_where;
    END IF;
  ELSE
    distance_select := ', NULL::double precision as distance_meters';
  END IF;

  -- メインクエリ（翻訳を含む）
  sql_query := '
    SELECT 
      l.id,
      l.title,
      l.body,
      l.category,
      l.price,
      l.original_language,
      l.rep_image_url,
      l.user_id,
      l.created_at,
      json_build_object(
        ''has_location'', l.has_location,
        ''station_g_cd'', l.station_g_cd,
        ''station_g_name'', sg.station_name,
        ''station_g_name_r'', sg.station_name_r,
        ''station_g_name_h'', sg.station_name_h,
        ''station_cd'', s.station_cd,
        ''station_name'', s.station_name,
        ''station_name_r'', s.station_name_r,
        ''station_name_h'', s.station_name_h,
        ''pref_id'', COALESCE(sg.pref_id, m.pref_id, l.pref_id),
        ''pref_name'', p.pref_name,
        ''pref_name_r'', p.pref_name_r,
        ''pref_name_h'', p.pref_name_h,
        ''muni_id'', COALESCE(sg.muni_id, l.muni_id),
        ''muni_name'', m.muni_name,
        ''muni_name_r'', m.muni_name_r,
        ''muni_name_h'', m.muni_name_h
      ) as location,
      CASE 
        WHEN ' || COALESCE(quote_literal(p_language), 'NULL') || ' IS NOT NULL THEN
          (SELECT row_to_json(t) FROM (
            SELECT 
              lt.title,
              lt.body,
              lt.is_auto_translated
            FROM listing_translations lt
            WHERE lt.listing_id = l.id
            AND lt.locale = ' || COALESCE(quote_literal(p_language), 'NULL') || '
            LIMIT 1
          ) t)
        ELSE NULL
      END as translation
      ' || distance_select || '
    FROM (' || sql_query || ') l
    LEFT JOIN stations s ON l.station_id = s.station_cd
    LEFT JOIN station_groups sg ON l.station_g_cd = sg.station_g_cd
    LEFT JOIN municipalities m ON COALESCE(sg.muni_id, l.muni_id) = m.muni_id
    LEFT JOIN prefectures p ON COALESCE(sg.pref_id, m.pref_id, l.pref_id) = p.pref_id';

  -- ソート条件
  CASE p_sort
    WHEN 'oldest' THEN sort_clause := ' ORDER BY l.created_at ASC';
    WHEN 'price_asc' THEN sort_clause := ' ORDER BY l.price ASC NULLS LAST, l.created_at DESC';
    WHEN 'price_desc' THEN sort_clause := ' ORDER BY l.price DESC NULLS LAST, l.created_at DESC';
    WHEN 'closest' THEN 
      IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
        sort_clause := ' ORDER BY distance_meters ASC NULLS LAST, l.created_at DESC';
      ELSE
        sort_clause := ' ORDER BY l.created_at DESC';
      END IF;
    ELSE sort_clause := ' ORDER BY l.created_at DESC';
  END CASE;

  sql_query := sql_query || sort_clause;

  -- 総件数を取得
  total_count_query := 'SELECT COUNT(*) FROM (' || sql_query || ') as count_query';
  EXECUTE total_count_query INTO total_count;

  -- LIMIT/OFFSET追加
  sql_query := sql_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- 最終的なクエリを実行
  RETURN QUERY EXECUTE 'SELECT *, ' || total_count || '::bigint as total_count FROM (' || sql_query || ') as final_query';
END;
$function$;