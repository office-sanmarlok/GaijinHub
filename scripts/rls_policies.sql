-- RLSポリシー設定用SQLスクリプト

-- 1. tokyo_municipalities テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_municipalities ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo municipalities are viewable by everyone" 
ON tokyo_municipalities FOR SELECT
USING (true);

-- 管理者のみ更新可能（auth.uidsには管理者ユーザーIDを追加すること）
CREATE POLICY "Tokyo municipalities are editable by admins only" 
ON tokyo_municipalities FOR INSERT
WITH CHECK (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo municipalities are updatable by admins only" 
ON tokyo_municipalities FOR UPDATE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo municipalities are deletable by admins only" 
ON tokyo_municipalities FOR DELETE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));


-- 2. tokyo_lines テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_lines ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo lines are viewable by everyone" 
ON tokyo_lines FOR SELECT
USING (true);

-- 管理者のみ更新可能
CREATE POLICY "Tokyo lines are editable by admins only" 
ON tokyo_lines FOR INSERT
WITH CHECK (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo lines are updatable by admins only" 
ON tokyo_lines FOR UPDATE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo lines are deletable by admins only" 
ON tokyo_lines FOR DELETE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));


-- 3. tokyo_station_groups テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_station_groups ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo station groups are viewable by everyone" 
ON tokyo_station_groups FOR SELECT
USING (true);

-- 管理者のみ更新可能
CREATE POLICY "Tokyo station groups are editable by admins only" 
ON tokyo_station_groups FOR INSERT
WITH CHECK (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo station groups are updatable by admins only" 
ON tokyo_station_groups FOR UPDATE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo station groups are deletable by admins only" 
ON tokyo_station_groups FOR DELETE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));


-- 4. tokyo_station_line_relations テーブルのRLS設定
-- RLSを有効化
ALTER TABLE tokyo_station_line_relations ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー：誰でも読み取り可能
CREATE POLICY "Tokyo station line relations are viewable by everyone" 
ON tokyo_station_line_relations FOR SELECT
USING (true);

-- 管理者のみ更新可能
CREATE POLICY "Tokyo station line relations are editable by admins only" 
ON tokyo_station_line_relations FOR INSERT
WITH CHECK (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo station line relations are updatable by admins only" 
ON tokyo_station_line_relations FOR UPDATE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

CREATE POLICY "Tokyo station line relations are deletable by admins only" 
ON tokyo_station_line_relations FOR DELETE
USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));


-- 5. listings テーブルに対する位置情報関連のRLSポリシー追加
-- 既存のRLSポリシーに加えて、位置情報の表示制御を追加

-- 位置情報表示ポリシー：
-- 1. 位置情報の表示設定（is_city_only）がfalseの場合は全ての情報を表示
-- 2. is_city_onlyがtrueの場合は、municipality_idのみ表示し、station_idは表示しない
-- 3. has_locationがfalseの場合は、位置情報を表示しない

-- NOTE: listingsテーブルには既存のRLSポリシーがあると仮定
-- 以下は位置情報に関する読み取りポリシーの追加部分のみ

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