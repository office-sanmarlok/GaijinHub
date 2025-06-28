# 翻訳キューの確認方法

## 1. Supabaseダッシュボードから確認（推奨）

### アクセス方法
1. ブラウザで以下のURLにアクセス：
   ```
   https://supabase.com/dashboard/project/sidtuvasgtmodtrjmhbw
   ```

2. ログイン後、左メニューから「Table Editor」を選択

3. 以下のテーブルを確認：
   - **translation_queue**: 翻訳キューの状態
   - **listing_translations**: 実際の翻訳データ

### 確認すべきポイント

#### translation_queueテーブル
- `status`列の値を確認：
  - `pending`: 翻訳待ち
  - `processing`: 処理中
  - `completed`: 完了
  - `failed`: 失敗
- `error_message`: 失敗の場合のエラー内容
- `retry_count`: リトライ回数
- `created_at`, `processed_at`: 作成・処理時刻

#### listing_translationsテーブル
- 実際に翻訳されたデータが存在するか確認
- `locale`列で各言語の翻訳が存在するか確認（en, zh-CN, zh-TW, ko）
- `title`, `body`: 翻訳されたコンテンツ

## 2. SQLクエリで確認

Supabaseダッシュボードの「SQL Editor」で以下のクエリを実行：

```sql
-- 翻訳キューの状態別カウント
SELECT 
  status, 
  COUNT(*) as count,
  MAX(created_at) as latest_created,
  MAX(processed_at) as latest_processed
FROM translation_queue
GROUP BY status
ORDER BY status;

-- 最新の翻訳キューアイテム（10件）
SELECT * FROM translation_queue
ORDER BY created_at DESC
LIMIT 10;

-- 言語別の翻訳データカウント
SELECT 
  locale, 
  COUNT(*) as count
FROM listing_translations
GROUP BY locale
ORDER BY locale;

-- 最新の翻訳データ（10件）
SELECT 
  lt.*, 
  l.title as original_title
FROM listing_translations lt
JOIN listings l ON lt.listing_id = l.id
ORDER BY lt.created_at DESC
LIMIT 10;
```

## 3. GitHub Actionsの確認

翻訳処理がGitHub Actionsで実行されているか確認：

1. GitHubリポジトリにアクセス
2. 「Actions」タブを開く
3. 「Process Translation Queue」ワークフローの実行履歴を確認
4. 失敗している場合はログを確認

## 4. 環境変数の確認

翻訳機能に必要な環境変数が設定されているか確認：

```bash
# .env.localファイルに以下が必要：
DEEPL_API_KEY=your-deepl-api-key
WEBHOOK_SECRET=your-webhook-secret
```

## 5. トラブルシューティング

### 翻訳が作成されない場合
1. translation_queueにレコードが作成されているか確認
2. GitHub Actionsが正常に動作しているか確認
3. DeepL APIキーが有効か確認

### 翻訳が表示されない場合
1. listing_translationsテーブルに翻訳データが存在するか確認
2. フロントエンドが翻訳データを取得・表示するロジックが実装されているか確認
3. ユーザーの言語設定が正しく適用されているか確認