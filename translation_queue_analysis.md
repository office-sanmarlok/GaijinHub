# Translation Queue と Listing Translations テーブル構造分析

## 1. テーブル構造

### translation_queue テーブル
```sql
CREATE TABLE IF NOT EXISTS translation_queue (
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
```

**TypeScript型定義:**
```typescript
translation_queue: {
  Row: {
    created_at: string | null
    error_message: string | null
    id: string
    listing_id: string
    processed_at: string | null
    retry_count: number | null
    source_locale: string
    status: string | null
    target_locales: string[]
  }
}
```

### listing_translations テーブル
```sql
CREATE TABLE IF NOT EXISTS listing_translations (
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
```

**TypeScript型定義:**
```typescript
listing_translations: {
  Row: {
    body: string
    created_at: string | null
    id: string
    is_auto_translated: boolean | null
    listing_id: string
    locale: string
    title: string
    translated_at: string | null
    updated_at: string | null
  }
}
```

## 2. 翻訳フロー

### 2.1 翻訳キューへの追加 (`addToTranslationQueue`)
1. リスティングの詳細を取得
2. ソース言語の検出（未指定の場合）
3. ターゲット言語の決定（ソース言語以外の全言語）
4. `translation_queue`テーブルに新規エントリ追加

### 2.2 翻訳処理 (`processTranslationQueue`)
1. 保留中のキューアイテムを取得（`get_pending_translations` RPC）
2. 各アイテムについて：
   - ステータスを`processing`に更新
   - DeepL APIで翻訳実行
   - `listing_translations`テーブルに翻訳結果を保存
   - ステータスを`completed`に更新
3. エラー時は`failed`ステータスに更新（リトライカウント管理）

## 3. 関連RPC関数

- `get_pending_translations`: 保留中の翻訳タスクを取得
- `mark_translation_processing`: タスクを処理中にマーク
- `mark_translation_completed`: タスクを完了にマーク
- `mark_translation_failed`: タスクを失敗にマーク（リトライ管理含む）
- `get_listing_with_translations`: リスティングと翻訳を一緒に取得

## 4. 使用箇所

- `/app/api/debug/translation-queue/route.ts`: デバッグ用エンドポイント
- `/app/api/listings/[id]/translations/route.ts`: 個別リスティングの翻訳エンドポイント
- `/app/[locale]/listings/[id]/page.tsx`: リスティング詳細ページ
- `/scripts/process-translations.ts`: バッチ処理スクリプト
- `/scripts/test-translation-components.ts`: テストスクリプト

## 5. チェックボックス式タスクリスト

- [x] テーブル構造の確認
  - [x] translation_queueテーブルの構造確認
  - [x] listing_translationsテーブルの構造確認
  - [x] インデックスの確認

- [x] 型定義の確認
  - [x] TypeScript型定義の確認
  - [x] RPC関数の型定義確認

- [x] 翻訳フローの理解
  - [x] キューへの追加処理の確認
  - [x] 翻訳処理フローの確認
  - [x] エラーハンドリングとリトライロジックの確認

- [x] 使用箇所の調査
  - [x] APIエンドポイントでの使用確認
  - [x] フロントエンドでの使用確認
  - [x] スクリプトでの使用確認

## 6. 重要な発見事項

1. **ユニーク制約**: `listing_translations`は`(listing_id, locale)`のユニーク制約があり、同じリスティングの同じ言語の翻訳は1つのみ
2. **リトライ管理**: `translation_queue`では最大3回までリトライ可能
3. **自動翻訳フラグ**: `is_auto_translated`フラグで自動翻訳と手動翻訳を区別
4. **バッチ処理**: 複数の翻訳を効率的に処理するためのキュー方式採用
5. **言語検出**: 原文の言語が不明な場合は自動検出機能を使用