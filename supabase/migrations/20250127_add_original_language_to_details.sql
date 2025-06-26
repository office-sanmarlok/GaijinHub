-- Add original_language to get_listing_details RPC
CREATE OR REPLACE FUNCTION public.get_listing_details(p_listing_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category text,
  title varchar,
  body text,
  price numeric,
  currency varchar,
  lat float8,
  lng float8,
  station_g_cd varchar,
  muni_id varchar,
  is_city_only boolean,
  has_location boolean,
  rep_image_url text,
  original_language varchar,
  created_at timestamptz,
  updated_at timestamptz,
  images jsonb,
  station jsonb,
  municipality jsonb,
  user_info jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.category,
    l.title,
    l.body,
    l.price,
    l.currency,
    l.lat,
    l.lng,
    l.station_g_cd,
    l.muni_id,
    l.is_city_only,
    l.has_location,
    l.rep_image_url,
    l.original_language,
    l.created_at,
    l.updated_at,
    -- Images
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', li.id,
          'url', li.url,
          'alt', li.alt,
          'order_index', li.order_index,
          'is_primary', li.is_primary
        ) ORDER BY li.order_index
      ) FROM listing_images li WHERE li.listing_id = l.id),
      '[]'::jsonb
    ) as images,
    -- Station
    CASE 
      WHEN l.station_g_cd IS NOT NULL THEN
        (SELECT jsonb_build_object(
          'station_g_cd', sg.station_g_cd,
          'station_g_name', sg.station_name,
          'station_g_name_r', sg.station_name_r,
          'station_g_name_h', sg.station_name_h,
          'lat', sg.lat,
          'lng', sg.lon,
          'stations', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'station_cd', s.station_cd,
                'station_name', s.station_name,
                'station_name_r', s.station_name_r,
                'station_name_h', s.station_name_h,
                'line_cd', s.line_cd,
                'line_name', ln.line_name,
                'line_name_r', ln.line_name_r,
                'line_name_h', ln.line_name_h,
                'company_name', c.company_name,
                'company_name_r', c.company_name_r,
                'company_name_h', c.company_name_h
              ) ORDER BY s.e_sort
            ) FROM stations s 
            LEFT JOIN lines ln ON s.line_cd = ln.line_cd
            LEFT JOIN companies c ON ln.company_cd = c.company_cd
            WHERE s.station_g_cd = l.station_g_cd AND s.e_status = 0),
            '[]'::jsonb
          )
        ) FROM station_groups sg WHERE sg.station_g_cd = l.station_g_cd)
      ELSE NULL
    END as station,
    -- Municipality
    CASE 
      WHEN l.muni_id IS NOT NULL THEN
        (SELECT jsonb_build_object(
          'muni_id', m.muni_id,
          'muni_name', m.muni_name,
          'muni_name_r', m.muni_name_r,
          'muni_name_h', m.muni_name_h,
          'pref_id', m.pref_id,
          'pref_name', p.pref_name,
          'pref_name_r', p.pref_name_r,
          'pref_name_h', p.pref_name_h
        ) FROM municipalities m 
        LEFT JOIN prefectures p ON m.pref_id = p.pref_id
        WHERE m.muni_id = l.muni_id)
      ELSE NULL
    END as municipality,
    -- User info
    (SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'created_at', u.created_at
    ) FROM auth.users u WHERE u.id = l.user_id)
    as user_info
  FROM listings l
  WHERE l.id = p_listing_id;
END;
$$;