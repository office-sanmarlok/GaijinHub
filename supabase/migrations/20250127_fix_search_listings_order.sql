-- Fix search_listings function - execute count query before building main query
CREATE OR REPLACE FUNCTION public.search_listings(
  p_q text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_station_g_cds text[] DEFAULT NULL,
  p_pref_ids text[] DEFAULT NULL,
  p_muni_ids text[] DEFAULT NULL,
  p_line_ids text[] DEFAULT NULL,
  p_min_price integer DEFAULT NULL,
  p_max_price integer DEFAULT NULL,
  p_user_lat float8 DEFAULT NULL,
  p_user_lng float8 DEFAULT NULL,
  p_max_distance_meters integer DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category text,
  title varchar,
  body text,
  price numeric,
  lat float8,
  lng float8,
  has_location boolean,
  rep_image_url text,
  original_language varchar,
  location jsonb,
  distance_meters float8,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_count bigint;
  v_query text;
  v_count_query text;
  v_where_clauses text[] := ARRAY[]::text[];
  v_order_by text;
  v_location_join text := '';
  v_distance_select text := '';
BEGIN
  -- Build location joins if needed
  IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
    v_distance_select := ', ST_Distance(sg.point::geography, ST_MakePoint(' || p_user_lng || ', ' || p_user_lat || ')::geography) as distance';
    v_location_join := 'LEFT JOIN station_groups sg ON l.station_g_cd = sg.station_g_cd';
  ELSE
    -- Always include distance column as NULL when no location provided
    v_distance_select := ', NULL::float8 as distance';
  END IF;

  -- Build WHERE clauses
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_where_clauses := array_append(v_where_clauses, 
      '(l.title ILIKE ''%'' || ' || quote_literal(p_q) || ' || ''%'' OR l.body ILIKE ''%'' || ' || quote_literal(p_q) || ' || ''%'')');
  END IF;

  IF p_category IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, 'l.category = ' || quote_literal(p_category));
  END IF;

  -- Location filters
  IF p_station_g_cds IS NOT NULL AND array_length(p_station_g_cds, 1) > 0 THEN
    v_where_clauses := array_append(v_where_clauses, 'l.station_g_cd = ANY(' || quote_literal(p_station_g_cds) || ')');
  END IF;

  IF p_line_ids IS NOT NULL AND array_length(p_line_ids, 1) > 0 THEN
    -- Add sg join if not already present
    IF v_location_join NOT LIKE '%station_groups sg%' THEN
      v_location_join := v_location_join || ' LEFT JOIN station_groups sg ON l.station_g_cd = sg.station_g_cd';
    END IF;
    v_location_join := v_location_join || ' LEFT JOIN stations s ON sg.station_g_cd = s.station_g_cd';
    v_where_clauses := array_append(v_where_clauses, 's.line_cd = ANY(' || quote_literal(p_line_ids) || ')');
  END IF;

  IF p_muni_ids IS NOT NULL AND array_length(p_muni_ids, 1) > 0 THEN
    v_where_clauses := array_append(v_where_clauses, 'l.muni_id = ANY(' || quote_literal(p_muni_ids) || ')');
  END IF;

  IF p_pref_ids IS NOT NULL AND array_length(p_pref_ids, 1) > 0 THEN
    IF v_location_join NOT LIKE '%municipalities m%' THEN
      v_location_join := v_location_join || ' LEFT JOIN municipalities m ON l.muni_id = m.muni_id';
    END IF;
    v_where_clauses := array_append(v_where_clauses, 'm.pref_id = ANY(' || quote_literal(p_pref_ids) || ')');
  END IF;

  -- Price filters
  IF p_min_price IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, 'l.price >= ' || p_min_price);
  END IF;

  IF p_max_price IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, 'l.price <= ' || p_max_price);
  END IF;

  -- Distance filter
  IF p_max_distance_meters IS NOT NULL AND p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
    -- Add sg join if not already present
    IF v_location_join NOT LIKE '%station_groups sg%' THEN
      v_location_join := v_location_join || ' LEFT JOIN station_groups sg ON l.station_g_cd = sg.station_g_cd';
    END IF;
    v_where_clauses := array_append(v_where_clauses, 
      'ST_DWithin(sg.point::geography, ST_MakePoint(' || p_user_lng || ', ' || p_user_lat || ')::geography, ' || p_max_distance_meters || ')');
  END IF;

  -- Build ORDER BY
  CASE p_sort
    WHEN 'newest' THEN v_order_by := 'created_at DESC';
    WHEN 'oldest' THEN v_order_by := 'created_at ASC';
    WHEN 'price_asc' THEN v_order_by := 'COALESCE(price, 999999999) ASC, created_at DESC';
    WHEN 'price_desc' THEN v_order_by := 'COALESCE(price, 0) DESC, created_at DESC';
    WHEN 'closest' THEN 
      IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
        v_order_by := 'distance ASC NULLS LAST, created_at DESC';
      ELSE
        v_order_by := 'created_at DESC';
      END IF;
    ELSE v_order_by := 'created_at DESC';
  END CASE;

  -- Build count query first
  v_count_query := 'SELECT COUNT(DISTINCT l.id) 
    FROM listings l
    ' || v_location_join;

  IF array_length(v_where_clauses, 1) > 0 THEN
    v_count_query := v_count_query || ' WHERE ' || array_to_string(v_where_clauses, ' AND ');
  END IF;

  -- Get total count
  EXECUTE v_count_query INTO v_total_count;

  -- Build the main query
  v_query := 'WITH filtered_listings AS (
    SELECT DISTINCT ON (l.id)
      l.*,
      sg2.station_name as station_g_name,
      sg2.station_name_r as station_g_name_r,
      sg2.station_name_h as station_g_name_h,
      s2.station_name,
      s2.station_name_r,
      s2.station_name_h,
      m2.muni_name,
      m2.muni_name_r,
      m2.muni_name_h,
      p.pref_name,
      p.pref_name_r,
      p.pref_name_h' || v_distance_select || '
    FROM listings l
    ' || v_location_join || '
    LEFT JOIN station_groups sg2 ON l.station_g_cd = sg2.station_g_cd
    LEFT JOIN stations s2 ON l.station_g_cd = s2.station_g_cd AND s2.e_status = ''0''
    LEFT JOIN municipalities m2 ON l.muni_id = m2.muni_id
    LEFT JOIN prefectures p ON m2.pref_id = p.pref_id';

  IF array_length(v_where_clauses, 1) > 0 THEN
    v_query := v_query || ' WHERE ' || array_to_string(v_where_clauses, ' AND ');
  END IF;

  -- DISTINCT ON requires ORDER BY with the same column
  v_query := v_query || ' ORDER BY l.id)
  SELECT 
    id,
    user_id,
    category,
    title,
    body,
    price,
    lat,
    lng,
    has_location,
    rep_image_url,
    original_language,
    jsonb_build_object(
      ''has_location'', has_location,
      ''station_g_cd'', station_g_cd,
      ''station_g_name'', station_g_name,
      ''station_g_name_r'', station_g_name_r,
      ''station_g_name_h'', station_g_name_h,
      ''station_name'', station_name,
      ''station_name_r'', station_name_r,
      ''station_name_h'', station_name_h,
      ''pref_name'', pref_name,
      ''pref_name_r'', pref_name_r,
      ''pref_name_h'', pref_name_h,
      ''muni_name'', muni_name,
      ''muni_name_r'', muni_name_r,
      ''muni_name_h'', muni_name_h
    ) as location,
    distance as distance_meters,
    created_at,
    ' || v_total_count || '::bigint as total_count
  FROM filtered_listings
  ORDER BY ' || v_order_by || '
  LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Return results with pagination
  RETURN QUERY EXECUTE v_query;
END;
$$;