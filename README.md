# GaijinHub - 全国対応外国人コミュニティプラットフォーム

![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.0-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-cyan)

GaijinHubは日本全国の外国人コミュニティ向けの包括的なプラットフォームです。住居、求人、売買、サービスの情報を地域や駅を基準に検索・投稿できるWebアプリケーションです。

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [技術スタック](#技術スタック)
- [主要機能](#主要機能)
- [アーキテクチャ](#アーキテクチャ)
- [セットアップ](#セットアップ)
- [開発環境](#開発環境)
- [API仕様](#api仕様)
- [コンポーネント設計](#コンポーネント設計)
- [データベース設計](#データベース設計)
- [開発ガイドライン](#開発ガイドライン)
- [トラブルシューティング](#トラブルシューティング)
- [今後の拡張計画](#今後の拡張計画)

## 🌟 プロジェクト概要

### ビジョン
日本在住外国人が必要とする情報（住居、仕事、物品、サービス）を効率的に見つけられる全国対応プラットフォームの提供

### 対象ユーザー
- 日本在住の外国人
- 外国人向けサービス提供者
- 国際的なコミュニティメンバー

### 主要価値提案
- **全国対応**: 47都道府県すべての地域をカバー
- **地理ベース検索**: 駅・路線・市区町村での精密な検索
- **多言語対応**: 日本語・英語・中国語のサポート
- **モバイルファースト**: レスポンシブデザインによる最適化

## 🛠 技術スタック

### フロントエンド
- **Next.js 15.3.1** - React フレームワーク（App Router）
- **TypeScript 5.0** - 型安全性の確保
- **Tailwind CSS 3.0** - ユーティリティファーストCSSフレームワーク
- **Shadcn UI** - 高品質UIコンポーネントライブラリ
- **Radix UI** - アクセシブルなプリミティブコンポーネント
- **Lucide React** - アイコンライブラリ

### バックエンド・データベース
- **Supabase** - PostgreSQLベースのBaaS
- **PostGIS** - 地理空間データ拡張
- **Row Level Security (RLS)** - データベースレベルのセキュリティ

### 開発ツール
- **ESLint** - コード品質管理
- **TypeScript** - 静的型チェック
- **Git** - バージョン管理

### インフラ・デプロイ
- **Vercel** - ホスティングプラットフォーム（推奨）
- **Supabase Cloud** - データベース・認証サービス

## 🚀 主要機能

### 1. 高度な検索システム
- **複合検索**: キーワード + 地理条件 + カテゴリ + 価格範囲
- **地理検索オプション**:
  - 駅名検索（全国約10,000駅対応）
  - 路線検索（JR・私鉄・地下鉄）
  - 市区町村検索（1,741自治体）
  - 都道府県検索（47都道府県）
- **リアルタイム候補表示**: 入力時の即座な候補提示
- **距離ベース検索**: GPS位置情報からの範囲検索

### 2. レスポンシブUI
- **モバイルファースト設計**: スマートフォン最適化
- **表示モード切り替え**: グリッド表示・リスト表示
- **ダークモード対応**: システム設定に連動
- **アクセシビリティ**: WCAG 2.1 AA準拠

### 3. 多言語・多文化対応
- **UI言語**: 日本語・英語
- **コンテンツ言語**: 日本語・英語・中国語
- **地域別カスタマイズ**: 地域特性に応じた情報表示

### 4. ユーザー認証・管理
- **Supabase Auth**: メール・ソーシャルログイン
- **プロフィール管理**: アバター・表示名設定
- **お気に入り機能**: 関心のあるリスティング保存
- **投稿管理**: 自分の投稿の編集・削除

## 🏗 アーキテクチャ

### システム全体図
```
┌─────────────────────────────────────────┐
│              Frontend (Next.js)        │
├─────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Pages  │ │Components│ │   API    │ │
│  │          │ │          │ │  Routes  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────┐
│           Supabase Backend              │
├─────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │PostgreSQL│ │   Auth   │ │ Storage  │ │
│  │ + PostGIS│ │          │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

### ディレクトリ構造
```
gaijinhub-production/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/
│   │   └── signup/
│   ├── account/                  # アカウント管理
│   │   ├── favorites/
│   │   └── my-listings/
│   ├── api/                      # API Routes
│   │   ├── favorites/
│   │   ├── listings/
│   │   │   ├── search/           # 検索API
│   │   │   └── near/             # 近隣検索API
│   │   └── location/             # 地理データAPI
│   │       ├── prefectures/
│   │       ├── municipalities/
│   │       ├── lines/
│   │       └── stations/
│   ├── components/               # Reactコンポーネント
│   │   ├── common/               # 共通コンポーネント
│   │   │   ├── SearchForm.tsx
│   │   │   └── StationSearch.tsx
│   │   ├── home/                 # ホームページ用
│   │   │   └── Hero.tsx
│   │   ├── layout/               # レイアウト
│   │   │   └── Header.tsx
│   │   └── ui/                   # Shadcn UIコンポーネント
│   ├── listings/                 # リスティング関連
│   │   ├── [id]/                 # 詳細ページ
│   │   ├── new/                  # 新規投稿
│   │   └── page.tsx              # 一覧ページ
│   ├── lib/                      # ユーティリティ
│   │   ├── hooks/
│   │   ├── supabase/
│   │   └── utils/
│   ├── providers/                # Context Providers
│   ├── types/                    # TypeScript型定義
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/                       # 静的ファイル
│   └── images/
├── supabase/                     # Supabase設定
├── components.json               # Shadcn UI設定
├── database-schema.md            # DB設計仕様
├── frontend-workflow.md          # 開発フロー
├── middleware.ts                 # Next.js middleware
├── next.config.ts                # Next.js設定
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## ⚙️ セットアップ

### 前提条件
- Node.js 18.0以上
- npm または yarn
- Git
- Supabaseアカウント

### 1. プロジェクトクローン
```bash
git clone https://github.com/your-username/gaijinhub-production.git
cd gaijinhub-production
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. 環境変数設定
`.env.local`ファイルを作成：
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 本番環境設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. データベースセットアップ
Supabaseプロジェクトで以下のSQLを実行：

```sql
-- 地理情報拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- 基本テーブル作成（詳細はdatabase-schema.mdを参照）
-- prefectures, municipalities, companies, lines, stations, listings, etc.
```

### 5. 開発サーバー起動
```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 🔧 開発環境

### 利用可能スクリプト
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# コード品質チェック
npm run lint

# 型チェック
npm run type-check
```

### 推奨開発ツール
- **VS Code** - エディタ
- **Thunder Client** - API テスト
- **Supabase Studio** - データベース管理
- **Vercel CLI** - デプロイツール

## 📡 API仕様

### 検索API (`/api/listings/search`)

**エンドポイント**: `GET /api/listings/search`

**パラメータ**:
```typescript
interface SearchParams {
  q?: string;                     // キーワード検索
  category?: string;              // カテゴリ絞り込み
  station_cds?: string;           // 駅コード（カンマ区切り）
  line_ids?: string;              // 路線ID（カンマ区切り）
  muni_ids?: string;              // 市区町村ID（カンマ区切り）
  pref_ids?: string;              // 都道府県ID（カンマ区切り）
  user_lat?: number;              // ユーザー緯度
  user_lng?: number;              // ユーザー経度
  max_distance?: number;          // 最大距離（メートル）
  min_price?: number;             // 最低価格
  max_price?: number;             // 最高価格
  limit?: number;                 // 取得件数（最大100）
  offset?: number;                // オフセット
}
```

**レスポンス**:
```typescript
interface SearchResponse {
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
    location_type: string | null;
    location_names: string[];
  };
}
```

### 地理情報API

#### 都道府県一覧
```
GET /api/location/prefectures
```

#### 市区町村一覧
```
GET /api/location/municipalities/[prefId]
```

#### 路線一覧
```
GET /api/location/lines/[companyId]
```

#### 駅一覧・検索
```
GET /api/location/stations/[lineId]
GET /api/location/stations/search?q={query}&limit={limit}
```

## 🧩 コンポーネント設計

### 主要コンポーネント

#### `SearchForm` - 統合検索フォーム
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
```

#### `StationSearch` - 駅検索コンポーネント
```typescript
interface StationSearchProps {
  onStationSelect: (station: Station | null) => void;
  placeholder?: string;
  className?: string;
}
```

#### `Header` - ナビゲーションヘッダー
- ユーザー認証状態対応
- レスポンシブメニュー
- アバター表示

#### `Hero` - ヒーローセクション
- 背景画像対応
- 検索フォーム統合
- 多言語対応

### コンポーネント階層
```
App
├── Layout
│   ├── Header
│   └── Footer
├── Home
│   └── Hero
│       └── SearchForm
│           └── StationSearch
├── Listings
│   ├── SearchForm
│   ├── ListingCard[]
│   └── Pagination
└── ListingDetail
    ├── ImageGallery
    ├── LocationInfo
    └── ContactForm
```

## 🗄 データベース設計

### 主要テーブル

#### `listings` - メインコンテンツ
```sql
CREATE TABLE listings (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  title text NOT NULL,
  body text NOT NULL,
  body_en text,
  body_zh text,
  category text NOT NULL,
  price integer,
  lat decimal,
  lng decimal,
  point geography(POINT),
  station_id text REFERENCES stations(station_cd),
  muni_id text REFERENCES municipalities(muni_id),
  rep_image_url text,
  has_location boolean DEFAULT false,
  is_city_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### 地理情報テーブル
- `prefectures` - 都道府県（47件）
- `municipalities` - 市区町村（1,741件）
- `companies` - 鉄道会社（約200社）
- `lines` - 路線（約1,500路線）
- `stations` - 駅（約10,000駅）

### インデックス戦略
```sql
-- 地理検索用
CREATE INDEX idx_listings_point ON listings USING GIST (point);

-- 駅検索用
CREATE INDEX idx_listings_station ON listings (station_id);

-- カテゴリ検索用
CREATE INDEX idx_listings_category ON listings (category);

-- 価格範囲検索用
CREATE INDEX idx_listings_price ON listings (price);

-- 作成日時ソート用
CREATE INDEX idx_listings_created_at ON listings (created_at DESC);
```

### データベース関数（予定）
```sql
-- 距離ベース検索
CREATE OR REPLACE FUNCTION search_listings_by_distance(
  p_lat decimal,
  p_lng decimal,
  p_max_distance_meters integer,
  p_category text DEFAULT NULL,
  p_price_min integer DEFAULT NULL,
  p_price_max integer DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
) RETURNS TABLE(...);
```

## 📏 開発ガイドライン

### コーディングスタンダード

#### TypeScript
- 厳密な型定義を使用
- `any`型の使用を避ける
- インターフェースは`interface`、ユニオン型は`type`を使用

#### React
- 関数コンポーネントを使用（クラスコンポーネント禁止）
- カスタムフックで状態ロジックを分離
- Server Componentsを優先、必要な場合のみClient Components

#### CSS/Styling
- Tailwind CSSユーティリティクラスを使用
- カスタムCSSは最小限に抑制
- レスポンシブデザインはモバイルファーストで実装

#### ファイル命名
- コンポーネント: `PascalCase.tsx`
- ページ: `page.tsx`, `layout.tsx`
- ユーティリティ: `camelCase.ts`
- 定数: `UPPER_SNAKE_CASE`


### ライセンス
このプロジェクトは [MIT License](LICENSE) の下で公開されています。

最終更新: 2025年6月8日 