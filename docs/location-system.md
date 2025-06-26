# GaijinHub 位置情報システム仕様書

## 概要

GaijinHubでは、日本全国の駅・路線・市区町村・都道府県を基にした位置情報システムを実装しています。特に「駅グループ」という概念を導入し、同じ駅名の複数の駅（JR、私鉄、地下鉄など）を統合的に扱うことで、ユーザーの利便性を向上させています。

## データベース構造

### 主要テーブル

#### 1. station_groups（駅グループ）
同じ名前の駅を1つのグループとして管理するマスターテーブル。

```sql
station_groups
├── station_g_cd (varchar, PK) - 駅グループコード
├── station_name (varchar) - 駅名（漢字）
├── station_name_h (varchar) - 駅名（ひらがな）
├── station_name_r (varchar) - 駅名（ローマ字）
├── lat (numeric) - 緯度
├── lng (numeric) - 経度
├── address (text) - 住所
├── muni_id (varchar, FK) - 市区町村ID
├── pref_id (varchar, FK) - 都道府県ID
└── point (geography) - PostGIS地理情報
```

#### 2. stations（個別駅）
各鉄道会社の個別の駅情報。

```sql
stations
├── station_cd (text, PK) - 駅コード
├── station_g_cd (text, FK → station_groups) - 駅グループコード
├── station_name (text) - 駅名
├── station_name_h (text) - 駅名（ひらがな）
├── station_name_r (text) - 駅名（ローマ字）
├── line_cd (text, FK → lines.line_id) - 路線コード
├── lat/lon (numeric) - 緯度経度
├── muni_id (text, FK) - 市区町村ID
├── pref_id (text, FK) - 都道府県ID
├── e_status (text) - ステータス（'0' = 有効）
└── point (geography) - PostGIS地理情報
```

#### 3. lines（路線）
鉄道路線の情報。

```sql
lines
├── line_id (text, PK) - 路線ID
├── line_name (text) - 路線名
├── line_name_h (text) - 路線名（ひらがな）
├── line_name_r (text) - 路線名（ローマ字）
├── company_cd (text, FK → companies) - 鉄道会社コード
└── e_status (text) - ステータス
```

#### 4. listings（リスティング）
投稿されたリスティング情報。位置情報は`station_g_cd`で管理。

```sql
listings
├── id (uuid, PK)
├── station_g_cd (varchar, FK → station_groups) - 駅グループコード
├── muni_id (varchar, FK) - 市区町村ID
├── is_city_only (boolean) - 市区町村レベルのみの公開フラグ
├── has_location (boolean) - 位置情報有無
├── lat/lng (float8) - 緯度経度（駅またはカスタム）
└── point (geometry) - PostGIS地理情報
```

## 投稿時の位置情報設定

### 1. 位置情報の共有設定について

**重要**: 位置情報の共有設定は、データベースに保存する情報を制御するものではなく、**表示時の公開範囲**を制御するものです。

```
1. ユーザーが位置情報の共有設定を選択
   ├── none - 位置情報を共有しない（駅選択なし）
   ├── station - 駅名まで共有（表示時に駅名を公開）
   └── municipality - 市区町村まで共有（表示時は市区町村のみ公開、駅名は非表示）

2. 「駅名まで共有」または「市区町村まで共有」を選択した場合
   ├── SearchFormで駅を検索（station_groupsから）
   ├── allowedLocationTypes={['station']} により駅のみ選択可能
   └── ユーザーは必ず駅を選択する必要がある

3. 駅が選択されると以下のプロセスで情報が保存される
   【フロントエンド】
   ├── listing.station_id - 駅コード（station_cdまたはid）を設定
   ├── listing.has_location = true
   └── listing.is_city_only - 表示制限フラグ
   
   【データベーストリガー（set_location_from_station_point）】
   station_idが設定されている場合、自動的に以下を取得：
   ├── listing.station_g_cd - stationsテーブルから駅グループコードを取得
   ├── listing.lat/lng - stationsテーブルから座標を取得
   ├── listing.point - PostGIS地理情報を生成
   ├── listing.muni_id - stationsテーブルから市区町村IDを取得
   └── listing.pref_id - muni_idの先頭2桁から都道府県IDを取得
   
   注意: 2024年12月26日のマイグレーションで新しいトリガーに更新
```

### 2. 市区町村IDと都道府県IDの関係

**重要**: `muni_id`（市区町村ID）の先頭2桁は`pref_id`（都道府県ID）と等しい。

例：
- 東京都新宿区: muni_id = "13104" → pref_id = "13"（東京都）
- 大阪府大阪市北区: muni_id = "27127" → pref_id = "27"（大阪府）

この設計により、市区町村IDから都道府県を特定できるため、データベースでpref_idを別途保存しない場合でも都道府県情報を取得可能。

### 3. データ保存と表示の違い

- **データ保存**: 駅を選択した場合、常に詳細な駅情報がデータベースに保存される
- **表示制御**: 共有設定に応じて、公開時の表示レベルが変わる
  - 「駅名まで共有」→ 駅名、市区町村、都道府県を表示
  - 「市区町村まで共有」→ 市区町村、都道府県のみ表示（駅名は非公開）

### 3. 実装コード例

```typescript
// 新規投稿作成時（app/[locale]/listings/new/page.tsx）
// トリガーが自動設定するため、最小限の情報のみ設定
if (locationShareType !== 'none' && selectedLocations.length > 0) {
  const location = selectedLocations[0];
  if (location.type === 'station') {
    locationData = {
      station_id: location.data.station_cd || location.data.id,  // 駅コードのみ設定
      has_location: true,
      is_city_only: locationShareType === 'municipality',
    };
    // muni_id, station_g_cd, lat/lng, pref_id は全てトリガーで自動設定
  }
}

// 表示時の制御例（listings/[id]/page.tsx）
const getLocationDisplay = (listing: Listing) => {
  if (!listing.has_location) return null;
  
  if (listing.is_city_only) {
    // 市区町村までの表示
    return `${listing.municipality.muni_name}, ${listing.prefecture.pref_name}`;
  } else {
    // 駅名まで表示
    return `${listing.station.station_name}駅, ${listing.municipality.muni_name}`;
  }
};
```

## 検索システム

### 1. 主要なRPC関数

#### search_listings（メイン検索関数）
```sql
search_listings(
  p_q text,                    -- キーワード検索
  p_category text,             -- カテゴリフィルタ
  p_station_g_cds text[],      -- 駅グループコード配列
  p_pref_ids text[],           -- 都道府県ID配列
  p_muni_ids text[],           -- 市区町村ID配列
  p_line_ids text[],           -- 路線ID配列
  p_min_price/p_max_price integer,
  p_user_lat/p_user_lng float8, -- ユーザー位置
  p_max_distance_meters integer,
  p_sort text,                 -- newest/closest/price_asc/price_desc
  p_limit/p_offset integer
)
```

#### get_station_groups_with_details（駅グループ検索）
```sql
get_station_groups_with_details(
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
  pref_name varchar,
  lines jsonb,        -- 路線情報のJSON配列
  listing_count bigint
)
```

### 2. 検索フロー

```
1. SearchFormコンポーネントで検索条件を入力
   └── 駅名検索時は station_groups を検索

2. 駅グループ検索API呼び出し
   GET /api/location/station-groups?keyword=新宿
   └── get_station_groups_with_details RPC実行

3. ユーザーが駅を選択
   └── station_g_cd を検索パラメータに追加

4. リスティング検索実行
   GET /api/listings/search?station_g_cds[]=1130208
   └── search_listings RPC実行

5. 結果表示
   └── 選択した駅グループに紐づく全てのリスティング
```

### 3. 多言語対応（ローマ字検索）

駅グループ検索は3つのフィールドで検索可能：
- `station_name` - 漢字（例：新宿）
- `station_name_h` - ひらがな（例：しんじゅく）
- `station_name_r` - ローマ字（例：shinjuku）

```sql
WHERE (p_keyword IS NULL OR 
       sg.station_name ILIKE ('%' || p_keyword || '%') OR
       sg.station_name_h ILIKE ('%' || p_keyword || '%') OR
       sg.station_name_r ILIKE ('%' || p_keyword || '%'))
```

## API エンドポイント

### 位置情報検索API

#### 1. 駅グループ検索
```
GET /api/location/station-groups
Query params:
  - keyword: 検索キーワード
  - limit: 取得件数（デフォルト: 20）
  - offset: オフセット

Response:
{
  data: [{
    station_g_cd: "1130208",
    station_name: "新宿",
    station_name_h: "しんじゅく",
    station_name_r: "shinjuku",
    lines_info: [{
      line_id: "11302",
      line_name: "JR山手線",
      company_name: "JR東日本"
    }, ...],
    listing_count: 10
  }, ...],
  count: 5
}
```

#### 2. 統合位置情報検索
```
GET /api/location/search
Query params:
  - type: line | municipality | prefecture
  - keyword: 検索キーワード

Response: type に応じた検索結果
```

### リスティング検索API

```
GET /api/listings/search
Query params:
  - q: キーワード
  - category: カテゴリ
  - station_g_cds[]: 駅グループコード配列
  - line_ids[]: 路線ID配列
  - muni_ids[]: 市区町村ID配列
  - pref_ids[]: 都道府県ID配列
  - minPrice/maxPrice: 価格範囲
  - userLat/userLng: ユーザー位置
  - maxDistance: 最大距離（メートル）
  - sort: ソート順
  - limit/offset: ページネーション
```

## フロントエンド実装

### SearchFormコンポーネント

位置情報検索の中心となるコンポーネント。

```typescript
// 駅検索時の処理
case 'station':
  endpoint = `/api/location/station-groups?keyword=${encodeURIComponent(term)}`;
  break;

// 検索結果の表示（多言語対応）
const getDisplayName = (item: any) => {
  switch (locationType) {
    case 'station': {
      const stationName = locale !== 'ja' && item.station_name_r 
        ? item.station_name_r 
        : item.station_name;
      return `${stationName} (${item.muni_name || ''}, ${item.pref_name || ''})`;
    }
    // ...
  }
};
```

## 位置情報の優先順位

リスティングの位置情報は以下の優先順位で管理：

1. **駅レベル** (`station_g_cd` が設定されている)
   - 最も詳細な位置情報
   - 駅の座標を使用
   - 複数路線の情報も表示可能

2. **市区町村レベル** (`is_city_only = true`)
   - 駅情報なし、市区町村のみ
   - プライバシーを重視したい場合に使用

3. **位置情報なし** (`has_location = false`)
   - 位置情報を公開しない

## データの整合性

### 重要な制約

1. **駅グループの統一性**
   - 同じ駅名の駅は必ず同じ`station_g_cd`を持つ
   - 例：「新宿」駅は会社に関わらず`station_g_cd = "1130208"`

2. **外部キー制約**
   - `listings.station_g_cd` → `station_groups.station_g_cd`
   - `stations.line_cd` → `lines.line_id`
   - 各テーブルの`muni_id` → `municipalities.muni_id`
   - 各テーブルの`pref_id` → `prefectures.pref_id`

3. **ステータス管理**
   - `stations.e_status = '0'` の駅のみ有効
   - 廃駅などは検索結果に含まれない

## パフォーマンス最適化

1. **インデックス**
   - 各テーブルの主キー
   - 外部キー
   - 検索用フィールド（station_name, station_name_h, station_name_r）

2. **PostGIS**
   - 地理空間インデックスによる高速な距離計算
   - `ST_DWithin` による効率的な範囲検索

3. **JSON集約**
   - 路線情報は`jsonb_agg`で一度に取得
   - N+1問題の回避