# GaijinHub 翻訳機能の問題分析

## 現在の実装状況

### ✅ 実装済みの機能

1. **言語検出機能** (`/app/lib/language-detection.ts`)
   - VSCode言語検出ライブラリとDeepL APIのハイブリッド検出
   - 高精度な言語判定と内部ロケールコードへのマッピング

2. **翻訳API統合** (`/app/lib/deepl/client.ts`)
   - DeepLClient クラスによる翻訳機能
   - 複数言語への同時翻訳対応

3. **翻訳キューシステム** (`/app/lib/translation-queue.ts`)
   - 非同期翻訳処理のためのキュー管理
   - バッチ処理とリトライ機能

4. **データベーススキーマ** (`/supabase/migrations/20250625_i18n_schema.sql`)
   - `listing_translations` テーブル
   - `user_preferences` テーブル
   - `translation_queue` テーブル
   - `get_listing_with_translations` RPC関数

5. **API エンドポイント**
   - `/api/listings/[id]/translate` - 翻訳キューへの追加
   - `/api/listings/[id]/translations` - 翻訳データの取得
   - `/api/translation/process` - 翻訳キューの処理

### ❌ 問題点：翻訳が表示されない原因

1. **検索機能で翻訳データが使用されていない**
   - `search_listings` RPC関数は `listing_translations` テーブルとJOINしていない
   - オリジナル言語のタイトル・ボディのみを返している
   - ユーザーの言語設定（`preferred_content_language`）が考慮されていない

2. **リスティング詳細ページで翻訳が表示されない**
   - 翻訳データの取得は試みているが、実際の表示には使用されていない
   - `ListingDetailClient` コンポーネントに翻訳データが渡されていない

3. **フロントエンド全般で翻訳データが活用されていない**
   - 一覧ページ、詳細ページ、お気に入りページなど、すべてオリジナル言語のみ表示
   - 作成されたRPC関数 `get_listing_with_translations` が未使用

## 問題を解決するために必要な修正

### 1. データベース関数の修正
```sql
-- search_listings 関数を修正して翻訳データを含めるようにする
-- ユーザーの preferred_content_language に基づいて適切な翻訳を返す
```

### 2. フロントエンドの修正
- リスティング一覧：翻訳されたタイトル・ボディを表示
- リスティング詳細：翻訳データを取得して表示
- 言語切り替えUI：ユーザーが表示言語を選択できるようにする

### 3. 翻訳キューの確認
- 翻訳キューが正しく処理されているか確認
- GitHub Actionsのワークフローが動作しているか確認
- 翻訳データが実際にデータベースに保存されているか確認

## 推奨される次のステップ

1. まず翻訳データがデータベースに存在するか確認
2. `search_listings` RPC関数を修正して翻訳データを返すようにする
3. フロントエンドコンポーネントを修正して翻訳データを表示する
4. ユーザーの言語設定を活用して適切な翻訳を表示する