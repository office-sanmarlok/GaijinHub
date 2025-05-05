-- 簡略化されたRLSポリシー設定用SQLスクリプト
-- 読み取り専用のポリシーのみを設定

-- 1. tokyo_municipalities テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_municipalities ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo municipalities are viewable by everyone" 
ON tokyo_municipalities FOR SELECT
USING (true);

-- 2. tokyo_lines テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_lines ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo lines are viewable by everyone" 
ON tokyo_lines FOR SELECT
USING (true);

-- 3. tokyo_station_groups テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_station_groups ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo station groups are viewable by everyone" 
ON tokyo_station_groups FOR SELECT
USING (true);

-- 4. tokyo_station_line_relations テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_station_line_relations ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo station line relations are viewable by everyone" 
ON tokyo_station_line_relations FOR SELECT
USING (true);

-- 5. listings テーブルに対する位置情報関連のRLSポリシー追加（既存のテーブル向け）
-- リスティングテーブルには既存のRLSポリシーがあると仮定
-- もし既存のポリシーがなければ、以下のポリシーも追加する必要があります

-- リスティングの読み取りポリシー（位置情報関連）
CREATE POLICY "Listings location info is viewable based on privacy settings" 
ON listings FOR SELECT
USING (
  -- 自分のリスティングならすべて見える
  auth.uid() = user_id
  OR
  -- 公開リスティングの場合、位置情報の公開設定に従う
  (
    -- is_city_onlyがtrueなら市区町村までは見える
    is_city_only = true
    OR
    -- is_city_onlyがfalseなら全情報が見える
    is_city_only = false
  )
); 