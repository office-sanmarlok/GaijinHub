-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS set_location_from_station_point ON listings;
DROP FUNCTION IF EXISTS set_location_from_station_point();

-- pref_idカラムをlistingsテーブルに追加（存在しない場合）
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pref_id VARCHAR(2);

-- 外部キー制約を追加（存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'listings_pref_id_fkey'
    ) THEN
        ALTER TABLE listings 
        ADD CONSTRAINT listings_pref_id_fkey 
        FOREIGN KEY (pref_id) 
        REFERENCES prefectures(pref_id);
    END IF;
END $$;

-- 新しいトリガー関数を作成
CREATE OR REPLACE FUNCTION set_location_from_station_point()
RETURNS TRIGGER AS $$
DECLARE
    v_station_g_cd VARCHAR;
    v_lat NUMERIC;
    v_lon NUMERIC;
    v_muni_id VARCHAR;
    v_pref_id VARCHAR;
BEGIN
  -- has_locationがTRUEかつstation_idが設定されている場合
  IF NEW.has_location = TRUE AND NEW.station_id IS NOT NULL THEN
    -- stationsテーブルから全ての必要な情報を取得
    SELECT 
      s.station_g_cd,
      s.lat,
      s.lon,
      s.muni_id,
      SUBSTRING(s.muni_id FROM 1 FOR 2)
    INTO 
      v_station_g_cd,
      v_lat,
      v_lon,
      v_muni_id,
      v_pref_id
    FROM stations s
    WHERE s.station_cd = NEW.station_id
    LIMIT 1;
    
    -- 取得した値を設定
    IF v_station_g_cd IS NOT NULL THEN
      NEW.station_g_cd := v_station_g_cd;
    END IF;
    
    IF v_lat IS NOT NULL AND v_lon IS NOT NULL THEN
      NEW.lat := v_lat;
      NEW.lng := v_lon;
      NEW.point := ST_SetSRID(ST_MakePoint(v_lon, v_lat), 4326);
    END IF;
    
    IF v_muni_id IS NOT NULL THEN
      NEW.muni_id := v_muni_id;
    END IF;
    
    IF v_pref_id IS NOT NULL THEN
      NEW.pref_id := v_pref_id;
    END IF;
    
  -- station_g_cdが直接設定されている場合（将来の拡張用）
  ELSIF NEW.has_location = TRUE AND NEW.station_g_cd IS NOT NULL THEN
    -- station_groupsテーブルから情報を取得
    SELECT 
      sg.lat,
      sg.lng,
      sg.muni_id,
      sg.pref_id
    INTO 
      v_lat,
      v_lon,
      v_muni_id,
      v_pref_id
    FROM station_groups sg
    WHERE sg.station_g_cd = NEW.station_g_cd
    LIMIT 1;
    
    -- 取得した値を設定
    IF v_lat IS NOT NULL AND v_lon IS NOT NULL THEN
      NEW.lat := v_lat;
      NEW.lng := v_lon;
      NEW.point := ST_SetSRID(ST_MakePoint(v_lon, v_lat), 4326);
    END IF;
    
    IF v_muni_id IS NOT NULL THEN
      NEW.muni_id := v_muni_id;
    END IF;
    
    IF v_pref_id IS NOT NULL THEN
      NEW.pref_id := v_pref_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新しいトリガーを作成
CREATE TRIGGER set_location_from_station_point
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION set_location_from_station_point();

-- コメントを追加
COMMENT ON FUNCTION set_location_from_station_point() IS 
'リスティング作成/更新時に駅情報から位置情報を自動設定するトリガー関数。
station_idが設定されている場合、以下を自動的に取得・設定します：
- station_g_cd: 駅グループコード
- lat/lng: 座標
- point: PostGIS地理情報
- muni_id: 市区町村ID
- pref_id: 都道府県ID（muni_idの先頭2桁）';