# データベーススキーマ仕様書

## 概要
このデータベースは、物件リスティングサービス（GaijinHub）のためのスキーマです。主に以下の機能をサポートしています：
- 物件情報の管理
- ユーザーのお気に入り機能
- 日本の地理情報（都道府県、市区町村、駅、路線）
- 画像管理
- 空間検索機能

## テーブル構造

### 1. avatars（アバター）
ユーザーのプロフィール画像を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| user_id | string | PRIMARY KEY | ユーザーID |
| avatar_path | string \| null | | アバター画像のパス |

### 2. companies（鉄道会社）
鉄道会社の情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| company_cd | string | PRIMARY KEY | 会社コード |
| company_name | string | NOT NULL | 会社名 |
| company_name_h | string \| null | | 会社名（ひらがな） |
| company_name_r | string \| null | | 会社名（ローマ字） |
| company_type | string \| null | | 会社種別 |
| created_at | string \| null | | 作成日時 |
| e_status | string \| null | | ステータス |
| rr_cd | string \| null | | 鉄道コード |

### 3. favorites（お気に入り）
ユーザーが物件をお気に入りに追加した情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | string | PRIMARY KEY | お気に入りID |
| user_id | string | NOT NULL | ユーザーID |
| listing_id | string | NOT NULL, FK | 物件ID |
| created_at | string | | 作成日時 |

**外部キー制約:**
- `listing_id` → `listings.id`

### 4. images（画像）
物件に関連する画像を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | string | PRIMARY KEY | 画像ID |
| listing_id | string | NOT NULL, FK | 物件ID |
| path | string | NOT NULL | 画像パス |
| order | number | NOT NULL | 表示順序 |

**外部キー制約:**
- `listing_id` → `listings.id`

### 5. lines（路線）
鉄道路線の情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| line_id | string | PRIMARY KEY | 路線ID |
| company_cd | string | NOT NULL, FK | 会社コード |
| line_name | string | NOT NULL | 路線名 |
| line_name_h | string \| null | | 路線名（ひらがな） |
| line_name_r | string \| null | | 路線名（ローマ字） |
| lat | number \| null | | 緯度 |
| lon | number \| null | | 経度 |
| zoom | number \| null | | ズームレベル |
| created_at | string \| null | | 作成日時 |
| e_status | string \| null | | ステータス |

**外部キー制約:**
- `company_cd` → `companies.company_cd`

### 6. listings（物件）
メインの物件情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | string | PRIMARY KEY | 物件ID |
| user_id | string | NOT NULL | 投稿者のユーザーID |
| title | string | NOT NULL | 物件タイトル |
| body | string | NOT NULL | 物件詳細 |
| body_en | string \| null | | 物件詳細（英語） |
| body_zh | string \| null | | 物件詳細（中国語） |
| category | string | NOT NULL | カテゴリ |
| price | number \| null | | 価格 |
| lat | number \| null | | 緯度 |
| lng | number \| null | | 経度 |
| point | unknown \| null | | PostGIS地理座標点 |
| station_id | string \| null | FK | 最寄り駅ID |
| muni_id | string \| null | FK | 市区町村ID |
| rep_image_url | string \| null | | 代表画像URL |
| has_location | boolean \| null | | 位置情報有無 |
| is_city_only | boolean \| null | | 市レベルのみの住所表示 |
| created_at | string \| null | | 作成日時 |

**外部キー制約:**
- `station_id` → `stations.station_cd`
- `muni_id` → `municipalities.muni_id`

### 7. municipalities（市区町村）
市区町村の情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| muni_id | string | PRIMARY KEY | 市区町村ID |
| pref_id | string | NOT NULL, FK | 都道府県ID |
| muni_name | string | NOT NULL | 市区町村名 |
| muni_name_h | string \| null | | 市区町村名（ひらがな） |
| muni_name_r | string \| null | | 市区町村名（ローマ字） |
| created_at | string \| null | | 作成日時 |

**外部キー制約:**
- `pref_id` → `prefectures.pref_id`

### 8. prefectures（都道府県）
都道府県の情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| pref_id | string | PRIMARY KEY | 都道府県ID |
| pref_name | string | NOT NULL | 都道府県名 |
| pref_name_h | string \| null | | 都道府県名（ひらがな） |
| pref_name_r | string \| null | | 都道府県名（ローマ字） |
| created_at | string \| null | | 作成日時 |

### 9. station_connections（駅間接続）
駅と駅の接続関係を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | number | PRIMARY KEY | 接続ID |
| line_cd | string | NOT NULL, FK | 路線コード |
| station_cd1 | string | NOT NULL, FK | 駅コード1 |
| station_cd2 | string | NOT NULL, FK | 駅コード2 |
| created_at | string \| null | | 作成日時 |

**外部キー制約:**
- `line_cd` → `lines.line_id`
- `station_cd1` → `stations.station_cd`
- `station_cd2` → `stations.station_cd`

### 10. stations（駅）
駅の情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| station_cd | string | PRIMARY KEY | 駅コード |
| line_cd | string | NOT NULL, FK | 路線コード |
| pref_id | string | NOT NULL, FK | 都道府県ID |
| muni_id | string | NOT NULL, FK | 市区町村ID |
| station_name | string | NOT NULL | 駅名 |
| station_name_h | string \| null | | 駅名（ひらがな） |
| station_name_r | string \| null | | 駅名（ローマ字） |
| station_g_cd | string \| null | | 駅グループコード |
| address | string \| null | | 住所 |
| lat | number \| null | | 緯度 |
| lon | number \| null | | 経度 |
| point | unknown \| null | | PostGIS地理座標点 |
| created_at | string \| null | | 作成日時 |
| e_status | string \| null | | ステータス |

**外部キー制約:**
- `line_cd` → `lines.line_id`
- `pref_id` → `prefectures.pref_id`
- `muni_id` → `municipalities.muni_id`

## データベース関数（Stored Procedures）

### 1. 地理情報・検索関数

#### `generate_point(lat: number, lng: number)`
緯度・経度からPostGIS地理座標点を生成します。

#### `search_listings_by_distance()`
指定した座標からの距離で物件を検索します。
- **パラメータ1**: `p_lat`, `p_lng`, `p_max_distance`, `p_limit`, `p_offset`, `p_category`
- **パラメータ2**: `p_lat`, `p_lng`, `p_max_distance_meters`, `p_pref_id`, `p_muni_id`, `p_category`, `p_price_min`, `p_price_max`, `p_limit`, `p_offset`

#### `search_listings_by_line()`
指定した路線沿いの物件を検索します。
- **パラメータ**: `p_line_ids`, `p_search_radius_meters`, `p_category`, `p_price_min`, `p_price_max`, `p_limit`, `p_offset`

#### `search_listings_by_station()`
指定した駅周辺の物件を検索します。
- **パラメータ**: `p_station_cds`, `p_search_radius_meters`, `p_category`, `p_price_min`, `p_price_max`, `p_limit`, `p_offset`

#### `search_listings_by_municipality()`
指定した市区町村の物件を検索します。
- **パラメータ**: `p_muni_ids`, `p_category`, `p_price_min`, `p_price_max`, `p_order_by`, `p_limit`, `p_offset`

#### `search_listings_by_prefecture()`
指定した都道府県の物件を検索します。
- **パラメータ**: `p_pref_ids`, `p_sort_by`, `p_sort_order`, `p_items_per_page`, `p_page_number`

#### `search_listings_by_location()`
複合的な位置条件で物件を検索します。
- **パラメータ**: `p_station_id`, `p_line_code`, `p_municipality_id`, `p_keyword`, `p_limit`, `p_offset`

### 2. キーワード検索関数

#### `search_stations_by_keyword(keyword: string)`
キーワードで駅を検索し、駅情報と関連路線を返します。

#### `search_lines_by_keyword(keyword: string)`
キーワードで路線を検索し、路線情報を返します。

#### `search_municipalities_by_keyword(keyword: string)`
キーワードで市区町村を検索します。

### 3. ユーザー関連関数

#### `get_auth_user(user_id: string)`
指定したユーザーIDの認証情報を取得します。

#### `get_avatar_url(user_id: string)`
指定したユーザーIDのアバターURLを取得します。

### 4. PostgreSQL拡張関数（pg_trgm）

#### `gtrgm_*` 関数群
PostgreSQLのpg_trgm拡張機能による類似検索のための関数群です。

#### `set_limit(number)` / `show_limit()`
類似検索の閾値設定・取得を行います。

#### `show_trgm(string)`
文字列のトライグラムを表示します。