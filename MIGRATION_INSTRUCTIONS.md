# チャット機能マイグレーション実行手順

## 重要：手動実行が必要です

Supabase MCPが利用できないため、以下の手順で手動でマイグレーションを実行してください。

## 手順

### 1. Supabaseダッシュボードにアクセス
https://supabase.com/dashboard/project/sidtuvasgtmodtrjmhbw

### 2. SQL Editorを開く
左側メニューから「SQL Editor」をクリック

### 3. 新しいクエリを作成
「New query」ボタンをクリック

### 4. SQLをコピー＆ペースト
`/supabase/migrations/20250101_create_chat_tables.sql`の内容をエディタにペースト

### 5. 実行
「Run」ボタンをクリック（またはCtrl+Enter）

## 実行後の確認

### Table Editorで確認
以下の3つのテーブルが作成されていることを確認：
- ✅ conversations
- ✅ messages  
- ✅ conversation_participants

### Authenticationで確認
「Policies」タブで各テーブルのRLSポリシーが設定されていることを確認

### Realtimeで確認
「Realtime」設定で上記3テーブルが有効になっていることを確認

## 次のステップ

マイグレーション完了後、以下のコマンドで型定義を更新：

```bash
npm run generate-types
```

または

```bash
SUPABASE_ACCESS_TOKEN=sbp_c0048143babf251908d46f4f98b755a45b7be2b2 \
npx supabase gen types typescript --project-id sidtuvasgtmodtrjmhbw > types/supabase.ts
```

## トラブルシューティング

### エラーが発生した場合
- テーブルが既に存在するエラー → 問題ありません（IF NOT EXISTSで保護されています）
- 権限エラー → Supabaseダッシュボードに正しくログインしているか確認
- 構文エラー → SQLファイルの内容が正しくコピーされているか確認