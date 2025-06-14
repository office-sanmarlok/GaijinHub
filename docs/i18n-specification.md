# GaijinHub 多言語実装仕様書

## 1. 概要

### 1.1 目的
GaijinHubを多言語対応プラットフォームとして、日本に住む外国人コミュニティが言語の壁を越えて情報を共有できるようにする。

### 1.2 対応言語
- 日本語 (ja) - デフォルト言語
- 英語 (en)
- 中国語簡体字 (zh-CN)
- 中国語繁体字 (zh-TW)
- 韓国語 (ko)

### 1.3 基本方針
- **URL構造**: 言語別URL（`/[locale]/...`）でUI言語を制御
- **コンテンツ**: すべての投稿は自動翻訳により全言語で閲覧可能
- **データ共有**: 言語に関わらず同一のコンテンツを共有

## 2. アーキテクチャ

### 2.1 URL構造
```
/ja/listings          # 日本語UI
/en/listings          # 英語UI
/zh-CN/listings       # 中国語簡体字UI
/zh-TW/listings       # 中国語繁体字UI
/ko/listings          # 韓国語UI
```

### 2.2 言語の役割分担
1. **UI言語**: URLパスで決定、インターフェース要素の表示言語
2. **コンテンツ言語**: ユーザーが選択可能、投稿内容の表示言語

### 2.3 技術スタック
- **i18nライブラリ**: next-intl (v4.0.3) - 既にインストール済み
- **翻訳API**: Google Cloud Translation API または DeepL API
- **状態管理**: Cookie（UI言語）+ React State（コンテンツ言語）

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### 3.2 既存テーブルの拡張

#### listings テーブル
```sql
ALTER TABLE listings 
ADD COLUMN detected_language VARCHAR(10) DEFAULT 'ja',
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

// ユーザー設定
GET /api/user/preferences
PUT /api/user/preferences
Body: { 
  preferredUiLanguage?: string,
  preferredContentLanguage?: string,
  autoTranslateEnabled?: boolean
}
```

### 4.2 既存エンドポイントの拡張

#### /api/listings/search
```typescript
// クエリパラメータ追加
interface SearchParams {
  // 既存のパラメータ...
  contentLocale?: string;      // 検索対象の言語
  includeTranslations?: boolean; // 翻訳版も検索対象に含める
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
BEGIN
  -- 実装詳細は実装フェーズで
END;
$$ LANGUAGE plpgsql;

-- 多言語検索
CREATE OR REPLACE FUNCTION search_listings_multilingual(
  p_query TEXT,
  p_search_locales TEXT[] DEFAULT ARRAY['ja', 'en', 'zh-CN', 'zh-TW', 'ko'],
  p_category TEXT DEFAULT NULL,
  -- 他の既存パラメータ...
) RETURNS TABLE (
  -- 既存の返り値 + translations JSONB
) AS $$
BEGIN
  -- 実装詳細は実装フェーズで
END;
$$ LANGUAGE plpgsql;
```

## 5. UI/UX設計

### 5.1 言語切り替えUI

#### ヘッダーコンポーネント
```tsx
<Header>
  {/* 既存の要素 */}
  <LanguageSwitcher 
    currentLocale={locale}
    type="ui" // UI言語切り替え
  />
</Header>
```

#### リスティング詳細ページ
```tsx
<ListingDetail>
  <ContentLanguageSelector
    available={['ja', 'en', 'zh-CN', 'zh-TW', 'ko']}
    current={contentLocale}
    onChange={setContentLocale}
    missingTranslations={['ko']} // 未翻訳の言語を表示
  />
  
  {/* 選択された言語でコンテンツ表示 */}
  <h1>{listing.translations[contentLocale]?.title || listing.title}</h1>
  
  {/* 自動翻訳の注意書き */}
  {listing.translations[contentLocale]?.isAutoTranslated && (
    <AutoTranslationNotice />
  )}
</ListingDetail>
```

### 5.2 投稿フォーム
```tsx
<ListingForm>
  {/* 投稿言語の選択 */}
  <LanguageSelector
    label="投稿する言語"
    value={postingLanguage}
    onChange={setPostingLanguage}
  />
  
  {/* 自動翻訳オプション */}
  <AutoTranslateToggle
    checked={autoTranslate}
    onChange={setAutoTranslate}
    targetLanguages={['ja', 'en', 'zh-CN', 'zh-TW', 'ko']}
  />
</ListingForm>
```

## 6. 翻訳戦略

### 6.1 自動翻訳フロー
1. ユーザーが任意の言語で投稿
2. 言語を自動検出（または手動選択）
3. バックグラウンドジョブで他言語へ翻訳
4. 翻訳完了後、listing_translationsテーブルに保存

### 6.2 翻訳優先順位
1. **即時翻訳**: タイトルのみ（検索性確保）
2. **非同期翻訳**: 本文（キューイング）

### 6.3 翻訳品質管理
- 自動翻訳フラグで識別
- 将来的にユーザーによる翻訳修正機能を検討

## 7. SEO対策

### 7.1 URL構造
```
# 各言語版は独立したURL
/ja/listings/123
/en/listings/123
/zh-CN/listings/123
```

### 7.2 メタタグ
```html
<!-- hreflangタグ -->
<link rel="alternate" hreflang="ja" href="https://gaijinhub.com/ja/listings/123" />
<link rel="alternate" hreflang="en" href="https://gaijinhub.com/en/listings/123" />
<link rel="alternate" hreflang="zh-CN" href="https://gaijinhub.com/zh-CN/listings/123" />

<!-- Open Graphタグ -->
<meta property="og:locale" content="ja_JP" />
<meta property="og:locale:alternate" content="en_US" />
<meta property="og:locale:alternate" content="zh_CN" />
```

### 7.3 サイトマップ
```xml
<url>
  <loc>https://gaijinhub.com/ja/listings/123</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://gaijinhub.com/en/listings/123"/>
  <xhtml:link rel="alternate" hreflang="zh-CN" href="https://gaijinhub.com/zh-CN/listings/123"/>
</url>
```

## 8. パフォーマンス考慮事項

### 8.1 キャッシュ戦略
- 翻訳結果はデータベースに永続化（API呼び出し削減）
- 静的な翻訳（UI要素）はビルド時に処理
- 動的な翻訳（ユーザーコンテンツ）はオンデマンド

### 8.2 遅延読み込み
- 初期表示は検出言語またはデフォルト言語
- 他言語の翻訳は必要時にフェッチ

### 8.3 バンドルサイズ最適化
- 言語別の翻訳ファイルは動的インポート
- 使用しない言語のリソースは読み込まない

## 9. 移行計画

### 9.1 段階的実装
1. **Phase 1**: 基盤整備（1-2週間）
   - データベーススキーマ更新
   - next-intl設定
   - 基本的なルーティング

2. **Phase 2**: UI多言語化（2-3週間）
   - 翻訳ファイル作成
   - UIコンポーネントの国際化
   - 言語切り替えUI実装

3. **Phase 3**: コンテンツ翻訳（3-4週間）
   - 翻訳API統合
   - 自動翻訳フロー実装
   - 既存コンテンツの翻訳

4. **Phase 4**: 最適化（1-2週間）
   - パフォーマンスチューニング
   - SEO最適化
   - ユーザビリティ改善

### 9.2 既存データの移行
- 既存のlistingsは日本語として扱う
- バッチ処理で段階的に翻訳を生成

## 10. テスト計画

### 10.1 単体テスト
- 翻訳関数のテスト
- 言語検出のテスト
- フォールバック処理のテスト

### 10.2 統合テスト
- 言語切り替えフローのE2Eテスト
- 多言語検索のテスト
- SEOタグの生成テスト

### 10.3 パフォーマンステスト
- 翻訳APIのレスポンスタイム
- ページロード時間（各言語版）
- 大量データでの検索性能

## 11. 今後の拡張性

### 11.1 追加言語対応
- 設定ファイルに言語コードを追加するだけで対応可能な設計

### 11.2 ユーザー投稿翻訳
- コミュニティによる翻訳改善機能
- 翻訳品質の評価システム

### 11.3 機械学習統合
- より精度の高い翻訳エンジンへの切り替え
- コンテキストを考慮した翻訳