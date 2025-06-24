# GaijinHub 多言語実装仕様書

## 1. 概要

### 1.1 目的
GaijinHubを多言語対応プラットフォームとして、日本に住む外国人コミュニティが言語の壁を越えて情報を共有できるようにする。

### 1.2 実装準備状況 ✅
- **DeepL API Pro キー**: .env.local、Vercel環境変数に設定済み
- **WEBHOOK_SECRET**: GitHub Secrets、Vercel環境変数に設定済み  
- **VERCEL_WEBHOOK_URL**: GitHub Secretsに設定済み
- **実装開始可能**: 全必要な認証情報とAPIキーの準備完了

### 1.3 対応言語
- 日本語 (ja) - デフォルト言語
- 英語 (en)
- 中国語簡体字 (zh-CN)
- 中国語繁体字 (zh-TW)
- 韓国語 (ko)

## 2. アーキテクチャ

### 2.1 ディレクトリ構造（移行後）
```
app/
├── [locale]/                     # 言語別ルーティング
│   ├── layout.tsx               # 多言語レイアウト
│   ├── page.tsx                 # ホームページ
│   ├── listings/
│   │   ├── page.tsx             # リスティング一覧
│   │   ├── new/page.tsx         # 新規投稿
│   │   └── [id]/page.tsx        # リスティング詳細
│   ├── account/
│   │   ├── page.tsx             # アカウント概要
│   │   ├── favorites/page.tsx   # お気に入り一覧
│   │   └── my-listings/page.tsx # 自分の投稿一覧
│   ├── login/page.tsx           # ログイン
│   └── signup/page.tsx          # サインアップ
├── api/                         # APIルート（言語非依存）
└── middleware.ts                # 言語検出・リダイレクト
```

### 2.2 技術スタック
- **i18nライブラリ**: next-intl (v4.0.3)
- **翻訳API**: DeepL API Pro
- **言語検出**: FastText (primary) + DeepL API (fallback)
- **外部スケジューラ**: GitHub Actions (event-driven + hourly backup)

## 3. データベース設計

### 3.1 新規テーブル

#### listing_translations
```sql
CREATE TABLE listing_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_auto_translated BOOLEAN DEFAULT true,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, locale)
);

-- インデックス
CREATE INDEX idx_listing_translations_listing_id ON listing_translations(listing_id);
CREATE INDEX idx_listing_translations_locale ON listing_translations(locale);
```

#### user_preferences
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_ui_language VARCHAR(10) DEFAULT 'ja',
  preferred_content_language VARCHAR(10) DEFAULT 'ja',
  auto_translate_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### translation_queue
```sql
CREATE TABLE translation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  source_locale VARCHAR(10) NOT NULL,
  target_locales TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_translation_queue_status ON translation_queue(status);
CREATE INDEX idx_translation_queue_created_at ON translation_queue(created_at);
```

**ステータス管理:**
- `pending`: 翻訳待ち
- `processing`: 翻訳中
- `completed`: 翻訳完了
- `failed`: 翻訳失敗（retry_count >= 3）

### 3.2 既存テーブルの拡張

#### listings テーブル
```sql
ALTER TABLE listings 
ADD COLUMN original_language VARCHAR(10) DEFAULT 'ja';
```

## 4. API設計

### 4.1 新規エンドポイント

#### 翻訳関連
```typescript
// 投稿の全言語版を取得
GET /api/listings/[id]/translations

// 特定言語の翻訳を取得
GET /api/listings/[id]/translations/[locale]

// 翻訳をリクエスト（手動翻訳トリガー）
POST /api/listings/[id]/translate
Body: { targetLocales: string[] }

// 翻訳キュー処理（GitHub Actions専用）
POST /api/translation/process
Headers: { Authorization: Bearer <WEBHOOK_SECRET> }

// ユーザー設定
GET /api/user/preferences
PUT /api/user/preferences
Body: { 
  preferredUiLanguage?: string,
  preferredContentLanguage?: string,
  autoTranslateEnabled?: boolean
}
```

### 4.2 GitHub Actions + Vercel連携

#### GitHub Actions設定（最適化版）
```yaml
# .github/workflows/translation-queue.yml
name: Process Translation Queue
on:
  # イベント駆動: 新規投稿時のWebhookトリガー
  repository_dispatch:
    types: [new-listing]
  # バックアップ: 1時間間隔のスケジュール（50-100回/月に削減）
  schedule:
    - cron: '0 * * * *'  # 毎時0分（24回/日）
jobs:
  process-translations:
    runs-on: ubuntu-latest
    steps:
      - name: Check Queue and Process
        run: |
          # キューが空でない場合のみ処理実行
          curl -X POST "${{ secrets.VERCEL_WEBHOOK_URL }}" \
          -H "Authorization: Bearer ${{ secrets.WEBHOOK_SECRET }}" \
          -H "Content-Type: application/json" \
          -d '{"check_queue_first": true}' \
          --max-time 30 --retry 2
```

#### Vercel Route Handler実装（App Router・最適化版）
```typescript
// app/api/translation/process/route.ts
export const maxDuration = 8;

export async function POST(req: Request) {
  // 認証確認
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { check_queue_first } = await req.json();
  
  // キューチェック（無駄な実行を避ける）
  if (check_queue_first) {
    const queueCount = await getTranslationQueueCount();
    if (queueCount === 0) {
      return Response.json({ message: 'Queue is empty', processed: 0 });
    }
  }
  
  // 動的バッチサイズ（キューサイズに応じて1-10件）
  const queueSize = await getTranslationQueueCount();
  const batchSize = Math.min(Math.max(queueSize, 1), 10);
  const timeoutMs = batchSize * 2000;
  
  const result = await processTranslationQueue({ 
    maxItems: batchSize, 
    timeoutMs 
  });
  
  return Response.json({ 
    success: true, 
    processed: result.processed,
    remaining: result.remaining 
  });
}
```

### 4.3 新規RPC関数

```sql
-- リスティングと全翻訳を取得
CREATE OR REPLACE FUNCTION get_listing_with_translations(
  p_listing_id UUID,
  p_preferred_locale VARCHAR DEFAULT NULL
) RETURNS TABLE (
  listing JSONB,
  translations JSONB,
  preferred_translation JSONB
) AS $$
-- 実装フェーズで詳細化
$$ LANGUAGE plpgsql;
```

## 5. UI/UX設計

### 5.1 言語切り替えUI
- ヘッダーにUI言語セレクター
- リスティング詳細ページにコンテンツ言語セレクター
- 自動翻訳通知の表示

### 5.2 投稿フォーム
- 投稿言語選択（DeepL検出結果＋手動選択）
- 自動翻訳有効/無効切り替え

## 6. フリーワード検索の多言語対応戦略

### 6.1 クロスリンガル検索（言語の壁を超えた情報アクセス）

**コアコンセプト**: ユーザーの母国語で検索しても、全言語の関連情報がヒットする検索体験

**検索シナリオ例**:
- 英語で「apartment」検索 → 日本語「アパート」投稿もヒット
- 中国語で「工作」検索 → 日本語「仕事」投稿もヒット
- 韓国語で「아르바이트」検索 → 日本語「バイト」投稿もヒット

### 6.2 実装アプローチ

#### A. リアルタイムクエリ翻訳検索
```sql
-- ユーザーの検索クエリを全言語に翻訳して検索
CREATE OR REPLACE FUNCTION search_listings_crosslingual(
  p_query text,
  p_user_locale varchar DEFAULT 'ja'
) RETURNS TABLE (...) AS $$
DECLARE
  translated_queries jsonb;
  search_terms text[];
BEGIN
  -- 1. クエリ言語検出
  -- 2. クエリを全対応言語に翻訳
  -- 3. 原文・翻訳文両方で検索
  -- 4. 言語別重み付けスコアでランキング
END;
$$ LANGUAGE plpgsql;
```

#### B. 検索キーワード翻訳キャッシュ
```sql
-- 頻出キーワードの事前翻訳テーブル
CREATE TABLE search_keyword_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_keyword varchar(255) NOT NULL,
  source_locale varchar(10) NOT NULL,
  target_locale varchar(10) NOT NULL,
  translated_keyword varchar(255) NOT NULL,
  search_count integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(original_keyword, source_locale, target_locale)
);
```

#### C. 重み付けスコアリング
```typescript
// 検索結果の関連性スコア算出
const calculateSearchScore = (
  hit: SearchHit,
  userLocale: string,
  queryLocale: string
): number => {
  let score = hit.baseScore;
  
  // 言語マッチングボーナス
  if (hit.contentLocale === userLocale) score *= 1.5;
  if (hit.contentLocale === queryLocale) score *= 1.3;
  
  // 原文 vs 翻訳文ボーナス
  if (!hit.isTranslated) score *= 1.2;
  
  return score;
};
```

### 6.3 ユーザー体験の最適化

#### 検索結果表示
- **翻訳ソース表示**: 「この結果は英語から翻訳されました」
- **原文表示オプション**: 翻訳結果に原文表示ボタン
- **言語フィルタ**: 特定言語の結果のみ表示

#### 検索支援機能
- **多言語オートコンプリート**: 検索候補を全言語で表示
- **検索クエリ翻訳表示**: 「あなたの検索: apartment → アパート、公寓、아파트」

## 7. 位置情報検索の多言語対応

### 7.1 位置情報検索制限
- **対応範囲**: 日本語・ローマ字表記のみ
- **対象テーブル**: station_groups, lines, municipalities, prefectures
- **既存データ**: 各テーブルにローマ字表記を格納済み
- **検索方針**: 既存の日本語・ローマ字データで十分対応可能

## 7. 言語検出戦略

### 7.1 最適化された言語検出戦略
- **プライマリ**: FastText（無料、95%精度、超高速）
- **フォールバック**: DeepL API（既存翻訳フローと統合）
- 検出失敗時は日本語（ja）をデフォルト
- ユーザーによる手動選択も可能

```typescript
// FastText + DeepLハイブリッドアプローチ
const detectLanguageOptimized = async (text: string): Promise<{
  language: string;
  confidence: number;
  method: 'fasttext' | 'deepl_fallback';
}> => {
  try {
    // FastTextで高速・高精度検出（コスト: 無料）
    const fastTextResult = await detectWithFastText(text);
    if (fastTextResult.confidence > 0.8) {
      return {
        language: fastTextResult.language,
        confidence: fastTextResult.confidence,
        method: 'fasttext'
      };
    }
  } catch (error) {
    console.warn('FastText detection failed, falling back to DeepL');
  }
  
  // フォールバック: DeepL翻訳リクエストから言語検出
  const deeplResult = await detectWithDeepL(text);
  return {
    language: deeplResult.language || 'ja',
    confidence: deeplResult.confidence || 0.5,
    method: 'deepl_fallback'
  };
};
```

## 8. 翻訳戦略

### 8.1 最適化された自動翻訳フロー
1. ユーザー投稿後、FastTextで言語検出（コスト: 無料）
2. 翻訳キューに登録
3. GitHub Actions（イベント駆動 + 1時間バックアップ）でキュー処理
4. DeepL APIで他言語へ翻訳（翻訳のみに特化）
5. listing_translationsテーブルに保存

### 8.2 最適化された処理設定
- **処理頻度**: イベント駆動 + 1時間間隔バックアップ（50-100回/月、95%削減）
- **動的バッチサイズ**: キューサイズに応じて1-10件
- **実行時間制限**: バッチサイズ × 2秒
- **リトライ**: 失敗時3回まで
- **翻訳品質**: DeepL APIによる高品質翻訳
- **コスト制御**: 日次50,000文字、月次1,000,000文字制限

## 9. UX設計

### 9.1 翻訳状態の表示
- **Loading**: Skeletonコンポーネントで翻訳中を表示
- **失敗時**: 原文表示 + 翻訳失敗通知 + 再試行ボタン
- **自動翻訳**: 「○○語から自動翻訳」の通知表示

## 10. SEO対策

### 10.1 hreflangタグとサイトマップ
- Next.js generateMetadata()でhreflangタグ自動生成
- 動的サイトマップで全言語版URL管理
- Open Graphタグで多言語メタデータ対応

## 11. 実装仕様

### 11.1 最適化されたGitHub Actions + Vercel構成
- **処理頻度**: イベント駆動 + 1時間バックアップ（95%実行削減）
- **動的バッチサイズ**: 1-10件（キューサイズに応じて調整）
- **実行時間制限**: バッチサイズ × 2秒
- **認証**: Webhook Secret
- **リトライ**: 失敗時3回まで
- **コスト効率**: 
  - 言語検出コスト: 100%削減（FastText使用）
  - GitHub Actions実行: 95%削減（50-100回/月）
  - DeepL使用量: 翻訳のみに特化

## 12. 実装計画

### 12.1 順次実装ワークフロー

#### Phase 1: 基盤整備
1. データベーススキーマ更新
   - [ ] 新規テーブル作成（listing_translations, user_preferences, translation_queue）
   - [ ] listingsテーブルにoriginal_language列追加
   - [ ] インデックス作成
   - [ ] RPC関数実装

2. Next.js設定
   - [ ] next-intl (v4.0.3) インストール
   - [ ] next.config.js 多言語設定追加
   - [ ] middleware.ts 作成（言語検出・リダイレクト）
   - [ ] app/[locale] ディレクトリ構造作成
   - [ ] 既存ページを app/[locale]/ 配下に移動

#### Phase 2: UI多言語化
1. 翻訳ファイル作成
   - [ ] messages/ja.json 作成（日本語）
   - [ ] messages/en.json 作成（英語）
   - [ ] messages/zh-CN.json 作成（中国語簡体字）
   - [ ] messages/zh-TW.json 作成（中国語繁体字）
   - [ ] messages/ko.json 作成（韓国語）

2. UIコンポーネント国際化
   - [ ] ヘッダーコンポーネント多言語対応
   - [ ] フッターコンポーネント多言語対応
   - [ ] フォームコンポーネント多言語対応
   - [ ] エラーメッセージ多言語対応
   - [ ] 言語切り替えUIコンポーネント実装

#### Phase 3: コンテンツ翻訳
1. DeepL API統合
   - [ ] DeepL APIキー設定・検証
   - [ ] 言語検出機能実装（FastText + DeepL）
   - [ ] 翻訳機能実装・エラーハンドリング

2. 翻訳キューシステム
   - [ ] API エンドポイント実装
     - app/api/listings/[id]/translations/route.ts
     - app/api/listings/[id]/translate/route.ts
     - app/api/translation/process/route.ts
     - app/api/user/preferences/route.ts
   - [ ] 翻訳キュー処理ロジック実装

3. GitHub Actions設定
   - [ ] .github/workflows/translation-queue.yml 作成
   - [ ] GitHub Secrets設定確認

#### Phase 4: 最適化・完了
1. SEO対策
   - [ ] generateMetadata()でhreflangタグ実装
   - [ ] app/sitemap.ts で多言語サイトマップ実装
   - [ ] Open Graphタグ多言語対応

2. 既存データ移行
   - [ ] 既存listingsのoriginal_language更新
   - [ ] ダミーデータ移行・検証

3. テスト・検証
   - [ ] 全機能統合テスト
   - [ ] パフォーマンステスト
   - [ ] SEO検証（hreflang、サイトマップ）

### 12.2 既存データ移行
- **注意**: 現在のlistingsテーブルはダミーデータのみ（本番影響なし）
- 既存listingsを日本語として識別
- ダミーデータの翻訳は実装テスト目的のみ

## 13. 実装手順

### 13.1 開発環境準備
```bash
# プロジェクトディレクトリで作業
cd /home/seito_nakagane/project/GaijinHub

# 依存関係確認
npm run lint
npm run build
```

### 13.2 実装開始
各フェーズを順次実行し、各ステップ完了後に動作確認とテストを行う。

### 13.3 品質保証
- 各フェーズ完了時にTypeScript型チェック・ESLint実行
- 機能実装後に動作テスト実施
- データベース変更後に整合性確認

