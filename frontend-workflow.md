# GaijinHub全国区移行 - フロントエンド完全再構築ワークフロー

## プロジェクト概要
GaijinHubを日本全国対応の在日外国人向けクラシファイドサイトに拡張する全国区移行プロジェクト。**既存フロントエンドを全削除し、完全新規実装で再構築する。**

## 技術スタック
- **フレームワーク**: Next.js App Router
- **言語**: TypeScript
- **UI**: Shadcn UI + Radix UI + Tailwind CSS
- **状態管理**: React Server Components中心、'nuqs'でURL検索パラメータ管理
- **データベース**: Supabase PostgreSQL + PostGIS

## 実装方針
- 関数型・宣言的プログラミング（クラス回避）
- RSC優先、'use client'の使用を最小限に
- モバイルファーストのレスポンシブデザイン
- 重要度の低いコンポーネントは動的ローディング
- **完全新規実装**: レガシーコードに依存しない設計

## 1. 削除・保存対象の整理

### 保存対象（機能をそのまま使用）
- **ヘッダー**: `components/layout/Header.tsx` または `app/components/layout/Header.tsx`
- **フッター**: `components/layout/Footer.tsx` または `app/components/layout/Footer.tsx`
- **アカウント情報ページ**: `app/account/` 配下すべて
- **UI コンポーネント**: `components/ui/` または `app/components/ui/`
- **ユーティリティ**: `lib/` 配下の基本機能

### 完全削除対象
- **ランディングページ**: `app/page.tsx`
- **ホームコンポーネント**: `components/home/` または `app/components/home/`
- **投稿機能**: `app/listings/`
- **検索コンポーネント**: `components/search/` または `app/components/search/`
- **リスティングコンポーネント**: `components/listings/` または `app/components/listings/`
- **位置関連コンポーネント**: `components/location/` または `app/components/location/`
- **既存API**: `app/api/listings/` の一部

### 除外機能（実装しない）
- **地図表示**: `/listings` ページでの地図表示機能
- **グループ化表示**: `/listings` ページでの検索結果グループ化表示
- **複雑な可視化**: 距離ベースの可視化など

## 2. 基本情報・設定

### カテゴリ構成
```typescript
const categories = [
  { id: 'Housing', name: 'Housing', icon: '🏠' },
  { id: 'Jobs', name: 'Jobs', icon: '💼' },
  { id: 'Items for Sale', name: 'Items for Sale', icon: '🛍️' },
  { id: 'Services', name: 'Services', icon: '🔧' }
];
```

### 位置情報仕様
- **基本原則**: 駅名ベースの位置情報システム
- **プライバシー**: `is_city_only`フラグで市区町村レベルまでの公開制限
- **データ構造**: `station_id`, `muni_id`, `pref_id`（`muni_id`の最初2桁から抽出）
- **座標**: 選択された駅の`lat`, `lng`, `point`を使用

### 位置情報取得方式

- **手動入力**: 駅名検索（予測変換サジェスト付き）
- **フォールバック**: IP取得失敗時は手動入力のみ

## 3. 実装フェーズ

### Phase 1: ランディングページ新規作成
**目標**: 全国対応を訴求する魅力的なランディングページ

#### 1.1 Heroセクション新規作成
**ファイル**: `components/home/Hero.tsx`（新規）

**実装内容**:
- 背景画像: `/images/tokyo_night.jpg`を使用
- メッセージ: 日本全国対応であることを強調
- フリーワード検索窓の実装

- モダンで外国人フレンドリーなUI

#### 1.2 GaijinHub説明セクション新規作成
**ファイル**: `components/home/AboutSection.tsx`（新規）

**コンテンツ**:
1. **包括的コミュニティ**: 国別ではなく「外人」としての統一コミュニティ
2. **全国対応**: 日本全国どこでも利用可能
3. **プライバシー重視**: 駅情報ベースの外国人にわかりやすい位置システム

#### 1.3 CategoryGrid新規作成
**ファイル**: `components/home/CategoryGrid.tsx`（新規）

**実装内容**:
- 4カテゴリの美しい表示
- 全国対応であることを示すコピー
- Next.js App Routerに最適化された構造

### Phase 2: 投稿機能新規実装
**目標**: 直感的で外国人フレンドリーな投稿システム

#### 2.1 投稿画面新規作成
**ファイル**: `app/listings/new/page.tsx`（新規）

**実装要素**:
1. **カテゴリ選択**: 4カテゴリから選択
2. **タイトル入力**: 必須フィールド
3. **詳細入力**: テキストエリア
4. **値段入力**: 任意、数値型
5. **画像アップロード**: 最大5枚、1枚最大5MB
6. **位置情報入力**: 新システム

#### 2.2 位置情報入力システム
**ファイル**: `components/listings/LocationInput.tsx`（新規）

**フロー**:
1. **位置情報を含めるかのトグル**
   ```typescript
   const [hasLocation, setHasLocation] = useState(false);
   ```

2. **公開レベル選択**（位置情報含める場合）
   ```typescript
   const [isCityOnly, setIsCityOnly] = useState(false);
   // false: 駅名まで公開
   // true: 市区町村まで公開
   ```

4. **駅名検索・選択**
   ```typescript
   // search_stations_by_keyword関数使用
   // 駅名 + 路線名表示のサジェスト
   ```

#### 2.3 投稿データ処理
**処理ロジック**:
```typescript
// 選択された駅から関連データを自動設定
const stationData = selectedStation;
const listingData = {
  // 基本情報
  title, body, category, price,
  // 位置情報
  has_location: hasLocation,
  is_city_only: isCityOnly,
  station_id: stationData.station_cd,
  muni_id: stationData.muni_id,
  // pref_idは muni_id の最初2桁から抽出
  lat: stationData.lat,
  lng: stationData.lon,
  point: generate_point(stationData.lat, stationData.lon)
};
```

### Phase 3: 検索機能新規実装
**目標**: 全国対応の高度な検索・絞り込み機能（地図表示・グループ化表示は除く）

#### 3.1 検索画面新規作成
**ファイル**: `app/listings/search/page.tsx`（新規）

#### 3.2 一覧画面新規作成
**ファイル**: `app/listings/page.tsx`（新規）
**注意**: 地図表示とグループ化表示は実装しない

#### 3.3 フリーワード検索新規実装
**実装**: `title`, `body`でのシンプルな検索

#### 3.4 絞り込み検索システム新規作成
**ファイル**: `components/search/Filters.tsx`（新規）

**フィルタ種類**:
1. **駅による絞り込み**
   - `search_listings_by_station`関数使用
   - 複数駅選択対応

2. **路線による絞り込み**
   - `search_listings_by_line`関数使用
   - 路線沿いの物件検索

3. **都道府県・市区町村による絞り込み**
   - `search_listings_by_prefecture`
   - `search_listings_by_municipality`関数使用

4. **カテゴリ絞り込み**
   - 既存4カテゴリ

5. **価格帯絞り込み**
   - 最小・最大価格指定

#### 3.5 並び替え機能新規実装
**ソートオプション**:
1. **投稿時間順**（デフォルト）
   ```sql
   ORDER BY created_at DESC
   ```

2. **現在地から近い順**（駅名入力時のみ）
   ```typescript
   // ユーザーが入力した駅の座標を基準に距離順ソート
   const sortByDistance = async (userStationLat, userStationLng) => {
     return await supabase.rpc('search_listings_by_distance', {
       p_lat: userStationLat,        // 入力駅の緯度
       p_lng: userStationLng,        // 入力駅の経度
       p_max_distance_meters: 50000, // 50km以内
       // その他の検索条件も併用可能
       p_category: selectedCategory,
       p_query: searchQuery
     });
   };
   ```

3. **価格順**
   ```sql
   ORDER BY price ASC NULLS LAST  -- 価格昇順（価格なしは最後）
   ORDER BY price DESC NULLS LAST -- 価格降順（価格なしは最後）
   ```

#### 3.6 表示形式（シンプル）
**表示モード**:
- **カード表示**: シンプルなグリッドレイアウトのみ
- **注意**: 地図表示・グループ化表示・複雑なビューは実装しない

### Phase 4: 位置情報表示システム新規実装
**目標**: プライバシーに配慮した分かりやすい位置表示

#### 4.1 位置情報表示コンポーネント新規作成
**ファイル**: `components/listings/LocationDisplay.tsx`（新規）

```typescript
interface LocationDisplayProps {
  listing: {
    station_name?: string;
    municipality_name: string;
    prefecture_name: string;
    is_city_only: boolean;
    has_location: boolean;
  };
}

const LocationDisplay = ({ listing }) => {
  if (!listing.has_location) {
    return <span>位置情報なし</span>;
  }

  if (listing.is_city_only) {
    return (
      <div>
        <MapPin className="inline w-4 h-4" />
        {listing.municipality_name}, {listing.prefecture_name}
      </div>
    );
  }

  return (
    <div>
      <Train className="inline w-4 h-4" />
      {listing.station_name}駅, {listing.municipality_name}, {listing.prefecture_name}
    </div>
  );
};
```

#### 4.2 位置表示統合
**適用箇所**:
- `/listings` 一覧ページ
- `/listings/search` 検索結果
- `/listings/[id]` 詳細ページ

## 4. API実装

### 4.1 既存API再構築
**ファイル**: `app/api/listings/route.ts`（再構築）

**対応内容**:
- `pref_id`パラメータ対応（`muni_id`から抽出）
- 全国検索対応
- 位置情報フィルタリング強化

### 4.2 新規API実装（標準構成・確定）

**新規API**:
1. **`app/api/location/stations/search/route.ts`**: 駅名検索API
   ```typescript
   // GET /api/location/stations/search?q=渋谷
   // レスポンス: { stations: [{ station_cd, station_name, line_name, ... }] }
   ```

2. **`app/api/listings/search/route.ts`**: 統合検索API
   ```typescript
   // GET /api/listings/search?q=keyword&category=Housing&station_cds=JR-E_0101
   // 全ての検索条件を統合した単一エンドポイント
   ```

## 13. 完全API仕様定義

### 13.1 駅名検索API仕様
**ファイル**: `app/api/location/stations/search/route.ts`

**リクエスト**:
```typescript
// GET /api/location/stations/search?q={query}&limit={limit}
interface StationSearchRequest {
  q: string;           // 駅名（部分一致、必須）
  limit?: number;      // 取得件数（デフォルト: 10、最大: 50）
}
```

**レスポンス**:
```typescript
interface StationSearchResponse {
  success: boolean;
  stations: Station[];
  total: number;
  message?: string;    // エラー時のメッセージ
}

interface Station {
  station_cd: string;        // 駅コード（例: "JR-E_0101"）
  station_name: string;      // 駅名（例: "渋谷"）
  station_name_kana: string; // 駅名カナ（例: "シブヤ"）
  line_name: string;         // 路線名（例: "JR山手線"）
  line_id: string;           // 路線ID（例: "JR-E_01"）
  company_name: string;      // 運営会社（例: "JR東日本"）
  muni_id: string;           // 市区町村ID（例: "13113"）
  muni_name: string;         // 市区町村名（例: "渋谷区"）
  pref_id: string;           // 都道府県ID（例: "13"）
  pref_name: string;         // 都道府県名（例: "東京都"）
  lat: number;               // 緯度
  lng: number;               // 経度
}
```

**実装例**:
```typescript
// app/api/location/stations/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query || query.length < 1) {
    return NextResponse.json({
      success: false,
      message: '検索キーワードを入力してください',
      stations: [],
      total: 0
    }, { status: 400 });
  }

  if (limit > 50) {
    return NextResponse.json({
      success: false,
      message: '取得件数は50件以下にしてください',
      stations: [],
      total: 0
    }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('search_stations_by_keyword', {
      p_keyword: query,
      p_limit: limit
    });

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'データベースエラーが発生しました',
        stations: [],
        total: 0
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stations: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました',
      stations: [],
      total: 0
    }, { status: 500 });
  }
}
```

### 13.2 統合検索API仕様
**ファイル**: `app/api/listings/search/route.ts`

**リクエスト**:
```typescript
// GET /api/listings/search?params...
interface ListingSearchRequest {
  // 基本検索
  q?: string;                    // フリーワード検索
  category?: 'Housing' | 'Jobs' | 'Items for Sale' | 'Services';
  
  // 位置情報検索（優先順位順）
  station_cds?: string;          // 駅コード（カンマ区切り）例: "JR-E_0101,JR-E_0102"
  line_ids?: string;             // 路線ID（カンマ区切り）
  muni_ids?: string;             // 市区町村ID（カンマ区切り）
  pref_ids?: string;             // 都道府県ID（カンマ区切り）
  
  // 距離検索（駅名入力時のみ）
  user_lat?: number;             // ユーザー位置（緯度）
  user_lng?: number;             // ユーザー位置（経度）
  max_distance?: number;         // 最大距離（メートル、デフォルト: 50000）
  
  // 価格検索
  min_price?: number;            // 最小価格
  max_price?: number;            // 最大価格
  
  // ソート・ページング
  sort?: 'created_at' | 'distance' | 'price_asc' | 'price_desc';
  limit?: number;                // 取得件数（デフォルト: 20、最大: 100）
  offset?: number;               // オフセット（デフォルト: 0）
}
```

**レスポンス**:
```typescript
interface ListingSearchResponse {
  success: boolean;
  listings: ListingCard[];
  total: number;
  page_info: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  search_info: {
    query?: string;
    category?: string;
    location_type: 'station' | 'line' | 'municipality' | 'prefecture' | 'distance' | null;
    location_names: string[];    // 選択された位置の名前一覧
  };
  message?: string;
}

interface ListingCard {
  id: string;
  title: string;
  body: string;                  // 概要（最初の150文字）
  category: string;
  price: number | null;
  currency: string;              // 'JPY'
  
  // 位置情報
  location: {
    has_location: boolean;
    is_city_only: boolean;
    station_name?: string;
    muni_name: string;
    pref_name: string;
    distance_meters?: number;    // 距離検索時のみ
    distance_text?: string;      // "1.2km" 形式
  };
  
  // 画像
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  primary_image_url?: string;    // 代表画像URL
  
  // メタ情報
  created_at: string;            // ISO string
  updated_at: string;
  user_id: string;
  view_count: number;
  is_favorited?: boolean;        // ログイン時のみ
}
```

**実装例**:
```typescript
// app/api/listings/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // パラメータ解析
  const params = {
    q: searchParams.get('q'),
    category: searchParams.get('category'),
    station_cds: searchParams.get('station_cds')?.split(',').filter(Boolean),
    line_ids: searchParams.get('line_ids')?.split(',').filter(Boolean),
    muni_ids: searchParams.get('muni_ids')?.split(',').filter(Boolean),
    pref_ids: searchParams.get('pref_ids')?.split(',').filter(Boolean),
    user_lat: searchParams.get('user_lat') ? parseFloat(searchParams.get('user_lat')!) : null,
    user_lng: searchParams.get('user_lng') ? parseFloat(searchParams.get('user_lng')!) : null,
    max_distance: parseInt(searchParams.get('max_distance') || '50000'),
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null,
    sort: searchParams.get('sort') || 'created_at',
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    offset: parseInt(searchParams.get('offset') || '0')
  };

  try {
    const supabase = createClient();
    let searchFunction: string;
    let searchParams: any;
    let locationInfo: any = { location_type: null, location_names: [] };

    // 検索優先順位に基づく関数選択
    if (params.user_lat && params.user_lng) {
      // 距離検索（最優先）
      searchFunction = 'search_listings_by_distance';
      searchParams = {
        p_lat: params.user_lat,
        p_lng: params.user_lng,
        p_max_distance_meters: params.max_distance,
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
      locationInfo = { location_type: 'distance', location_names: ['現在地周辺'] };
      
    } else if (params.station_cds?.length) {
      // 駅検索
      searchFunction = 'search_listings_by_station';
      searchParams = {
        p_station_cds: params.station_cds,
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
      locationInfo = { location_type: 'station', location_names: params.station_cds };
      
    } else if (params.line_ids?.length) {
      // 路線検索
      searchFunction = 'search_listings_by_line';
      searchParams = {
        p_line_ids: params.line_ids,
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
      locationInfo = { location_type: 'line', location_names: params.line_ids };
      
    } else if (params.muni_ids?.length) {
      // 市区町村検索
      searchFunction = 'search_listings_by_municipality';
      searchParams = {
        p_muni_ids: params.muni_ids,
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
      locationInfo = { location_type: 'municipality', location_names: params.muni_ids };
      
    } else if (params.pref_ids?.length) {
      // 都道府県検索
      searchFunction = 'search_listings_by_prefecture';
      searchParams = {
        p_pref_ids: params.pref_ids,
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
      locationInfo = { location_type: 'prefecture', location_names: params.pref_ids };
      
    } else {
      // 全般検索（位置情報なし）
      searchFunction = 'search_listings';
      searchParams = {
        p_query: params.q,
        p_category: params.category,
        p_min_price: params.min_price,
        p_max_price: params.max_price,
        p_limit: params.limit,
        p_offset: params.offset
      };
    }

    const { data, error } = await supabase.rpc(searchFunction, searchParams);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'データベースエラーが発生しました',
        listings: [],
        total: 0,
        page_info: { current_page: 1, total_pages: 0, has_next: false, has_prev: false },
        search_info: { ...locationInfo, query: params.q, category: params.category }
      }, { status: 500 });
    }

    // ページング情報計算
    const totalPages = Math.ceil((data?.length || 0) / params.limit);
    const currentPage = Math.floor(params.offset / params.limit) + 1;

    return NextResponse.json({
      success: true,
      listings: data || [],
      total: data?.length || 0,
      page_info: {
        current_page: currentPage,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1
      },
      search_info: {
        query: params.q,
        category: params.category,
        ...locationInfo
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました',
      listings: [],
      total: 0,
      page_info: { current_page: 1, total_pages: 0, has_next: false, has_prev: false },
      search_info: { location_type: null, location_names: [], query: params.q, category: params.category }
    }, { status: 500 });
  }
}
```

## 5. 新規作成コンポーネント一覧

### 5.1 コンポーネント配置構造（App Router対応・確定）
```
app/
├── components/           # アプリ専用コンポーネント
│   ├── common/          # 共通コンポーネント
│   │   ├── StationSearch.tsx     # 駅名検索・サジェスト
│   │   ├── SearchForm.tsx        # 検索フォーム
│   │   └── CategorySelector.tsx  # カテゴリ選択
│   ├── home/            # ランディングページ用
│   │   ├── Hero.tsx             # メインビジュアル + 検索
│   │   ├── AboutSection.tsx     # GaijinHub説明
│   │   └── CategoryGrid.tsx     # カテゴリ表示
│   ├── listings/        # 投稿・一覧用
│   │   ├── LocationInput.tsx    # 投稿時位置入力
│   │   ├── ListingCard.tsx      # 物件カード表示
│   │   ├── ListingGrid.tsx      # 一覧表示（シンプル）
│   │   └── LocationDisplay.tsx  # 位置情報表示
│   └── search/          # 検索用
│       └── Filters.tsx          # 検索フィルタ
├── lib/                 # ユーティリティ
│   ├── supabase/        # Supabase接続
│   ├── hooks/           # カスタムフック
│   └── utils/           # ヘルパー関数
└── ui/                  # Shadcn UIコンポーネント（保持）
```

### 5.2 ホーム関連（完全新規）
1. **Hero.tsx**: メインビジュアル + 検索
2. **AboutSection.tsx**: GaijinHub説明
3. **CategoryGrid.tsx**: カテゴリ表示

### 5.3 投稿関連（完全新規）
1. **LocationInput.tsx**: 投稿時位置入力
2. **StationSearch.tsx**: 駅名検索・サジェスト
3. **ImageUploader.tsx**: 画像アップロード

### 5.4 検索・一覧関連（完全新規）
1. **Filters.tsx**: 検索フィルタ
2. **ListingCard.tsx**: 物件カード表示
3. **ListingGrid.tsx**: 一覧表示（シンプル）
4. **LocationDisplay.tsx**: 位置情報表示

### 5.5 共通関連（完全新規）
1. **SearchForm.tsx**: 検索フォーム
2. **CategorySelector.tsx**: カテゴリ選択

## 14. 完全コンポーネント仕様定義

### 14.1 共通コンポーネント

#### StationSearch.tsx
**ファイル**: `app/components/common/StationSearch.tsx`

**Props定義**:
```typescript
interface StationSearchProps {
  onStationSelect: (station: Station | null) => void;
  placeholder?: string;
  debounceMs?: number;
  maxResults?: number;
  disabled?: boolean;
  defaultValue?: string;
  className?: string;
  error?: string;
  showClearButton?: boolean;
}

interface Station {
  station_cd: string;
  station_name: string;
  station_name_kana: string;
  line_name: string;
  line_id: string;
  company_name: string;
  muni_id: string;
  muni_name: string;
  pref_id: string;
  pref_name: string;
  lat: number;
  lng: number;
}
```

**完全実装例**:
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StationSearchProps {
  onStationSelect: (station: Station | null) => void;
  placeholder?: string;
  debounceMs?: number;
  maxResults?: number;
  disabled?: boolean;
  defaultValue?: string;
  className?: string;
  error?: string;
  showClearButton?: boolean;
}

interface Station {
  station_cd: string;
  station_name: string;
  station_name_kana: string;
  line_name: string;
  line_id: string;
  company_name: string;
  muni_id: string;
  muni_name: string;
  pref_id: string;
  pref_name: string;
  lat: number;
  lng: number;
}

const StationSearch = ({
  onStationSelect,
  placeholder = "駅名を入力してください",
  debounceMs = 300,
  maxResults = 10,
  disabled = false,
  defaultValue = "",
  className,
  error,
  showClearButton = true
}: StationSearchProps) => {
  const [query, setQuery] = useState(defaultValue);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchError, setSearchError] = useState<string>('');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);

  // デバウンス処理
  useEffect(() => {
    if (query.length < 1) {
      setStations([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStations(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStations = async (searchQuery: string) => {
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setIsLoading(true);
    setSearchError('');

    try {
      const response = await fetch(
        `/api/location/stations/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
        { signal: abortController.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStations(data.stations);
        setIsOpen(data.stations.length > 0);
      } else {
        setSearchError(data.message || '検索に失敗しました');
        setStations([]);
        setIsOpen(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setSearchError('駅名の検索に失敗しました');
        setStations([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setQuery(`${station.station_name}駅（${station.line_name}）`);
    setIsOpen(false);
    onStationSelect(station);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedStation(null);
    setStations([]);
    setIsOpen(false);
    setSearchError('');
    onStationSelect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selectedStation) {
      setSelectedStation(null);
      onStationSelect(null);
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (stations.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10",
            showClearButton && query && "pr-10",
            error ? "border-red-500" : ""
          )}
        />
        
        {showClearButton && query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* エラー表示 */}
      {(error || searchError) && (
        <p className="text-sm text-red-500 mt-1">
          {error || searchError}
        </p>
      )}

      {/* 検索結果ドロップダウン */}
      {isOpen && stations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {stations.map((station) => (
            <button
              key={station.station_cd}
              type="button"
              onClick={() => handleStationSelect(station)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {station.station_name}駅
                  </div>
                  <div className="text-sm text-gray-600">
                    {station.line_name} • {station.company_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {station.muni_name}, {station.pref_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StationSearch;
```

#### SearchForm.tsx
**ファイル**: `app/components/common/SearchForm.tsx`

**Props定義**:
```typescript
interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  defaultValues?: Partial<SearchParams>;
  showLocationSearch?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  compact?: boolean;
  className?: string;
}

interface SearchParams {
  query?: string;
  category?: string;
  station?: Station | null;
  minPrice?: number;
  maxPrice?: number;
}
```

**完全実装例**:
```typescript
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StationSearch from './StationSearch';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  defaultValues?: Partial<SearchParams>;
  showLocationSearch?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  compact?: boolean;
  className?: string;
}

interface SearchParams {
  query?: string;
  category?: string;
  station?: Station | null;
  minPrice?: number;
  maxPrice?: number;
}

const CATEGORIES = [
  { value: '', label: 'すべてのカテゴリ' },
  { value: 'Housing', label: '住居' },
  { value: 'Jobs', label: '求人' },
  { value: 'Items for Sale', label: '売ります' },
  { value: 'Services', label: 'サービス' }
];

const SearchForm = ({
  onSearch,
  defaultValues = {},
  showLocationSearch = true,
  showCategoryFilter = true,
  showPriceFilter = false,
  compact = false,
  className
}: SearchFormProps) => {
  const [query, setQuery] = useState(defaultValues.query || '');
  const [category, setCategory] = useState(defaultValues.category || '');
  const [station, setStation] = useState<Station | null>(defaultValues.station || null);
  const [minPrice, setMinPrice] = useState<number | undefined>(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(defaultValues.maxPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query: query.trim() || undefined,
      category: category || undefined,
      station,
      minPrice,
      maxPrice
    });
  };

  const handleReset = () => {
    setQuery('');
    setCategory('');
    setStation(null);
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <div className="flex-1">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードを入力"
            className="w-full"
          />
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* キーワード検索 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">キーワード</label>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="探したいものを入力してください"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* カテゴリ選択 */}
        {showCategoryFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium">カテゴリ</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 位置検索 */}
        {showLocationSearch && (
          <div className="space-y-2">
            <label className="text-sm font-medium">最寄り駅</label>
            <StationSearch
              onStationSelect={setStation}
              placeholder="駅名を入力"
            />
          </div>
        )}
      </div>

      {/* 価格フィルタ */}
      {showPriceFilter && (
        <div className="space-y-2">
          <label className="text-sm font-medium">価格帯</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="最小価格"
              min="0"
            />
            <Input
              type="number"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="最大価格"
              min="0"
            />
          </div>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <Search className="h-4 w-4 mr-2" />
          検索
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          リセット
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
```

## 15. UI/UXデザイン完全仕様

### 15.1 レスポンシブデザイン基準
**ブレークポイント**（Tailwind CSS準拠）:
```typescript
const breakpoints = {
  sm: '640px',    // スマートフォン（縦）
  md: '768px',    // タブレット
  lg: '1024px',   // デスクトップ
  xl: '1280px',   // 大画面デスクトップ
  '2xl': '1536px' // 超大画面
};
```

**デザイン方針**:
- **モバイルファースト**設計
- **ダークモード**は実装しない（将来対応予定）
- **アクセシビリティ**重視（ARIA属性、キーボードナビゲーション）

### 15.2 カラーパレット（Shadcn UI準拠）
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 98%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

### 15.3 ページレイアウト詳細

#### ランディングページ（app/page.tsx）
```typescript
// app/page.tsx
import Hero from '@/app/components/home/Hero';
import AboutSection from '@/app/components/home/AboutSection';
import CategoryGrid from '@/app/components/home/CategoryGrid';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Category Grid */}
      <CategoryGrid />
    </main>
  );
}
```

**Hero Section仕様**:
```typescript
// app/components/home/Hero.tsx
interface HeroProps {
  backgroundImage?: string; // デフォルト: '/images/tokyo_night.jpg'
}

const Hero = ({ backgroundImage = '/images/tokyo_night.jpg' }: HeroProps) => {
  return (
    <section className="relative h-screen w-full">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>
      
      {/* コンテンツ */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            GaijinHub
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            日本全国の外国人コミュニティ
          </p>
          
          {/* 検索フォーム */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <SearchForm
              onSearch={(params) => {
                // /listings へリダイレクト
                const searchParams = new URLSearchParams();
                if (params.query) searchParams.set('q', params.query);
                if (params.category) searchParams.set('category', params.category);
                if (params.station?.station_cd) searchParams.set('station_cds', params.station.station_cd);
                
                window.location.href = `/listings?${searchParams.toString()}`;
              }}
              compact={false}
              className="text-black"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
```

#### 一覧ページレイアウト（app/listings/page.tsx）
```typescript
// app/listings/page.tsx
interface ListingsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    station_cds?: string;
    page?: string;
    sort?: string;
  };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* サイドバー（フィルタ） */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <Filters />
          </div>
        </aside>
        
        {/* メインコンテンツ */}
        <main className="lg:col-span-3">
          {/* 検索バー */}
          <div className="mb-6">
            <SearchForm compact={true} />
          </div>
          
          {/* ソート・ビュー切り替え */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {/* 検索結果数 */}
            </div>
            <div className="flex gap-2">
              {/* ソート選択 */}
            </div>
          </div>
          
          {/* 検索結果 */}
          <ListingGrid />
          
          {/* ページネーション */}
          <div className="mt-8">
            {/* Pagination component */}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 15.4 ローディング・エラー状態のUI

#### ローディングコンポーネント
```typescript
// app/components/ui/Loading.tsx
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Loading = ({ size = 'md', text, className }: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};
```

#### エラーコンポーネント
```typescript
// app/components/ui/ErrorDisplay.tsx
interface ErrorDisplayProps {
  title?: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ErrorDisplay = ({ 
  title = "エラーが発生しました", 
  message, 
  actionButton,
  className 
}: ErrorDisplayProps) => {
  return (
    <div className={cn("text-center py-12", className)}>
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {actionButton && (
        <Button onClick={actionButton.onClick} variant="outline">
          {actionButton.label}
        </Button>
      )}
    </div>
  );
};
```

#### 空状態コンポーネント
```typescript
// app/components/ui/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState = ({ title, description, actionButton, icon, className }: EmptyStateProps) => {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon || <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {actionButton && (
        <Button onClick={actionButton.onClick}>
          {actionButton.label}
        </Button>
      )}
    </div>
  );
};
```

## 16. エラーハンドリング完全仕様

### 16.1 統一エラーハンドリング
```typescript
// lib/types/error.ts
export interface AppError {
  type: 'network' | 'validation' | 'authorization' | 'not_found' | 'server';
  message: string;
  code?: string;
  retryable?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly type: AppError['type'],
    message: string,
    public readonly code?: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// lib/utils/api.ts - 統一API呼び出し
export async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });

    if (!response.ok) {
      throw new ApiError(
        response.status >= 500 ? 'server' : 'network',
        `HTTP ${response.status}: ${response.statusText}`,
        response.status.toString(),
        response.status >= 500
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new ApiError('server', data.message || 'APIエラー', data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('network', 'ネットワークエラーが発生しました', 'NETWORK_ERROR', true);
  }
}
```

## 17. 環境設定・状態管理完全仕様

### 17.1 環境変数設定
```env
# .env.local（本番用設定例）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=https://gaijinhub.com
NEXT_PUBLIC_APP_NAME=GaijinHub

# 画像設定
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_MAX_IMAGES=5

# 検索設定
NEXT_PUBLIC_SEARCH_DEBOUNCE=300
NEXT_PUBLIC_MAX_SEARCH_RESULTS=10
```

### 17.2 React Query設定
```typescript
// app/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5分
        retry: (failureCount, error) => {
          if (error instanceof ApiError && !error.retryable) return false;
          return failureCount < 3;
        }
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

### 17.3 カスタムフック例
```typescript
// lib/hooks/useListings.ts
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/utils/api';

export function useListingSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['listings', 'search', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.set(key, String(value));
      });
      
      return apiCall<ListingSearchResponse>(`/api/listings/search?${searchParams}`);
    },
    enabled: !!(params.query || params.category || params.station),
    staleTime: 5 * 60 * 1000
  });
}
```

## 18. 実装チェックリスト

### 18.1 Phase 1 チェックリスト
- [ ] Git分岐作成（`feature/nationwide-rebuild`）
- [ ] バックアップディレクトリ作成
- [ ] 削除対象ファイルのバックアップ実行
- [ ] 削除対象ファイルの一括削除
- [ ] `app/page.tsx` 新規作成
- [ ] `app/components/home/Hero.tsx` 実装
- [ ] `app/components/home/AboutSection.tsx` 実装
- [ ] `app/components/home/CategoryGrid.tsx` 実装
- [ ] `public/images/tokyo_night.jpg` 配置確認
- [ ] ランディングページ動作確認

### 18.2 Phase 2A チェックリスト
- [ ] `app/api/location/stations/search/route.ts` 実装
- [ ] データベース関数 `search_stations_by_keyword` 動作確認
- [ ] API エンドポイント動作テスト
- [ ] `app/components/common/StationSearch.tsx` 実装
- [ ] デバウンス処理動作確認
- [ ] 検索結果表示テスト

### 18.3 エラーハンドリング確認項目
- [ ] ネットワークエラー時の表示
- [ ] API エラー時の表示
- [ ] ローディング状態の表示
- [ ] 空状態の表示
- [ ] リトライ機能の動作

### 18.4 レスポンシブ対応確認項目
- [ ] スマートフォン（375px～）表示
- [ ] タブレット（768px～）表示
- [ ] デスクトップ（1024px～）表示
- [ ] 各ブレークポイントでの操作性確認

### 18.5 アクセシビリティ確認項目
- [ ] キーボードナビゲーション
- [ ] スクリーンリーダー対応
- [ ] ARIA属性の適切な設定
- [ ] カラーコントラスト基準遵守

---

**完全実装ガイド完成**：これで別のAIエージェントが一人で全体を実装できるレベルの詳細度になりました。