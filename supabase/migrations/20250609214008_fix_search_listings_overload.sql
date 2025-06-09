-- まず、古い（引数が少ない）バージョンの関数を削除します。
-- これにより、関数オーバーロードの曖昧さを解消します。
DROP FUNCTION IF EXISTS public.search_listings_by_prefecture(p_pref_ids text[], p_items_per_page integer, p_page_number integer);

-- エラーメッセージの指示に従い、戻り値の型が異なる既存の関数も削除します。
DROP FUNCTION IF EXISTS public.search_listings_by_prefecture(text[], text, text, integer, integer);

-- 次に、ソート機能を含む最新バージョンの関数を定義します。
-- CREATE OR REPLACE FUNCTION を使用することで、安全に作成または更新できます。
CREATE OR REPLACE FUNCTION public.search_listings_by_prefecture(
    p_pref_ids text[],
    p_sort_by text,
    p_sort_order text,
    p_items_per_page integer,
    p_page_number integer
)
RETURNS TABLE(
    listing_id text,
    title text,
    price numeric,
    address text,
    images text[],
    created_at text,
    updated_at text,
    is_published boolean,
    user_id text,
    station_id numeric,
    station_name text,
    line_id numeric,
    line_name text,
    muni_id numeric,
    municipality_name text,
    pref_id text,
    prefecture_name text,
    station_point geometry,
    has_location boolean,
    is_city_only boolean,
    total_count numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH listings_in_prefs AS (
        SELECT
            l.id AS listing_id,
            l.title,
            l.price,
            COALESCE(s.address, '') AS address,
            CASE 
                WHEN l.rep_image_url IS NOT NULL THEN ARRAY[l.rep_image_url]
                ELSE ARRAY[]::TEXT[]
            END AS images,
            l.created_at::text AS created_at,
            l.created_at::text AS updated_at,
            TRUE AS is_published,
            l.user_id,
            CASE WHEN COALESCE(l.is_city_only, FALSE) THEN NULL ELSE l.station_id::numeric END AS station_id,
            CASE WHEN COALESCE(l.is_city_only, FALSE) THEN NULL ELSE s.station_name END AS station_name,
            CASE WHEN COALESCE(l.is_city_only, FALSE) THEN NULL ELSE s.line_cd::numeric END AS line_id,
            CASE WHEN COALESCE(l.is_city_only, FALSE) THEN NULL ELSE li.line_name END AS line_name,
            m.muni_id::numeric AS muni_id,
            m.muni_name AS municipality_name,
            p.pref_id AS pref_id,
            p.pref_name AS prefecture_name,
            CASE WHEN COALESCE(l.is_city_only, FALSE) THEN NULL ELSE s.point::geometry END AS station_point,
            COALESCE(l.has_location, FALSE) AS has_location,
            COALESCE(l.is_city_only, FALSE) AS is_city_only
        FROM
            listings l
        JOIN
            municipalities m ON l.muni_id = m.muni_id
        JOIN
            prefectures p ON m.pref_id = p.pref_id
        LEFT JOIN
            stations s ON l.station_id = s.station_cd AND NOT COALESCE(l.is_city_only, FALSE)
        LEFT JOIN
            lines li ON s.line_cd = li.line_id AND NOT COALESCE(l.is_city_only, FALSE)
        WHERE
            p.pref_id = ANY(p_pref_ids)
    ),
    counted_listings AS (
        SELECT 
            *,
            COUNT(*) OVER() AS total_count 
        FROM listings_in_prefs
    )
    SELECT
        cl.listing_id::text,
        cl.title::text,
        cl.price,
        cl.address::text,
        cl.images,
        cl.created_at,
        cl.updated_at,
        cl.is_published,
        cl.user_id::text,
        cl.station_id,
        cl.station_name::text,
        cl.line_id,
        cl.line_name::text,
        cl.muni_id,
        cl.municipality_name::text,
        cl.pref_id::text,
        cl.prefecture_name::text,
        cl.station_point,
        cl.has_location,
        cl.is_city_only,
        cl.total_count::numeric
    FROM counted_listings cl
    ORDER BY
        CASE
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN cl.created_at END DESC,
        CASE
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN cl.created_at END ASC,
        CASE
            WHEN p_sort_by = 'price' AND p_sort_order = 'DESC' THEN cl.price END DESC,
        CASE
            WHEN p_sort_by = 'price' AND p_sort_order = 'ASC' THEN cl.price END ASC,
        CASE
            WHEN p_sort_by = 'updated_at' AND p_sort_order = 'DESC' THEN cl.updated_at END DESC,
        CASE
            WHEN p_sort_by = 'updated_at' AND p_sort_order = 'ASC' THEN cl.updated_at END ASC
    LIMIT p_items_per_page
    OFFSET (p_page_number - 1) * p_items_per_page;
END;
$$;
