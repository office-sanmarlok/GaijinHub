-- Update get_station_groups_with_details to include romaji names for municipalities and prefectures
DROP FUNCTION IF EXISTS public.get_station_groups_with_details(integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_station_groups_with_details(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_keyword text DEFAULT NULL
)
RETURNS TABLE (
  station_g_cd varchar,
  station_name varchar,
  station_name_h varchar,
  station_name_r varchar,
  lat numeric,
  lng numeric,
  address text,
  muni_name varchar,
  muni_name_r varchar,
  pref_name varchar,
  pref_name_r varchar,
  lines jsonb,
  listing_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sg.station_g_cd,
    sg.station_name,
    sg.station_name_h,
    sg.station_name_r,
    sg.lat,
    sg.lng,
    sg.address,
    m.muni_name,
    m.muni_name_r,
    p.pref_name,
    p.pref_name_r,
    -- 路線情報を集約
    COALESCE(
      (SELECT jsonb_agg(DISTINCT
        jsonb_build_object(
          'line_id', l.line_id,
          'line_name', l.line_name,
          'line_name_h', l.line_name_h,
          'line_name_r', l.line_name_r,
          'company_cd', c.company_cd,
          'company_name', c.company_name,
          'company_name_r', c.company_name_r
        )
      )
      FROM stations s
      JOIN lines l ON s.line_cd = l.line_id
      JOIN companies c ON l.company_cd = c.company_cd
      WHERE s.station_g_cd = sg.station_g_cd
        AND s.e_status = 0),
      '[]'::jsonb
    ) as lines_info,
    -- その駅グループに紐づくリスティング数
    (SELECT COUNT(*)
     FROM listings
     WHERE station_g_cd = sg.station_g_cd) as listing_count
  FROM station_groups sg
  JOIN municipalities m ON sg.muni_id = m.muni_id
  JOIN prefectures p ON sg.pref_id = p.pref_id
  WHERE (p_keyword IS NULL OR 
         sg.station_name ILIKE ('%' || p_keyword || '%') OR
         sg.station_name_h ILIKE ('%' || p_keyword || '%') OR
         sg.station_name_r ILIKE ('%' || p_keyword || '%'))
  ORDER BY sg.station_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;